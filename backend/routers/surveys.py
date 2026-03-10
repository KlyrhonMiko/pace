"""
Core survey management routes (CRUD, status transitions, templates).
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.surveys import (
    SurveyCreate,
    SurveyUpdate,
    SurveyPublic,
    SurveyStatus,
)
from models.auth import CurrentUser
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from utils.rbac import require_staff_or_admin
from services.queries.surveys_queries import (
    get_survey_by_id,
    get_deleted_survey_by_id,
    check_duplicate_survey_title,
    get_survey_question_count,
    get_survey_question_counts_batch,
    list_surveys,
    create_survey,
    update_survey,
    soft_delete_survey,
    restore_survey,
    set_survey_status,
)
from services.queries.survey_questions_queries import (
    get_survey_questions_with_details,
)

SURVEYS_CACHE_NAMESPACE = "surveys"
SURVEYS_LIST_TTL = 300
SURVEYS_DETAIL_TTL = 300

router = APIRouter(
    prefix="/surveys",
    tags=["surveys"],
    dependencies=[Depends(require_staff_or_admin)],
)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------


@router.post("/templates/tracer-study", response_model=StandardResponse, status_code=201)
def create_tracer_study_template(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Create a pre-built tracer study survey template"""
    try:
        from schemas.surveys import SurveyCreate

        template_data = SurveyCreate(
            title="Tracer Study Survey",
            description="Graduate Tracer Study - Track employment outcomes and career development of alumni.",
            is_anonymous=False,
            allow_multiple_responses=False,
        )
        survey = create_survey(
            session,
            template_data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        survey_data = SurveyPublic.model_validate(survey).dict()
        survey_data["question_count"] = 0
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CREATED.value,
            message="Tracer study template created",
            data=survey_data,
            timestamp=get_current_time_gmt8(),
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
# Survey CRUD
# ---------------------------------------------------------------------------


@router.post("", response_model=StandardResponse, status_code=201)
def create_survey_route(
    body: SurveyCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Create a new survey"""
    try:
        dup = check_duplicate_survey_title(session, body.title)
        if dup:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_TITLE_EXISTS.value,
                    message="Survey title already exists",
                ).model_dump(mode="json"),
            )
        survey = create_survey(
            session,
            body,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        survey_data = SurveyPublic.model_validate(survey).dict()
        survey_data["question_count"] = 0
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CREATED.value,
            message="Survey created successfully",
            data=survey_data,
            timestamp=get_current_time_gmt8(),
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


@router.get("", response_model=StandardResponse)
def list_surveys_route(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    """List all surveys with filtering and pagination"""
    try:
        cache_key = generate_cache_key(
            SURVEYS_CACHE_NAMESPACE,
            skip=skip,
            limit=limit,
            search=search,
            status=status,
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_surveys_list_response(session, skip, limit, search, status),
            ttl=SURVEYS_LIST_TTL,
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


@router.get("/{survey_id}", response_model=StandardResponse)
def get_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """Get a survey by ID with all questions"""
    try:
        cache_key = generate_cache_key(f"{SURVEYS_CACHE_NAMESPACE}:detail", survey_id=survey_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_survey_detail_response(session, survey_id),
            ttl=SURVEYS_DETAIL_TTL,
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


@router.patch("/{survey_id}", response_model=StandardResponse)
def update_survey_route(
    survey_id: str,
    body: SurveyUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Update a survey"""
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
        if body.title and body.title != survey.title:
            dup = check_duplicate_survey_title(session, body.title)
            if dup:
                raise HTTPException(
                    status_code=409,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.SURVEY_TITLE_EXISTS.value,
                        message="Survey title already exists",
                    ).model_dump(mode="json"),
                )
        updated = update_survey(
            session,
            survey,
            body,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        survey_data = SurveyPublic.model_validate(updated).dict()
        survey_data["question_count"] = get_survey_question_count(
            session, updated.survey_code
        )
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_UPDATED.value,
            message="Survey updated",
            data=survey_data,
            timestamp=get_current_time_gmt8(),
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


@router.delete("/{survey_id}", response_model=StandardResponse)
def delete_survey_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Soft delete a survey"""
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
        soft_delete_survey(
            session,
            survey,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_DELETED.value,
            message="Survey deleted",
            timestamp=get_current_time_gmt8(),
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


@router.post("/{survey_id}/restore", response_model=StandardResponse)
def restore_survey_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Restore a soft-deleted survey"""
    try:
        survey = get_deleted_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_FOUND.value,
                    message="Deleted survey not found",
                ).model_dump(mode="json"),
            )
        restored = restore_survey(
            session,
            survey,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        data = SurveyPublic.model_validate(restored).dict()
        data["question_count"] = get_survey_question_count(
            session, restored.survey_code
        )
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RESTORED.value,
            message="Survey restored",
            data=data,
            timestamp=get_current_time_gmt8(),
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
# Status transitions
# ---------------------------------------------------------------------------


@router.post("/{survey_id}/publish", response_model=StandardResponse)
def publish_survey_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Publish a draft survey (DRAFT → ACTIVE)"""
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
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_DRAFT.value,
                    message="Only DRAFT surveys can be published",
                ).model_dump(mode="json"),
            )
        question_count = get_survey_question_count(session, survey.survey_code)
        if question_count == 0:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Survey must have at least one question to be published",
                ).model_dump(mode="json"),
            )
        updated = set_survey_status(
            session,
            survey,
            SurveyStatus.ACTIVE,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        data = SurveyPublic.model_validate(updated).dict()
        data["question_count"] = question_count
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_PUBLISHED.value,
            message="Survey published",
            data=data,
            timestamp=get_current_time_gmt8(),
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


@router.post("/{survey_id}/close", response_model=StandardResponse)
def close_survey_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Close an active survey (ACTIVE → CLOSED)"""
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
        if survey.status != SurveyStatus.ACTIVE:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_ACTIVE.value,
                    message="Only ACTIVE surveys can be closed",
                ).model_dump(mode="json"),
            )
        updated = set_survey_status(
            session,
            survey,
            SurveyStatus.CLOSED,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        data = SurveyPublic.model_validate(updated).dict()
        data["question_count"] = get_survey_question_count(
            session, updated.survey_code
        )
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CLOSED.value,
            message="Survey closed",
            data=data,
            timestamp=get_current_time_gmt8(),
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


@router.post("/{survey_id}/reopen", response_model=StandardResponse)
def reopen_survey_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Reopen a closed survey (CLOSED → ACTIVE)"""
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
        if survey.status != SurveyStatus.CLOSED:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Only CLOSED surveys can be reopened",
                ).model_dump(mode="json"),
            )
        updated = set_survey_status(
            session,
            survey,
            SurveyStatus.ACTIVE,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        data = SurveyPublic.model_validate(updated).dict()
        data["question_count"] = get_survey_question_count(
            session, updated.survey_code
        )
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_UPDATED.value,
            message="Survey reopened",
            data=data,
            timestamp=get_current_time_gmt8(),
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
# Helpers
# ---------------------------------------------------------------------------


def _build_surveys_list_response(
    session: Session,
    skip: int,
    limit: int,
    search: Optional[str],
    status: Optional[str],
) -> StandardResponse:
    surveys, total = list_surveys(session, skip, limit, search, status)
    survey_codes = [s.survey_code for s in surveys]
    counts = get_survey_question_counts_batch(session, survey_codes)
    survey_data = []
    for survey in surveys:
        data = SurveyPublic.model_validate(survey).dict()
        data["question_count"] = counts.get(survey.survey_code, 0)
        survey_data.append(data)
    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEYS_RETRIEVED.value,
        message="Surveys retrieved successfully",
        data={
            "surveys": survey_data,
            "total": total,
            "count": len(surveys),
            "offset": skip,
            "limit": limit,
            "has_more": (skip + limit) < total,
        },
        timestamp=get_current_time_gmt8(),
    )


def _build_survey_detail_response(session: Session, survey_id: str) -> StandardResponse:
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
    questions = get_survey_questions_with_details(session, survey.survey_code)
    data = SurveyPublic.model_validate(survey).dict()
    data["questions"] = [q.dict() for q in questions]
    data["question_count"] = len(questions)
    return StandardResponse(
        success=True,
        code=SuccessCode.SURVEY_RETRIEVED.value,
        message="Survey retrieved successfully",
        data=data,
        timestamp=get_current_time_gmt8(),
    )
