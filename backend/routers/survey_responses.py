"""
Survey response submission and results/analytics routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.surveys import SurveySubmission, SurveyStatus
from models.auth import CurrentUser
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from utils.rbac import require_staff_or_admin, require_authenticated
from services.queries.surveys_queries import get_survey_by_id
from services.queries.survey_responses_queries import (
    submit_survey_response,
    get_survey_results,
    export_survey_responses,
)


SURVEYS_CACHE_NAMESPACE = "surveys"
SURVEYS_ANALYTICS_TTL = 120


# ---------------------------------------------------------------------------
# Staff-only router: results & export
# ---------------------------------------------------------------------------

router = APIRouter(
    prefix="/surveys",
    tags=["survey-responses"],
    dependencies=[Depends(require_staff_or_admin)],
)


# ---------------------------------------------------------------------------
# Respond router: any authenticated user
# ---------------------------------------------------------------------------

respond_router = APIRouter(
    prefix="/surveys",
    tags=["survey-responses"],
)


@respond_router.post(
    "/{survey_id}/respond",
    response_model=StandardResponse,
    status_code=201,
)
def respond_to_survey(
    survey_id: str,
    body: SurveySubmission,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Submit a response to an active survey. Any authenticated user can respond."""
    try:
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

        # Must be ACTIVE
        if survey.status != SurveyStatus.ACTIVE:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_ACTIVE.value,
                    message="Survey is not currently active",
                ).model_dump(mode="json"),
            )

        # Check closes_at
        if survey.closes_at and get_current_time_gmt8().replace(tzinfo=None) > survey.closes_at.replace(tzinfo=None):
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_CLOSED.value,
                    message="Survey submission period has ended",
                ).model_dump(mode="json"),
            )

        result = submit_survey_response(
            session,
            survey,
            body,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RESPONSE_SUBMITTED.value,
            message="Survey response submitted successfully",
            data=result,
            timestamp=get_current_time_gmt8(),
        )
    except ValueError as e:
        msg = str(e)
        if msg == "ALUMNI_NOT_FOUND":
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message="Alumni not found",
                ).model_dump(mode="json"),
            )
        if msg == "DUPLICATE_RESPONSE":
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_RESPONSE.value,
                    message="You have already responded to this survey",
                ).model_dump(mode="json"),
            )
        if msg.startswith("REQUIRED_QUESTION_MISSING:"):
            question_id = msg.split(":", 1)[1]
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Required question {question_id} was not answered",
                ).model_dump(mode="json"),
            )
        if msg.startswith("QUESTION_NOT_IN_SURVEY:"):
            question_id = msg.split(":", 1)[1]
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Question {question_id} is not part of this survey",
                ).model_dump(mode="json"),
            )
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=msg
            ).model_dump(mode="json"),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Results & Analytics (staff-only)
# ---------------------------------------------------------------------------


@router.get("/{survey_id}/results", response_model=StandardResponse)
def get_survey_results_route(survey_id: str, session: Session = Depends(get_session)):
    """
    Get aggregated results for a survey.
    Returns per-question statistics: choice distributions, averages, YES/NO counts,
    SCALE distributions, NUMBER stats, and TEXT samples.
    """
    try:
        cache_key = generate_cache_key(f"{SURVEYS_CACHE_NAMESPACE}:results", survey_id=survey_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_survey_results_response(session, survey_id),
            ttl=SURVEYS_ANALYTICS_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.get("/{survey_id}/export", response_model=StandardResponse)
def export_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """
    Export all survey responses as raw JSON.
    Each response includes all answers with joined question texts.
    For anonymous surveys, respondent identity is omitted.
    """
    try:
        cache_key = generate_cache_key(f"{SURVEYS_CACHE_NAMESPACE}:export", survey_id=survey_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_survey_export_response(session, survey_id),
            ttl=SURVEYS_ANALYTICS_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_required_survey(session: Session, survey_id: str):
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
    return survey


def _build_survey_results_response(session: Session, survey_id: str) -> StandardResponse:
    survey = _get_required_survey(session, survey_id)
    results = get_survey_results(session, survey)
    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEY_RESULTS_RETRIEVED.value,
        message="Survey results retrieved",
        data=results,
        timestamp=get_current_time_gmt8(),
    )


def _build_survey_export_response(session: Session, survey_id: str) -> StandardResponse:
    survey = _get_required_survey(session, survey_id)
    export_data = export_survey_responses(session, survey)
    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEY_RESULTS_RETRIEVED.value,
        message="Survey responses exported",
        data=export_data,
        timestamp=get_current_time_gmt8(),
    )
