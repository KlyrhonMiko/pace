import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from core.database import get_session
from schemas.surveys import (
    SurveyCreate,
    SurveyUpdate,
    SurveyPublic,
    SurveyQuestionCreate,
    SurveyQuestionWithDetails,
    SurveyQuestionReorderRequest,
    SurveyDistributionConfigCreateRequest,
    SurveyDistributionConfigPublic,
    SurveyStatus,
    DistributionStatus,
)
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
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
    get_survey_questions_with_details,
    add_question_to_survey,
    add_questions_batch,
    remove_question_from_survey,
    reorder_survey_questions,
    get_distribution_config,
    configure_distribution,
    update_distribution_config,
    # Phase 1.4B
    send_survey_invitations,
    send_survey_reminders,
    get_distribution_stats,
    get_non_respondents,
    # Phase 1.6
    get_survey_results,
    export_survey_responses,
)

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post(
    "/templates/tracer-study", response_model=StandardResponse, status_code=201
)
def create_tracer_study_template_route(session: Session = Depends(get_session)):
    """Create a new DRAFT survey pre-populated with 10 standard CHED Tracer Study questions."""
    try:
        # Guard: reject if a non-deleted tracer study survey already exists
        existing = check_duplicate_survey_title(session, "CHED Tracer Study")
        if existing:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_SURVEY_TITLE.value,
                    message=f"A Tracer Study template already exists (ID: {existing.survey_id}). "
                    f"Delete or archive it before creating a new one.",
                ).model_dump(mode="json"),
            )
        from services.survey_templates import create_tracer_study_template

        survey = create_tracer_study_template(session)
        question_count = get_survey_question_count(session, survey.survey_code)
        data = SurveyPublic.model_validate(survey).dict()
        data["question_count"] = question_count
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CREATED.value,
            message="Tracer Study template created successfully",
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
# Survey CRUD
# ---------------------------------------------------------------------------


@router.post("", response_model=StandardResponse, status_code=201)
def create_survey_route(body: SurveyCreate, session: Session = Depends(get_session)):
    """Create a new survey (starts in DRAFT). Duplicate titles rejected."""
    try:
        existing = check_duplicate_survey_title(session, body.title)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_SURVEY_TITLE.value,
                    message=f"Survey with this title already exists (ID: {existing.survey_id})",
                ).model_dump(mode="json"),
            )
        survey = create_survey(session, body)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CREATED.value,
            message="Survey created successfully",
            data=SurveyPublic.model_validate(survey),
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
    """List all surveys with pagination and filtering"""
    try:
        surveys, total = list_surveys(session, skip, limit, search, status)
        # Batch fetch all question counts in ONE query instead of N
        survey_codes = [s.survey_code for s in surveys]
        counts = get_survey_question_counts_batch(session, survey_codes)
        survey_data = []
        for survey in surveys:
            d = SurveyPublic.model_validate(survey).dict()
            d["question_count"] = counts.get(survey.survey_code, 0)
            survey_data.append(d)
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
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.get("/{survey_id}", response_model=StandardResponse)
def get_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """Get a survey with all its composed questions"""
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
        questions = get_survey_questions_with_details(session, survey.survey_code)
        d = SurveyPublic.model_validate(survey).dict()
        d["questions"] = [q.dict() for q in questions]
        d["question_count"] = len(questions)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RETRIEVED.value,
            message="Survey retrieved successfully",
            data=d,
            timestamp=get_current_time_gmt8(),
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
    survey_id: str, body: SurveyUpdate, session: Session = Depends(get_session)
):
    """Update survey details"""
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
        updated = update_survey(session, survey, body)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_UPDATED.value,
            message="Survey updated successfully",
            data=SurveyPublic.model_validate(updated),
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
def delete_survey_route(survey_id: str, session: Session = Depends(get_session)):
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
        soft_delete_survey(session, survey)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_DELETED.value,
            message="Survey deleted successfully",
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
def restore_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted survey"""
    try:
        survey = get_deleted_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_FOUND.value,
                    message="Survey not found",
                ).model_dump(mode="json"),
            )
        restored = restore_survey(session, survey)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RESTORED.value,
            message="Survey restored successfully",
            data=SurveyPublic.model_validate(restored),
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
def publish_survey(survey_id: str, session: Session = Depends(get_session)):
    """Publish a survey (DRAFT → ACTIVE)"""
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
                    message="Survey is not in DRAFT status",
                ).model_dump(mode="json"),
            )
        if get_survey_question_count(session, survey.survey_code) == 0:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_HAS_NO_QUESTIONS.value,
                    message="Survey has no questions",
                ).model_dump(mode="json"),
            )
        published = set_survey_status(session, survey, SurveyStatus.ACTIVE)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_PUBLISHED.value,
            message="Survey published successfully",
            data=SurveyPublic.model_validate(published),
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
def close_survey(survey_id: str, session: Session = Depends(get_session)):
    """Close a survey (ACTIVE → CLOSED)"""
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
        if survey.status == SurveyStatus.CLOSED:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_ALREADY_CLOSED.value,
                    message="Survey is already closed",
                ).model_dump(mode="json"),
            )
        closed = set_survey_status(session, survey, SurveyStatus.CLOSED)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CLOSED.value,
            message="Survey closed successfully",
            data=SurveyPublic.model_validate(closed),
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
def reopen_survey(survey_id: str, session: Session = Depends(get_session)):
    """Reopen a survey (CLOSED → ACTIVE)"""
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
                    code=ErrorCode.SURVEY_NOT_ACTIVE.value,
                    message="Survey is not closed",
                ).model_dump(mode="json"),
            )
        reopened = set_survey_status(session, survey, SurveyStatus.ACTIVE)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_REOPENED.value,
            message="Survey reopened successfully",
            data=SurveyPublic.model_validate(reopened),
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
# Survey questions
# ---------------------------------------------------------------------------


@router.post("/{survey_id}/questions", response_model=StandardResponse, status_code=201)
def add_question_to_survey_route(
    survey_id: str, body: SurveyQuestionCreate, session: Session = Depends(get_session)
):
    """Add a question from the library to a survey"""
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
        sq = add_question_to_survey(session, survey, body)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTION_ADDED.value,
            message="Question added to survey",
            data=sq.dict(),
            timestamp=get_current_time_gmt8(),
        )
    except ValueError as e:
        msg = str(e)
        if msg == "QUESTION_NOT_FOUND":
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.QUESTION_NOT_FOUND.value,
                    message="Question not found",
                ).model_dump(mode="json"),
            )
        if msg == "QUESTION_ALREADY_IN_SURVEY":
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Question already in survey",
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


@router.post(
    "/{survey_id}/questions/batch", response_model=StandardResponse, status_code=201
)
def add_questions_batch_route(
    survey_id: str,
    body: List[SurveyQuestionCreate],
    session: Session = Depends(get_session),
):
    """Add multiple questions to survey in one batch"""
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
                    message="Can only add questions to DRAFT surveys",
                ).model_dump(mode="json"),
            )
        added, failed = add_questions_batch(session, survey, body)
        result = {
            "added": len(added),
            "failed": len(failed),
            "questions": [q.dict() for q in added],
        }
        if failed:
            result["failed_items"] = failed
        return StandardResponse(
            success=len(failed) == 0,
            code=SuccessCode.SURVEY_QUESTIONS_BATCH_ADDED.value,
            message=f"Added {len(added)} questions"
            + (f", {len(failed)} failed" if failed else ""),
            data=result,
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


@router.get("/{survey_id}/questions", response_model=StandardResponse)
def get_survey_questions_route(survey_id: str, session: Session = Depends(get_session)):
    """List all questions in survey ordered by order_index"""
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
        questions = get_survey_questions_with_details(session, survey.survey_code)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTIONS_RETRIEVED.value,
            message="Survey questions retrieved",
            data={"questions": [q.dict() for q in questions]},
            timestamp=get_current_time_gmt8(),
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


@router.delete("/{survey_id}/questions/{question_id}", response_model=StandardResponse)
def remove_question_from_survey_route(
    survey_id: str, question_id: str, session: Session = Depends(get_session)
):
    """Remove a question from survey and reorder remaining"""
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
        remove_question_from_survey(session, survey, question_id)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTION_REMOVED.value,
            message="Question removed from survey",
            timestamp=get_current_time_gmt8(),
        )
    except ValueError as e:
        msg = str(e)
        if msg == "QUESTION_NOT_FOUND":
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.QUESTION_NOT_FOUND.value,
                    message="Question not found",
                ).model_dump(mode="json"),
            )
        if msg == "SURVEY_QUESTION_NOT_FOUND":
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_QUESTION_NOT_FOUND.value,
                    message=f"Question {question_id} is not in survey {survey_id}",
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
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.patch("/{survey_id}/questions/reorder", response_model=StandardResponse)
def reorder_survey_questions_route(
    survey_id: str,
    body: SurveyQuestionReorderRequest,
    session: Session = Depends(get_session),
):
    """Reorder questions in survey"""
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
        reorder_survey_questions(session, survey, body.order_map)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTIONS_REORDERED.value,
            message="Questions reordered successfully",
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
# Distribution config
# ---------------------------------------------------------------------------


@router.post(
    "/{survey_id}/distribution/configure",
    response_model=StandardResponse,
    status_code=201,
)
def configure_distribution_route(
    survey_id: str,
    body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session),
):
    """Create or update survey distribution configuration"""
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
        config = configure_distribution(session, survey, body)
        existing_existed = (
            get_distribution_config(session, survey.survey_code) is not None
        )
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED.value
            if existing_existed
            else SuccessCode.DISTRIBUTION_CONFIG_CREATED.value,
            message="Distribution config updated"
            if existing_existed
            else "Distribution config created",
            data=SurveyDistributionConfigPublic.model_validate(config),
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


@router.get("/{survey_id}/distribution/config", response_model=StandardResponse)
def get_distribution_config_route(
    survey_id: str, session: Session = Depends(get_session)
):
    """Get distribution configuration for a survey"""
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
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_RETRIEVED.value,
            message="Distribution config retrieved",
            data=SurveyDistributionConfigPublic.model_validate(config),
            timestamp=get_current_time_gmt8(),
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


@router.patch("/{survey_id}/distribution/config", response_model=StandardResponse)
def update_distribution_config_route(
    survey_id: str,
    body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session),
):
    """Update distribution config (only in DRAFT status)"""
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
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        if config.status != DistributionStatus.DRAFT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_ALREADY_SENT.value,
                    message="Distribution already sent",
                ).model_dump(mode="json"),
            )
        updated = update_distribution_config(session, config, body)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED.value,
            message="Distribution config updated",
            data=SurveyDistributionConfigPublic.model_validate(updated),
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
# Phase 1.4B — Distribution sending & stats
# ---------------------------------------------------------------------------


@router.post("/{survey_id}/distribution/send", response_model=StandardResponse)
def send_distribution_route(survey_id: str, session: Session = Depends(get_session)):
    """
    Send invitations to all configured recipients.
    Creates SurveyInvitation records and marks the config as SENT.
    Actual email delivery is a future integration.
    """
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
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found. Create one first via POST /distribution/configure",
                ).model_dump(mode="json"),
            )
        if config.status == DistributionStatus.SENT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_ALREADY_SENT.value,
                    message="Invitations have already been sent for this distribution",
                ).model_dump(mode="json"),
            )
        sent_count, _ = send_survey_invitations(session, survey, config)
        if sent_count == 0:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.NO_RECIPIENTS_FOUND.value,
                    message="No eligible alumni found matching the distribution filters",
                ).model_dump(mode="json"),
            )
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_INVITATIONS_SENT.value,
            message=f"Invitations sent to {sent_count} alumni",
            data={"sent_count": sent_count, "distribution_id": config.distribution_id},
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


@router.post(
    "/{survey_id}/distribution/send-reminders", response_model=StandardResponse
)
def send_reminders_route(survey_id: str, session: Session = Depends(get_session)):
    """
    Send reminders to alumni who received an invitation but haven't responded yet.
    Re-timestamps their sent_at to indicate a reminder was sent.
    Actual email delivery is a future integration.
    """
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
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        if config.status != DistributionStatus.SENT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Reminders can only be sent after the initial distribution has been sent",
                ).model_dump(mode="json"),
            )
        reminder_count, _ = send_survey_reminders(session, survey)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_REMINDERS_SENT.value,
            message=f"Reminders queued for {reminder_count} non-respondents",
            data={"reminder_count": reminder_count},
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


@router.get("/{survey_id}/distribution/status", response_model=StandardResponse)
def get_distribution_status_route(
    survey_id: str, session: Session = Depends(get_session)
):
    """Get distribution statistics: total recipients, response rate, sent/responded/pending counts."""
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
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        stats = get_distribution_stats(session, survey.survey_code, config)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_STATUS_RETRIEVED.value,
            message="Distribution status retrieved",
            data=stats,
            timestamp=get_current_time_gmt8(),
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


@router.get(
    "/{survey_id}/distribution/non-respondents", response_model=StandardResponse
)
def get_non_respondents_route(
    survey_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """List alumni who received an invitation but have not yet submitted a response."""
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
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        non_respondents, total = get_non_respondents(
            session, survey.survey_code, skip, limit
        )
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_STATUS_RETRIEVED.value,
            message="Non-respondents retrieved",
            data={
                "non_respondents": non_respondents,
                "total": total,
                "count": len(non_respondents),
                "offset": skip,
                "limit": limit,
                "has_more": (skip + limit) < total,
            },
            timestamp=get_current_time_gmt8(),
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
# Phase 1.6 — Results & Analytics
# ---------------------------------------------------------------------------


@router.get("/{survey_id}/results", response_model=StandardResponse)
def get_survey_results_route(survey_id: str, session: Session = Depends(get_session)):
    """
    Get aggregated results for a survey.
    Returns per-question statistics: choice distributions, averages, YES/NO counts,
    SCALE distributions, NUMBER stats, and TEXT samples.
    """
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
        results = get_survey_results(session, survey)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RESULTS_RETRIEVED.value,
            message="Survey results retrieved",
            data=results,
            timestamp=get_current_time_gmt8(),
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
        export_data = export_survey_responses(session, survey)
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RESULTS_RETRIEVED.value,
            message="Survey responses exported",
            data=export_data,
            timestamp=get_current_time_gmt8(),
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
