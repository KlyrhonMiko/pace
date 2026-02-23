import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from core.database import get_session
from schemas.questions import QuestionCreate, QuestionUpdate, QuestionPublic
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from services.queries.questions_queries import (
    get_question_by_id, get_question_by_id_deleted,
    check_duplicate_question_text, list_questions,
    create_question, update_question, soft_delete_question, restore_question,
)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("", response_model=StandardResponse, status_code=201)
def create_question_route(body: QuestionCreate, session: Session = Depends(get_session)):
    """Create a new question in the library (duplicate text rejected)"""
    try:
        existing = check_duplicate_question_text(session, body.question_text)
        if existing:
            raise HTTPException(
                status_code=409,
                detail={"code": ErrorCode.DUPLICATE_QUESTION_TEXT,
                        "message": f"Question with this text already exists (ID: {existing.question_id})"}
            )
        question = create_question(session, body)
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_CREATED,
            message="Question created successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


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
        questions, total = list_questions(session, skip, limit, search, question_type)
        return StandardResponse(
            success=True, code=SuccessCode.QUESTIONS_RETRIEVED,
            message="Questions retrieved successfully",
            data={
                "questions": [QuestionPublic.model_validate(q) for q in questions],
                "total": total, "count": len(questions),
                "offset": skip, "limit": limit,
                "has_more": (skip + limit) < total
            },
            timestamp=get_current_time_gmt8()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{question_id}", response_model=StandardResponse)
def get_question_route(question_id: str, session: Session = Depends(get_session)):
    """Get a single question by ID"""
    try:
        question = get_question_by_id(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_RETRIEVED,
            message="Question retrieved successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{question_id}", response_model=StandardResponse)
def update_question_route(
    question_id: str, body: QuestionUpdate,
    session: Session = Depends(get_session)
):
    """Update a question"""
    try:
        question = get_question_by_id(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        updated = update_question(session, question, body)
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_UPDATED,
            message="Question updated successfully",
            data=QuestionPublic.model_validate(updated),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{question_id}", response_model=StandardResponse)
def delete_question_route(question_id: str, session: Session = Depends(get_session)):
    """Soft delete a question"""
    try:
        question = get_question_by_id(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        soft_delete_question(session, question)
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_DELETED,
            message="Question deleted successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{question_id}/restore", response_model=StandardResponse)
def restore_question_route(question_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted question"""
    try:
        question = get_question_by_id_deleted(session, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        restored = restore_question(session, question)
        return StandardResponse(
            success=True, code=SuccessCode.QUESTION_RESTORED,
            message="Question restored successfully",
            data=QuestionPublic.model_validate(restored),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
