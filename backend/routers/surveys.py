import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from core.database import get_session
from schemas.surveys import (
    SurveyCreate, SurveyUpdate, SurveyPublic,
    SurveyQuestionCreate, SurveyQuestionWithDetails, SurveyQuestionReorderRequest,
    SurveyDistributionConfigCreateRequest, SurveyDistributionConfigPublic,
    SurveyStatus, DistributionStatus,
)
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from services.queries.surveys_queries import (
    get_survey_by_id, get_deleted_survey_by_id,
    check_duplicate_survey_title, get_survey_question_count,
    list_surveys, create_survey, update_survey,
    soft_delete_survey, restore_survey, set_survey_status,
    get_survey_questions_with_details,
    add_question_to_survey, add_questions_batch,
    remove_question_from_survey, reorder_survey_questions,
    get_distribution_config, configure_distribution, update_distribution_config,
)

router = APIRouter(prefix="/surveys", tags=["surveys"])


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
                detail={"code": ErrorCode.DUPLICATE_SURVEY_TITLE,
                        "message": f"Survey with this title already exists (ID: {existing.survey_id})"}
            )
        survey = create_survey(session, body)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_CREATED,
            message="Survey created successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=StandardResponse)
def list_surveys_route(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """List all surveys with pagination and filtering"""
    try:
        surveys, total = list_surveys(session, skip, limit, search, status)
        survey_data = []
        for survey in surveys:
            d = SurveyPublic.model_validate(survey).dict()
            d["question_count"] = get_survey_question_count(session, survey.survey_code)
            survey_data.append(d)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEYS_RETRIEVED,
            message="Surveys retrieved successfully",
            data={"surveys": survey_data, "total": total, "count": len(surveys),
                  "offset": skip, "limit": limit, "has_more": (skip + limit) < total},
            timestamp=get_current_time_gmt8()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{survey_id}", response_model=StandardResponse)
def get_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """Get a survey with all its composed questions"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        questions = get_survey_questions_with_details(session, survey.survey_code)
        d = SurveyPublic.model_validate(survey).dict()
        d["questions"] = [q.dict() for q in questions]
        d["question_count"] = len(questions)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_RETRIEVED,
            message="Survey retrieved successfully", data=d,
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{survey_id}", response_model=StandardResponse)
def update_survey_route(
    survey_id: str, body: SurveyUpdate,
    session: Session = Depends(get_session)
):
    """Update survey details"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        updated = update_survey(session, survey, body)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_UPDATED,
            message="Survey updated successfully",
            data=SurveyPublic.model_validate(updated),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{survey_id}", response_model=StandardResponse)
def delete_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """Soft delete a survey"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        soft_delete_survey(session, survey)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_DELETED,
            message="Survey deleted successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/restore", response_model=StandardResponse)
def restore_survey_route(survey_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted survey"""
    try:
        survey = get_deleted_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        restored = restore_survey(session, survey)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_RESTORED,
            message="Survey restored successfully",
            data=SurveyPublic.model_validate(restored),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------------

@router.post("/{survey_id}/publish", response_model=StandardResponse)
def publish_survey(survey_id: str, session: Session = Depends(get_session)):
    """Publish a survey (DRAFT → ACTIVE)"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(status_code=409, detail="SURVEY_NOT_DRAFT")
        if get_survey_question_count(session, survey.survey_code) == 0:
            raise HTTPException(status_code=400, detail="SURVEY_HAS_NO_QUESTIONS")
        published = set_survey_status(session, survey, SurveyStatus.ACTIVE)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_PUBLISHED,
            message="Survey published successfully",
            data=SurveyPublic.model_validate(published),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/close", response_model=StandardResponse)
def close_survey(survey_id: str, session: Session = Depends(get_session)):
    """Close a survey (ACTIVE → CLOSED)"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        if survey.status == SurveyStatus.CLOSED:
            raise HTTPException(status_code=409, detail="SURVEY_ALREADY_CLOSED")
        closed = set_survey_status(session, survey, SurveyStatus.CLOSED)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_CLOSED,
            message="Survey closed successfully",
            data=SurveyPublic.model_validate(closed),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/reopen", response_model=StandardResponse)
def reopen_survey(survey_id: str, session: Session = Depends(get_session)):
    """Reopen a survey (CLOSED → ACTIVE)"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        if survey.status != SurveyStatus.CLOSED:
            raise HTTPException(status_code=409, detail="Survey is not closed")
        reopened = set_survey_status(session, survey, SurveyStatus.ACTIVE)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_REOPENED,
            message="Survey reopened successfully",
            data=SurveyPublic.model_validate(reopened),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Survey questions
# ---------------------------------------------------------------------------

@router.post("/{survey_id}/questions", response_model=StandardResponse, status_code=201)
def add_question_to_survey_route(
    survey_id: str, body: SurveyQuestionCreate,
    session: Session = Depends(get_session)
):
    """Add a question from the library to a survey"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        sq = add_question_to_survey(session, survey, body)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_QUESTION_ADDED,
            message="Question added to survey", data=sq.dict(),
            timestamp=get_current_time_gmt8()
        )
    except ValueError as e:
        msg = str(e)
        if msg == "QUESTION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        if msg == "QUESTION_ALREADY_IN_SURVEY":
            raise HTTPException(status_code=409, detail="Question already in survey")
        raise HTTPException(status_code=400, detail=msg)
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/questions/batch", response_model=StandardResponse, status_code=201)
def add_questions_batch_route(
    survey_id: str, body: List[SurveyQuestionCreate],
    session: Session = Depends(get_session)
):
    """Add multiple questions to survey in one batch"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(status_code=409, detail="Can only add questions to DRAFT surveys")
        added, failed = add_questions_batch(session, survey, body)
        result = {"added": len(added), "failed": len(failed), "questions": [q.dict() for q in added]}
        if failed:
            result["failed_items"] = failed
        return StandardResponse(
            success=len(failed) == 0,
            code=SuccessCode.SURVEY_QUESTIONS_BATCH_ADDED,
            message=f"Added {len(added)} questions" + (f", {len(failed)} failed" if failed else ""),
            data=result, timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{survey_id}/questions", response_model=StandardResponse)
def get_survey_questions_route(survey_id: str, session: Session = Depends(get_session)):
    """List all questions in survey ordered by order_index"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        questions = get_survey_questions_with_details(session, survey.survey_code)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_QUESTIONS_RETRIEVED,
            message="Survey questions retrieved",
            data={"questions": [q.dict() for q in questions]},
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{survey_id}/questions/{question_id}", response_model=StandardResponse)
def remove_question_from_survey_route(
    survey_id: str, question_id: str,
    session: Session = Depends(get_session)
):
    """Remove a question from survey and reorder remaining"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail={"code": ErrorCode.SURVEY_NOT_FOUND, "message": "Survey not found"})
        remove_question_from_survey(session, survey, question_id)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_QUESTION_REMOVED,
            message="Question removed from survey",
            timestamp=get_current_time_gmt8()
        )
    except ValueError as e:
        msg = str(e)
        if msg == "QUESTION_NOT_FOUND":
            raise HTTPException(status_code=404, detail={"code": ErrorCode.QUESTION_NOT_FOUND, "message": "Question not found"})
        if msg == "SURVEY_QUESTION_NOT_FOUND":
            raise HTTPException(status_code=404, detail={"code": ErrorCode.SURVEY_QUESTION_NOT_FOUND, "message": f"Question {question_id} is not in survey {survey_id}"})
        raise HTTPException(status_code=500, detail={"code": ErrorCode.INVALID_INPUT, "message": msg})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": ErrorCode.INVALID_INPUT, "message": str(e)})


@router.patch("/{survey_id}/questions/reorder", response_model=StandardResponse)
def reorder_survey_questions_route(
    survey_id: str, body: SurveyQuestionReorderRequest,
    session: Session = Depends(get_session)
):
    """Reorder questions in survey"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        reorder_survey_questions(session, survey, body.order_map)
        return StandardResponse(
            success=True, code=SuccessCode.SURVEY_QUESTIONS_REORDERED,
            message="Questions reordered successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Distribution config
# ---------------------------------------------------------------------------

@router.post("/{survey_id}/distribution/configure", response_model=StandardResponse, status_code=201)
def configure_distribution_route(
    survey_id: str, body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session)
):
    """Create or update survey distribution configuration"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        config = configure_distribution(session, survey, body)
        existing_existed = get_distribution_config(session, survey.survey_code) is not None
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED if existing_existed else SuccessCode.DISTRIBUTION_CONFIG_CREATED,
            message="Distribution config updated" if existing_existed else "Distribution config created",
            data=SurveyDistributionConfigPublic.model_validate(config),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{survey_id}/distribution/config", response_model=StandardResponse)
def get_distribution_config_route(survey_id: str, session: Session = Depends(get_session)):
    """Get distribution configuration for a survey"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(status_code=404, detail="DISTRIBUTION_CONFIG_NOT_FOUND")
        return StandardResponse(
            success=True, code=SuccessCode.DISTRIBUTION_CONFIG_RETRIEVED,
            message="Distribution config retrieved",
            data=SurveyDistributionConfigPublic.model_validate(config),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{survey_id}/distribution/config", response_model=StandardResponse)
def update_distribution_config_route(
    survey_id: str, body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session)
):
    """Update distribution config (only in DRAFT status)"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(status_code=404, detail="DISTRIBUTION_CONFIG_NOT_FOUND")
        if config.status != DistributionStatus.DRAFT:
            raise HTTPException(status_code=409, detail="DISTRIBUTION_ALREADY_SENT")
        updated = update_distribution_config(session, config, body)
        return StandardResponse(
            success=True, code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED,
            message="Distribution config updated",
            data=SurveyDistributionConfigPublic.model_validate(updated),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
