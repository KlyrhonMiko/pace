import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_
from core.database import get_session
from models.questions import Question, QuestionCreate, QuestionUpdate, QuestionPublic, QuestionListResponse
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8


router = APIRouter(prefix="/questions", tags=["questions"])

def generate_question_id(session: Session) -> str:
    """Generate next question_id in QSTN-000001 format"""
    # Get all existing question_ids to find the maximum number
    stmt = select(Question.question_id).order_by(Question.question_id.desc()).limit(1)
    last_id = session.exec(stmt).first()
    
    if last_id:
        # Extract number from "QSTN-000001" format
        num = int(last_id.split('-')[1])
        next_num = num + 1
    else:
        next_num = 1
    
    return f"QSTN-{next_num:06d}"

@router.post("", response_model=StandardResponse, status_code=201)
def create_question(
    body: QuestionCreate,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Create a new question in the library
    
    NOTE: Duplicate prevention enabled - questions with identical text (case-insensitive)
    will be rejected with a 409 Conflict error showing the existing question ID.
    This ensures the question library remains clean and reusable.
    """
    try:
        # Check for duplicate question text (case-insensitive)
        stmt = select(Question).where(
            and_(
                func.lower(Question.question_text) == body.question_text.lower(),
                Question.is_deleted == False
            )
        )
        existing_question = session.exec(stmt).first()
        
        if existing_question:
            raise HTTPException(
                status_code=409,
                detail=f"Question with this text already exists (ID: {existing_question.question_id})"
            )
        
        question = Question(
            **body.dict(),
            question_code=uuid.uuid4(),
            question_id=generate_question_id(session),
            created_at=get_current_time_gmt8(),
            updated_at=get_current_time_gmt8()
        )
        session.add(question)
        session.commit()
        session.refresh(question)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.QUESTION_CREATED,
            message="Question created successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException as e:
        if "already exists" in str(e.detail):
            raise HTTPException(
                status_code=409,
                detail={"code": ErrorCode.DUPLICATE_QUESTION_TEXT, "message": str(e.detail)}
            )
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=StandardResponse)
def list_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    question_type: Optional[str] = Query(None),
    session: Session = Depends(get_session)
) -> StandardResponse:
    """List all questions in library with pagination and filtering"""
    try:
        stmt = select(Question).where(Question.is_deleted == False)
        
        # Search by question text
        if search:
            stmt = stmt.where(Question.question_text.contains(search))
        
        # Filter by type
        if question_type:
            stmt = stmt.where(Question.question_type == question_type)
        
        # Get total count
        count_stmt = select(func.count(Question.question_code)).where(Question.is_deleted == False)
        if search:
            count_stmt = count_stmt.where(Question.question_text.contains(search))
        if question_type:
            count_stmt = count_stmt.where(Question.question_type == question_type)
        total = session.exec(count_stmt).one()
        
        # Paginate
        questions = session.exec(stmt.offset(skip).limit(limit)).all()
        
        data = {
            "questions": [QuestionPublic.model_validate(q) for q in questions],
            "total": total,
            "count": len(questions),
            "offset": skip,
            "limit": limit,
            "has_more": (skip + limit) < total
        }
        
        return StandardResponse(
            success=True,
            code=SuccessCode.QUESTIONS_RETRIEVED,
            message="Questions retrieved successfully",
            data=data,
            timestamp=get_current_time_gmt8()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{question_id}", response_model=StandardResponse)
def get_question(
    question_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Get a single question by ID"""
    try:
        stmt = select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == False)
        )
        question = session.exec(stmt).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        
        return StandardResponse(
            success=True,
            code=SuccessCode.QUESTION_RETRIEVED,
            message="Question retrieved successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{question_id}", response_model=StandardResponse)
def update_question(
    question_id: str,
    body: QuestionUpdate,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Update a question"""
    try:
        stmt = select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == False)
        )
        question = session.exec(stmt).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        
        # Update fields
        update_data = body.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(question, key, value)
        
        question.updated_at = get_current_time_gmt8()
        session.add(question)
        session.commit()
        session.refresh(question)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.QUESTION_UPDATED,
            message="Question updated successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{question_id}", response_model=StandardResponse)
def delete_question(
    question_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Soft delete a question"""
    try:
        stmt = select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == False)
        )
        question = session.exec(stmt).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        
        question.is_deleted = True
        question.deleted_at = get_current_time_gmt8()
        session.add(question)
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.QUESTION_DELETED,
            message="Question deleted successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{question_id}/restore", response_model=StandardResponse)
def restore_question(
    question_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Restore a soft-deleted question"""
    try:
        stmt = select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == True)
        )
        question = session.exec(stmt).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        
        question.is_deleted = False
        question.deleted_at = None
        session.add(question)
        session.commit()
        session.refresh(question)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.QUESTION_RESTORED,
            message="Question restored successfully",
            data=QuestionPublic.model_validate(question),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
