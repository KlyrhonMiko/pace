"""
Survey questions management routes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.surveys import (
    SurveyQuestionCreate,
    SurveyQuestionReorderRequest,
    SurveyStatus,
)
from models.auth import CurrentUser
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from utils.rbac import require_staff_or_admin
from services.queries.surveys_queries import get_survey_by_id
from services.queries.survey_questions_queries import (
    get_survey_questions_with_details,
    add_question_to_survey,
    add_questions_batch,
    remove_question_from_survey,
    reorder_survey_questions,
)


SURVEYS_CACHE_NAMESPACE = "surveys"
SURVEYS_DETAIL_TTL = 300

router = APIRouter(
    prefix="/surveys",
    tags=["survey-questions"],
    dependencies=[Depends(require_staff_or_admin)],
)


@router.post("/{survey_id}/questions", response_model=StandardResponse, status_code=201)
def add_question_to_survey_route(
    survey_id: str,
    body: SurveyQuestionCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
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
        sq = add_question_to_survey(
            session,
            survey,
            body,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
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
    current_user: CurrentUser = Depends(require_staff_or_admin),
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
        added, failed = add_questions_batch(
            session,
            survey,
            body,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
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
        cache_key = generate_cache_key(f"{SURVEYS_CACHE_NAMESPACE}:questions", survey_id=survey_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_survey_questions_response(session, survey_id),
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


@router.delete("/{survey_id}/questions/{question_id}", response_model=StandardResponse)
def remove_question_from_survey_route(
    survey_id: str,
    question_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
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
        remove_question_from_survey(
            session,
            survey,
            question_id,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
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
    current_user: CurrentUser = Depends(require_staff_or_admin),
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
        reorder_survey_questions(
            session,
            survey,
            body.order_map,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
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
# Helpers
# ---------------------------------------------------------------------------


def _build_survey_questions_response(session: Session, survey_id: str) -> StandardResponse:
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
