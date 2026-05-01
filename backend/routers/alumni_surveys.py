"""
Alumni-facing survey routes.

Provides read-only access to ACTIVE surveys and a self-profile resolver.
All routes require a valid JWT (any user type); no staff/admin gate.
No UUIDs are exposed — only human-readable IDs (SRVY-XXXXXX, ALMN-XXXXXX).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, and_

from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key
from models.auth import CurrentUser
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from models.surveys import Survey, SurveyResponse
from schemas.surveys import SurveyPublic, SurveyStatus
from schemas.questions import QuestionPublic
from utils.timezone import get_current_time_gmt8
from utils.rbac import require_authenticated
from services.queries.surveys_queries import (
    get_survey_by_id,
    get_survey_question_counts_batch,
)
from services.queries.survey_questions_queries import get_survey_questions_with_details


ALUMNI_SURVEYS_CACHE_NAMESPACE = "alumni_surveys"
ALUMNI_SURVEYS_LIST_TTL = 60
ALUMNI_SURVEYS_DETAIL_TTL = 120


router = APIRouter(
    prefix="/alumni",
    tags=["alumni-surveys"],
)


# ---------------------------------------------------------------------------
# GET /alumni/surveys  — list ACTIVE surveys
# ---------------------------------------------------------------------------


@router.get("/surveys", response_model=StandardResponse)
def list_active_surveys_for_alumni(
    session: Session = Depends(get_session),
    _: CurrentUser = Depends(require_authenticated),
):
    """
    List all ACTIVE surveys available to alumni.
    Returns survey metadata and question counts; no question details (use detail endpoint).
    Cached for 60 seconds.
    """
    try:
        cache_key = generate_cache_key(ALUMNI_SURVEYS_CACHE_NAMESPACE, status="ACTIVE")
        return cache_get_or_set(
            cache_key,
            lambda: _build_alumni_survey_list(session),
            ttl=ALUMNI_SURVEYS_LIST_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.SERVER_ERROR_INTERNAL.value,
                message=str(e),
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# GET /alumni/surveys/{survey_id}  — survey detail with questions
# ---------------------------------------------------------------------------


@router.get("/surveys/{survey_id}", response_model=StandardResponse)
def get_alumni_survey_detail(
    survey_id: str,
    session: Session = Depends(get_session),
    _: CurrentUser = Depends(require_authenticated),
):
    """
    Get a single ACTIVE survey with its full ordered question list.
    Returns 404 if not found or not ACTIVE.
    Cached for 120 seconds.
    """
    try:
        cache_key = generate_cache_key(
            f"{ALUMNI_SURVEYS_CACHE_NAMESPACE}:detail", survey_id=survey_id
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_alumni_survey_detail(session, survey_id),
            ttl=ALUMNI_SURVEYS_DETAIL_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.SERVER_ERROR_INTERNAL.value,
                message=str(e),
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# GET /alumni/me/responded-surveys  — survey IDs already responded to
# ---------------------------------------------------------------------------


@router.get("/me/responded-surveys", response_model=StandardResponse)
def get_responded_survey_ids(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Return the survey_ids (human-readable) that the current alumni has already
    submitted a response to. Used to pre-populate the 'Completed' tab on load.
    """
    from models.alumni import Alumni

    if not current_user.id:
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEYS_RETRIEVED.value,
            message="No alumni profile — no responses",
            data={"responded_survey_ids": []},
            timestamp=get_current_time_gmt8(),
        )

    alumni = session.exec(
        select(Alumni).where(
            and_(
                Alumni.user_ref_id == current_user.id,
                Alumni.is_deleted.is_(False),
            )
        )
    ).first()

    if not alumni:
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEYS_RETRIEVED.value,
            message="No alumni profile — no responses",
            data={"responded_survey_ids": []},
            timestamp=get_current_time_gmt8(),
        )

    # Fetch all response rows for this alumni, joining surveys to get survey_id
    rows = session.exec(
        select(SurveyResponse, Survey)
        .join(Survey, SurveyResponse.survey_ref_id == Survey.id)
        .where(
            and_(
                SurveyResponse.alumni_ref_id == alumni.id,
                SurveyResponse.is_deleted.is_(False),
            )
        )
    ).all()

    responded_ids = list({survey.survey_id for _, survey in rows})

    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEYS_RETRIEVED.value,
        message="Responded survey IDs retrieved",
        data={"responded_survey_ids": responded_ids},
        timestamp=get_current_time_gmt8(),
    )


# ---------------------------------------------------------------------------
# GET /alumni/surveys/{survey_id}/my-response — fetch own response
# ---------------------------------------------------------------------------


@router.get("/surveys/{survey_id}/my-response", response_model=StandardResponse)
def get_my_survey_response(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Fetch the current alumni's response to a specific survey.
    Returns 404 if no response is found.
    """
    from models.alumni import Alumni

    if not current_user.id:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="No alumni profile found",
            ).model_dump(mode="json"),
        )

    alumni = session.exec(
        select(Alumni).where(
            and_(
                Alumni.user_ref_id == current_user.id,
                Alumni.is_deleted.is_(False),
            )
        )
    ).first()

    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="No alumni profile found",
            ).model_dump(mode="json"),
        )

    # Resolve survey internal ID
    survey = get_survey_by_id(session, survey_id)
    if not survey:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.SURVEY_NOT_FOUND.value,
                message="Survey not found",
            ).model_dump(mode="json"),
        )

    # Fetch the response
    response = session.exec(
        select(SurveyResponse).where(
            and_(
                SurveyResponse.survey_ref_id == survey.id,
                SurveyResponse.alumni_ref_id == alumni.id,
                SurveyResponse.is_deleted.is_(False),
            )
        )
    ).first()

    if not response:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="No response found for this survey",
            ).model_dump(mode="json"),
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEY_RETRIEVED.value,
        message="Survey response retrieved",
        data={"response": response.model_dump(mode="json")},
        timestamp=get_current_time_gmt8(),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_alumni_survey_list(session: Session) -> StandardResponse:
    """Fetch all ACTIVE surveys with question counts."""
    surveys = session.exec(
        select(Survey).where(
            and_(
                Survey.status == SurveyStatus.ACTIVE,
                Survey.is_deleted.is_(False),
            )
        )
    ).all()

    survey_ref_ids = [s.id for s in surveys]
    counts = get_survey_question_counts_batch(session, survey_ref_ids)

    survey_data = []
    for survey in surveys:
        data = SurveyPublic.model_validate(survey).model_dump(mode="json")
        data["question_count"] = counts.get(survey.id, 0)
        survey_data.append(data)

    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEYS_RETRIEVED.value,
        message="Active surveys retrieved",
        data={"surveys": survey_data, "total": len(survey_data)},
        timestamp=get_current_time_gmt8(),
    )


def _build_alumni_survey_detail(session: Session, survey_id: str) -> StandardResponse:
    """Fetch one ACTIVE survey with full ordered questions list."""
    survey = get_survey_by_id(session, survey_id)

    if not survey:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.SURVEY_NOT_FOUND.value,
                message="Survey not found",
            ).model_dump(mode="json"),
        )

    if survey.status != SurveyStatus.ACTIVE:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.SURVEY_NOT_ACTIVE.value,
                message="Survey is not currently active",
            ).model_dump(mode="json"),
        )

    questions_with_details = get_survey_questions_with_details(session, survey.id)

    data = SurveyPublic.model_validate(survey).model_dump(mode="json")
    data["question_count"] = len(questions_with_details)

    # Flatten SurveyQuestionWithDetails → list of QuestionPublic dicts
    # sorted by order_index (already sorted by the query)
    data["questions"] = [
        QuestionPublic.model_validate(sqwd.question).model_dump(mode="json")
        for sqwd in questions_with_details
    ]

    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEY_RETRIEVED.value,
        message="Survey retrieved",
        data=data,
        timestamp=get_current_time_gmt8(),
    )
