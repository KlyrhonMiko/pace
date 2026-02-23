"""
DB query functions for questions domain.
"""
import uuid
from sqlmodel import Session, select, func, and_
from models.questions import Question
from schemas.questions import QuestionCreate, QuestionUpdate, QuestionPublic
from models.response_codes import ErrorCode, SuccessCode
from utils.timezone import get_current_time_gmt8


def generate_question_id(session: Session) -> str:
    last_id = session.exec(
        select(Question.question_id).order_by(Question.question_id.desc()).limit(1)
    ).first()
    if last_id:
        next_num = int(last_id.split('-')[1]) + 1
    else:
        next_num = 1
    return f"QSTN-{next_num:06d}"


def get_question_by_id(session: Session, question_id: str) -> Question | None:
    return session.exec(
        select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == False)
        )
    ).first()


def get_question_by_id_deleted(session: Session, question_id: str) -> Question | None:
    """Find only if deleted (for restore)."""
    return session.exec(
        select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == True)
        )
    ).first()


def check_duplicate_question_text(session: Session, text: str) -> Question | None:
    return session.exec(
        select(Question).where(
            and_(
                func.lower(Question.question_text) == text.lower(),
                Question.is_deleted == False
            )
        )
    ).first()


def list_questions(
    session: Session,
    skip: int,
    limit: int,
    search: str | None,
    question_type: str | None,
) -> tuple[list[Question], int]:
    stmt = select(Question).where(Question.is_deleted == False)
    count_stmt = select(func.count(Question.question_code)).where(Question.is_deleted == False)

    if search:
        stmt = stmt.where(Question.question_text.contains(search))
        count_stmt = count_stmt.where(Question.question_text.contains(search))
    if question_type:
        stmt = stmt.where(Question.question_type == question_type)
        count_stmt = count_stmt.where(Question.question_type == question_type)

    total = session.exec(count_stmt).one()
    questions = session.exec(stmt.offset(skip).limit(limit)).all()
    return questions, total


def create_question(session: Session, data: QuestionCreate) -> Question:
    question = Question(
        **data.dict(),
        question_code=uuid.uuid4(),
        question_id=generate_question_id(session),
        created_at=get_current_time_gmt8(),
        updated_at=get_current_time_gmt8()
    )
    session.add(question)
    session.commit()
    session.refresh(question)
    return question


def update_question(session: Session, question: Question, data: QuestionUpdate) -> Question:
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(question, key, value)
    question.updated_at = get_current_time_gmt8()
    session.add(question)
    session.commit()
    session.refresh(question)
    return question


def soft_delete_question(session: Session, question: Question) -> None:
    question.is_deleted = True
    question.deleted_at = get_current_time_gmt8()
    session.add(question)
    session.commit()


def restore_question(session: Session, question: Question) -> Question:
    question.is_deleted = False
    question.deleted_at = None
    session.add(question)
    session.commit()
    session.refresh(question)
    return question
