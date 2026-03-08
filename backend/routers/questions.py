import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.questions import QuestionCreate, QuestionUpdate, QuestionPublic
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from services.queries.questions_queries import (
    get_question_by_id, get_question_by_id_deleted,
    check_duplicate_question_text, list_questions,
    create_question, update_question, soft_delete_question, restore_question,
)

router = APIRouter(prefix="/questions", tags=["questions"])
QUESTIONS_CACHE_NAMESPACE = "questions"
QUESTIONS_LIST_TTL = 900
QUESTIONS_DETAIL_TTL = 900


@router.post("", response_model=StandardResponse, status_code=201)
def create_question_route(body: QuestionCreate, session: Session = Depends(get_session)):
    """Create a new question in the library (duplicate text rejected)"""
    try:
        existing = check_duplicate_question_text(session, body.question_text)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False, code=ErrorCode.DUPLICATE_QUESTION_TEXT.value,
                    message=f"Question with this text already exists (ID: {existing.question_id})"
                ).model_dump(mode='json')
            )
        question = create_question(session, body)
        invalidate_cache_namespaces(QUESTIONS_CACHE_NAMESPACE, "surveys")
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_CREATED.value,
            message="Question created successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
        ).model_dump(mode='json'))


@router.get("", response_model=StandardResponse)
def list_questions_route(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    question_type: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """List all questions in library with pagination and filtering"""
    try:
        cache_key = generate_cache_key(
            f"{QUESTIONS_CACHE_NAMESPACE}:list",
            skip=skip,
            limit=limit,
            search=search,
            question_type=question_type,
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_question_list_response(session, skip, limit, search, question_type),
            ttl=QUESTIONS_LIST_TTL,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
        ).model_dump(mode='json'))


@router.get("/{question_id}", response_model=StandardResponse)
def get_question_route(question_id: str, session: Session = Depends(get_session)):
    """Get a single question by ID"""
    try:
        cache_key = generate_cache_key(f"{QUESTIONS_CACHE_NAMESPACE}:detail", question_id=question_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_question_detail_response(session, question_id),
            ttl=QUESTIONS_DETAIL_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
        ).model_dump(mode='json'))


@router.patch("/{question_id}", response_model=StandardResponse)
def update_question_route(
    question_id: str, body: QuestionUpdate,
    session: Session = Depends(get_session)
):
    """Update a question"""
    try:
        question = get_question_by_id(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.QUESTION_NOT_FOUND.value, message="Question not found"
            ).model_dump(mode='json'))
        updated = update_question(session, question, body)
        invalidate_cache_namespaces(QUESTIONS_CACHE_NAMESPACE, "surveys")
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_UPDATED.value,
            message="Question updated successfully",
            data=QuestionPublic.model_validate(updated),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
        ).model_dump(mode='json'))


@router.delete("/{question_id}", response_model=StandardResponse)
def delete_question_route(question_id: str, session: Session = Depends(get_session)):
    """Soft delete a question"""
    try:
        question = get_question_by_id(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.QUESTION_NOT_FOUND.value, message="Question not found"
            ).model_dump(mode='json'))
        soft_delete_question(session, question)
        invalidate_cache_namespaces(QUESTIONS_CACHE_NAMESPACE, "surveys")
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_DELETED.value,
            message="Question deleted successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
        ).model_dump(mode='json'))


@router.post("/{question_id}/restore", response_model=StandardResponse)
def restore_question_route(question_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted question"""
    try:
        question = get_question_by_id_deleted(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.QUESTION_NOT_FOUND.value, message="Question not found"
            ).model_dump(mode='json'))
        restored = restore_question(session, question)
        invalidate_cache_namespaces(QUESTIONS_CACHE_NAMESPACE, "surveys")
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_RESTORED.value,
            message="Question restored successfully",
            data=QuestionPublic.model_validate(restored),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
        ).model_dump(mode='json'))


def _build_question_list_response(
    session: Session,
    skip: int,
    limit: int,
    search: Optional[str],
    question_type: Optional[str],
) -> StandardResponse:
    questions, total = list_questions(session, skip, limit, search, question_type)
    return StandardResponse(
        success=True, code=SuccessCode.QUESTIONS_RETRIEVED.value,
        message="Questions retrieved successfully",
        data={
            "questions": [QuestionPublic.model_validate(q) for q in questions],
            "total": total, "count": len(questions),
            "offset": skip, "limit": limit,
            "has_more": (skip + limit) < total
        },
        timestamp=get_current_time_gmt8()
    )


def _build_question_detail_response(session: Session, question_id: str) -> StandardResponse:
    question = get_question_by_id(session, question_id)
    if not question:
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.QUESTION_NOT_FOUND.value, message="Question not found"
        ).model_dump(mode='json'))
    return StandardResponse(
        success=True, code=SuccessCode.QUESTION_RETRIEVED.value,
        message="Question retrieved successfully",
        data=QuestionPublic.model_validate(question),
        timestamp=get_current_time_gmt8()
    )
