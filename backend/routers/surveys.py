import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_, or_
from core.database import get_session
from models.questions import Question, QuestionPublic, QuestionType
from models import (
    Survey, SurveyCreate, SurveyUpdate, SurveyPublic, SurveyWithQuestions,
    SurveyQuestion, SurveyQuestionCreate, SurveyQuestionWithDetails,
    SurveyResponse, SurveyResponseCreate, SurveyResponsePublic, SurveyResponseWithAnswers,
    SurveyAnswer, SurveyAnswerCreate, SurveyAnswerPublic,
    SurveyInvitation, SurveyInvitationCreate, SurveyInvitationPublic, SurveyInvitationListResponse,
    SurveyDistributionConfig, SurveyDistributionConfigCreate, SurveyDistributionConfigCreateRequest, SurveyDistributionConfigUpdate, SurveyDistributionConfigPublic,
    SurveyQuestionReorderRequest, DistributionStatsResponse, SurveyInvitationStatus,
    DistributionTargetGroup, DistributionStatus, SurveyStatus
)
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from models.alumni import Alumni
from models.pagination import PaginationMetadata
from utils.timezone import get_current_time_gmt8
import json


router = APIRouter(prefix="/surveys", tags=["surveys"])

def generate_survey_id(session: Session) -> str:
    """Generate next survey_id in SRVY-000001 format"""
    stmt = select(Survey.survey_id).order_by(Survey.survey_id.desc()).limit(1)
    last_id = session.exec(stmt).first()
    
    if last_id:
        num = int(last_id.split('-')[1])
        next_num = num + 1
    else:
        next_num = 1
    
    return f"SRVY-{next_num:06d}"


def generate_response_id(session: Session) -> str:
    """Generate next response_id in SRSP-000001 format"""
    stmt = select(SurveyResponse.response_id).order_by(SurveyResponse.response_id.desc()).limit(1)
    last_id = session.exec(stmt).first()
    
    if last_id:
        num = int(last_id.split('-')[1])
        next_num = num + 1
    else:
        next_num = 1
    
    return f"SRSP-{next_num:06d}"


def generate_invitation_id(session: Session) -> str:
    """Generate next invitation_id in SINV-000001 format"""
    stmt = select(SurveyInvitation.invitation_id).order_by(SurveyInvitation.invitation_id.desc()).limit(1)
    last_id = session.exec(stmt).first()
    
    if last_id:
        num = int(last_id.split('-')[1])
        next_num = num + 1
    else:
        next_num = 1
    
    return f"SINV-{next_num:06d}"


def generate_distribution_id(session: Session) -> str:
    """Generate next distribution_id in SDST-000001 format"""
    stmt = select(SurveyDistributionConfig.distribution_id).order_by(SurveyDistributionConfig.distribution_id.desc()).limit(1)
    last_id = session.exec(stmt).first()
    
    if last_id:
        num = int(last_id.split('-')[1])
        next_num = num + 1
    else:
        next_num = 1
    
    return f"SDST-{next_num:06d}"


# ============================================================================
# SURVEY CRUD
# ============================================================================

@router.post("", response_model=StandardResponse, status_code=201)
def create_survey(
    body: SurveyCreate,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Create a new survey (starts in DRAFT)
    
    NOTE: Duplicate prevention enabled - surveys with identical titles (case-insensitive)
    will be rejected with a 409 Conflict error showing the existing survey ID.
    This ensures survey titles remain unique and identifiable.
    """
    try:
        # Check for duplicate survey title (case-insensitive)
        stmt = select(Survey).where(
            and_(
                func.lower(Survey.title) == body.title.lower(),
                Survey.is_deleted == False
            )
        )
        existing_survey = session.exec(stmt).first()
        
        if existing_survey:
            raise HTTPException(
                status_code=409,
                detail=f"Survey with this title already exists (ID: {existing_survey.survey_id})"
            )
        
        survey = Survey(
            **body.dict(),
            survey_code=uuid.uuid4(),
            survey_id=generate_survey_id(session),
            status=SurveyStatus.DRAFT,
            created_at=get_current_time_gmt8(),
            updated_at=get_current_time_gmt8()
        )
        session.add(survey)
        session.commit()
        session.refresh(survey)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CREATED,
            message="Survey created successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException as e:
        if "already exists" in str(e.detail):
            raise HTTPException(
                status_code=409,
                detail={"code": ErrorCode.DUPLICATE_SURVEY_TITLE, "message": str(e.detail)}
            )
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=StandardResponse)
def list_surveys(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    session: Session = Depends(get_session)
) -> StandardResponse:
    """List all surveys with pagination and filtering"""
    try:
        stmt = select(Survey).where(Survey.is_deleted == False)
        
        if search:
            stmt = stmt.where(
                or_(
                    Survey.title.contains(search),
                    Survey.description.contains(search)
                )
            )
        
        if status:
            stmt = stmt.where(Survey.status == status)
        
        # Get total count
        count_stmt = select(func.count(Survey.survey_code)).where(Survey.is_deleted == False)
        if search:
            count_stmt = count_stmt.where(
                or_(
                    Survey.title.contains(search),
                    Survey.description.contains(search)
                )
            )
        if status:
            count_stmt = count_stmt.where(Survey.status == status)
        total = session.exec(count_stmt).one()
        
        surveys = session.exec(stmt.offset(skip).limit(limit)).all()
        
        # Add question count to each survey
        survey_data = []
        for survey in surveys:
            survey_dict = SurveyPublic.model_validate(survey).dict()
            q_count = session.exec(
                select(func.count(SurveyQuestion.survey_question_code)).where(
                    SurveyQuestion.survey_code == survey.survey_code
                )
            ).one()
            survey_dict["question_count"] = q_count
            survey_data.append(survey_dict)
        
        data = {
            "surveys": survey_data,
            "total": total,
            "count": len(surveys),
            "offset": skip,
            "limit": limit,
            "has_more": (skip + limit) < total
        }
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEYS_RETRIEVED,
            message="Surveys retrieved successfully",
            data=data,
            timestamp=get_current_time_gmt8()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{survey_id}", response_model=StandardResponse)
def get_survey(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Get a survey with all its composed questions"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        # Get questions in order
        q_stmt = select(SurveyQuestion).where(
            SurveyQuestion.survey_code == survey.survey_code
        ).order_by(SurveyQuestion.order_index)
        survey_questions = session.exec(q_stmt).all()
        
        questions = []
        for sq in survey_questions:
            q_stmt = select(Question).where(Question.question_code == sq.question_code)
            question = session.exec(q_stmt).first()
            if question:
                sq_dict = SurveyQuestionWithDetails(
                    survey_code=sq.survey_code,
                    question_code=sq.question_code,
                    order_index=sq.order_index,
                    survey_question_code=sq.survey_question_code,
                    question=QuestionPublic.model_validate(question)
                )
                questions.append(sq_dict)
        
        survey_dict = SurveyPublic.model_validate(survey).dict()
        survey_dict["questions"] = [q.dict() for q in questions]
        survey_dict["question_count"] = len(questions)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RETRIEVED,
            message="Survey retrieved successfully",
            data=survey_dict,
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{survey_id}", response_model=StandardResponse)
def update_survey(
    survey_id: str,
    body: SurveyUpdate,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Update survey details"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        update_data = body.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(survey, key, value)
        
        survey.updated_at = get_current_time_gmt8()
        session.add(survey)
        session.commit()
        session.refresh(survey)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_UPDATED,
            message="Survey updated successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{survey_id}", response_model=StandardResponse)
def delete_survey(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Soft delete a survey"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        survey.is_deleted = True
        survey.deleted_at = get_current_time_gmt8()
        session.add(survey)
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_DELETED,
            message="Survey deleted successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/restore", response_model=StandardResponse)
def restore_survey(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Restore a soft-deleted survey"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == True)
        )
        survey = session.exec(stmt).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        survey.is_deleted = False
        survey.deleted_at = None
        session.add(survey)
        session.commit()
        session.refresh(survey)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_RESTORED,
            message="Survey restored successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{survey_id}/questions", response_model=StandardResponse, status_code=201)
def add_question_to_survey(
    survey_id: str,
    body: SurveyQuestionCreate,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Add a question from library to survey"""
    try:
        # Verify survey exists
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        # Lookup question by human-readable question_id
        stmt = select(Question).where(
            and_(Question.question_id == body.question_id, Question.is_deleted == False)
        )
        question = session.exec(stmt).first()
        if not question:
            raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
        
        # Check for duplicate
        stmt = select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.question_code == question.question_code
            )
        )
        if session.exec(stmt).first():
            raise HTTPException(status_code=409, detail="Question already in survey")
        
        # Auto-assign order_index if not provided
        order_index = body.order_index
        if order_index is None:
            stmt = select(func.max(SurveyQuestion.order_index)).where(
                SurveyQuestion.survey_code == survey.survey_code
            )
            max_order = session.exec(stmt).one()
            order_index = (max_order or 0) + 1
        
        survey_question = SurveyQuestion(
            survey_question_code=uuid.uuid4(),
            survey_code=survey.survey_code,
            question_code=question.question_code,
            order_index=order_index
        )
        session.add(survey_question)
        session.commit()
        session.refresh(survey_question)
        
        # Return with question details
        sq_dict = SurveyQuestionWithDetails(
            order_index=survey_question.order_index,
            question=QuestionPublic.model_validate(question)
        )
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTION_ADDED,
            message="Question added to survey",
            data=sq_dict.dict(),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/questions/batch", response_model=StandardResponse, status_code=201)
def add_questions_batch(
    survey_id: str,
    body: List[SurveyQuestionCreate],
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Add multiple questions to survey in one batch"""
    try:
        # Verify survey exists and is in DRAFT
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(status_code=409, detail="Can only add questions to DRAFT surveys")
        
        # Get starting order_index
        stmt = select(func.max(SurveyQuestion.order_index)).where(
            SurveyQuestion.survey_code == survey.survey_code
        )
        max_order = session.exec(stmt).one() or 0
        
        added_questions = []
        failed_items = []
        
        for idx, sq_create in enumerate(body, start=1):
            try:
                # Lookup question by human-readable question_id
                stmt = select(Question).where(
                    and_(Question.question_id == sq_create.question_id, Question.is_deleted == False)
                )
                question = session.exec(stmt).first()
                if not question:
                    failed_items.append({
                        "index": idx,
                        "question_id": sq_create.question_id,
                        "error": "QUESTION_NOT_FOUND"
                    })
                    continue
                
                # Check for duplicate
                stmt = select(SurveyQuestion).where(
                    and_(
                        SurveyQuestion.survey_code == survey.survey_code,
                        SurveyQuestion.question_code == question.question_code
                    )
                )
                if session.exec(stmt).first():
                    failed_items.append({
                        "index": idx,
                        "question_id": sq_create.question_id,
                        "error": "Question already in survey"
                    })
                    continue
                
                # Assign order_index
                order_index = sq_create.order_index or (max_order + len(added_questions) + 1)
                
                survey_question = SurveyQuestion(
                    survey_question_code=uuid.uuid4(),
                    survey_code=survey.survey_code,
                    question_code=question.question_code,
                    order_index=order_index
                )
                session.add(survey_question)
                session.flush()
                
                sq_dict = SurveyQuestionWithDetails(
                    order_index=survey_question.order_index,
                    question=QuestionPublic.model_validate(question)
                )
                added_questions.append(sq_dict)
                
            except Exception as e:
                session.rollback()
                failed_items.append({
                    "index": idx,
                    "question_code": str(sq_create.question_code),
                    "error": str(e)
                })
        
        session.commit()
        
        result = {
            "added": len(added_questions),
            "failed": len(failed_items),
            "questions": [q.dict() for q in added_questions]
        }
        
        if failed_items:
            result["failed_items"] = failed_items
        
        return StandardResponse(
            success=len(failed_items) == 0,
            code=SuccessCode.SURVEY_QUESTIONS_BATCH_ADDED,
            message=f"Added {len(added_questions)} questions" + (f", {len(failed_items)} failed" if failed_items else ""),
            data=result,
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{survey_id}/questions", response_model=StandardResponse)
def get_survey_questions(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """List all questions in survey ordered by order_index"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        stmt = select(SurveyQuestion).where(
            SurveyQuestion.survey_code == survey.survey_code
        ).order_by(SurveyQuestion.order_index)
        survey_questions = session.exec(stmt).all()
        
        questions = []
        for sq in survey_questions:
            q_stmt = select(Question).where(Question.question_code == sq.question_code)
            question = session.exec(q_stmt).first()
            if question:
                sq_dict = SurveyQuestionWithDetails(
                    order_index=sq.order_index,
                    question=QuestionPublic.model_validate(question)
                )
                questions.append(sq_dict)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTIONS_RETRIEVED,
            message="Survey questions retrieved",
            data={"questions": [q.dict() for q in questions]},
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{survey_id}/questions/{question_id}", response_model=StandardResponse)
def remove_question_from_survey(
    survey_id: str,
    question_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Remove a question from survey and reorder remaining"""
    try:
        # Verify survey exists
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": ErrorCode.SURVEY_NOT_FOUND,
                    "message": "Survey not found"
                }
            )
        
        # Lookup question by human-readable question_id
        stmt = select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == False)
        )
        question = session.exec(stmt).first()
        if not question:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": ErrorCode.QUESTION_NOT_FOUND,
                    "message": "Question not found"
                }
            )
        
        # Get the survey question relationship
        stmt = select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.question_code == question.question_code
            )
        )
        survey_question = session.exec(stmt).first()
        if not survey_question:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": ErrorCode.SURVEY_QUESTION_NOT_FOUND,
                    "message": f"Question {question_id} is not in survey {survey_id}"
                }
            )
        
        removed_order = survey_question.order_index
        session.delete(survey_question)
        
        # Reorder remaining questions
        stmt = select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.order_index > removed_order
            )
        ).order_by(SurveyQuestion.order_index)
        lower_questions = session.exec(stmt).all()
        
        for sq in lower_questions:
            sq.order_index -= 1
            session.add(sq)
        
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTION_REMOVED,
            message="Question removed from survey",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": ErrorCode.INVALID_INPUT,
                "message": str(e)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{survey_id}/questions/reorder", response_model=StandardResponse)
def reorder_survey_questions(
    survey_id: str,
    body: SurveyQuestionReorderRequest,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Reorder questions in survey"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        for survey_question_code_str, order_index in body.order_map.items():
            stmt = select(SurveyQuestion).where(
                SurveyQuestion.survey_question_code == uuid.UUID(survey_question_code_str)
            )
            sq = session.exec(stmt).first()
            if sq and sq.survey_code == survey.survey_code:
                sq.order_index = order_index
                session.add(sq)
        
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_QUESTIONS_REORDERED,
            message="Questions reordered successfully",
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{survey_id}/publish", response_model=StandardResponse)
def publish_survey(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Publish a survey (DRAFT → ACTIVE)"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(status_code=409, detail="SURVEY_NOT_DRAFT")
        
        # Verify has at least 1 question
        stmt = select(func.count(SurveyQuestion.survey_question_code)).where(
            SurveyQuestion.survey_code == survey.survey_code
        )
        question_count = session.exec(stmt).one()
        if question_count == 0:
            raise HTTPException(status_code=400, detail="SURVEY_HAS_NO_QUESTIONS")
        
        survey.status = SurveyStatus.ACTIVE
        survey.updated_at = get_current_time_gmt8()
        session.add(survey)
        session.commit()
        session.refresh(survey)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_PUBLISHED,
            message="Survey published successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/close", response_model=StandardResponse)
def close_survey(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Close a survey (ACTIVE → CLOSED)"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        if survey.status == SurveyStatus.CLOSED:
            raise HTTPException(status_code=409, detail="SURVEY_ALREADY_CLOSED")
        
        survey.status = SurveyStatus.CLOSED
        survey.updated_at = get_current_time_gmt8()
        session.add(survey)
        session.commit()
        session.refresh(survey)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_CLOSED,
            message="Survey closed successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{survey_id}/reopen", response_model=StandardResponse)
def reopen_survey(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Reopen a survey (CLOSED → ACTIVE)"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        if survey.status != SurveyStatus.CLOSED:
            raise HTTPException(status_code=409, detail="Survey is not closed")
        
        survey.status = SurveyStatus.ACTIVE
        survey.updated_at = get_current_time_gmt8()
        session.add(survey)
        session.commit()
        session.refresh(survey)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.SURVEY_REOPENED,
            message="Survey reopened successfully",
            data=SurveyPublic.model_validate(survey),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{survey_id}/distribution/configure", response_model=StandardResponse, status_code=201)
def configure_distribution(
    survey_id: str,
    body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Create or update survey distribution configuration"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        # Check if config already exists
        stmt = select(SurveyDistributionConfig).where(
            SurveyDistributionConfig.survey_code == survey.survey_code
        )
        existing_config = session.exec(stmt).first()
        
        if existing_config:
            # Update existing
            existing_config.target_group = body.target_group
            existing_config.filters = body.filters
            existing_config.scheduled_send_at = body.scheduled_send_at
            existing_config.updated_at = get_current_time_gmt8()
            session.add(existing_config)
            session.commit()
            session.refresh(existing_config)
            return StandardResponse(
                success=True,
                code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED,
                message="Distribution config updated",
                data=SurveyDistributionConfigPublic.model_validate(existing_config),
                timestamp=get_current_time_gmt8()
            )
        else:
            # Create new
            config = SurveyDistributionConfig(
                survey_code=survey.survey_code,
                target_group=body.target_group,
                filters=body.filters,
                scheduled_send_at=body.scheduled_send_at,
                distribution_code=uuid.uuid4(),
                distribution_id=generate_distribution_id(session),
                created_at=get_current_time_gmt8(),
                updated_at=get_current_time_gmt8()
            )
            session.add(config)
            session.commit()
            session.refresh(config)
            
            return StandardResponse(
                success=True,
                code=SuccessCode.DISTRIBUTION_CONFIG_CREATED,
                message="Distribution config created",
                data=SurveyDistributionConfigPublic.model_validate(config),
                timestamp=get_current_time_gmt8()
            )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{survey_id}/distribution/config", response_model=StandardResponse)
def get_distribution_config(
    survey_id: str,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Get distribution configuration for a survey"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        stmt = select(SurveyDistributionConfig).where(
            SurveyDistributionConfig.survey_code == survey.survey_code
        )
        config = session.exec(stmt).first()
        if not config:
            raise HTTPException(status_code=404, detail="DISTRIBUTION_CONFIG_NOT_FOUND")
        
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_RETRIEVED,
            message="Distribution config retrieved",
            data=SurveyDistributionConfigPublic.model_validate(config),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{survey_id}/distribution/config", response_model=StandardResponse)
def update_distribution_config(
    survey_id: str,
    body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session)
) -> StandardResponse:
    """Update distribution config (only in DRAFT status)"""
    try:
        stmt = select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
        survey = session.exec(stmt).first()
        if not survey:
            raise HTTPException(status_code=404, detail="SURVEY_NOT_FOUND")
        
        stmt = select(SurveyDistributionConfig).where(
            SurveyDistributionConfig.survey_code == survey.survey_code
        )
        config = session.exec(stmt).first()
        if not config:
            raise HTTPException(status_code=404, detail="DISTRIBUTION_CONFIG_NOT_FOUND")
        
        if config.status != DistributionStatus.DRAFT:
            raise HTTPException(status_code=409, detail="DISTRIBUTION_ALREADY_SENT")
        
        # Update fields from request
        config.target_group = body.target_group
        config.filters = body.filters
        config.scheduled_send_at = body.scheduled_send_at
        config.updated_at = get_current_time_gmt8()
        session.add(config)
        session.commit()
        session.refresh(config)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED,
            message="Distribution config updated",
            data=SurveyDistributionConfigPublic.model_validate(config),
            timestamp=get_current_time_gmt8()
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
