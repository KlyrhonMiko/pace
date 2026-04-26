"""
survey_templates.py — Pre-built survey factory functions.

Provides a ready-made CHED Tracer Study template that admins can deploy
with a single POST request and then customise before publishing.
"""
import uuid
from sqlmodel import Session, select
from models.surveys import Survey, SurveyQuestion
from models.questions import Question
from schemas.surveys import SurveyStatus
from schemas.questions import QuestionType
from services.queries.surveys_queries import generate_survey_id
from services.queries.questions_queries import generate_question_id

# ---------------------------------------------------------------------------
# CHED Tracer Study — standard 10-question template
# ---------------------------------------------------------------------------

_TRACER_STUDY_QUESTIONS = [
    {
        "question_text": "Current Employment Status",
        "question_type": QuestionType.MULTIPLE_CHOICE,
        "options": '["Employed", "Unemployed", "Self-Employed", "Freelance", "Further Studies"]',
        "is_required": True,
    },
    {
        "question_text": "If employed, what is your current job title?",
        "question_type": QuestionType.TEXT,
        "is_required": False,
        "placeholder": "e.g. Software Engineer",
    },
    {
        "question_text": "If employed, name of company/organization",
        "question_type": QuestionType.TEXT,
        "is_required": False,
        "placeholder": "e.g. ACME Corporation",
    },
    {
        "question_text": "If employed, is your job related to your degree?",
        "question_type": QuestionType.YES_NO,
        "is_required": False,
    },
    {
        "question_text": "How long did it take to find your first job after graduation?",
        "question_type": QuestionType.MULTIPLE_CHOICE,
        "options": '["Less than 1 month", "1-3 months", "3-6 months", "6-12 months", "More than 1 year", "N/A"]',
        "is_required": True,
    },
    {
        "question_text": "Current monthly salary range in PHP",
        "question_type": QuestionType.MULTIPLE_CHOICE,
        "options": '["Below 10,000", "10,001-20,000", "20,001-30,000", "30,001-50,000", "Above 50,000"]',
        "is_required": False,
    },
    {
        "question_text": "Rate how your degree prepared you for your career",
        "question_type": QuestionType.SCALE,
        "scale_min": 1,
        "scale_max": 5,
        "scale_label_min": "Not at all",
        "scale_label_max": "Extremely well",
        "is_required": True,
    },
    {
        "question_text": "What skills from your program were most useful?",
        "question_type": QuestionType.TEXT,
        "is_required": False,
        "placeholder": "e.g. Programming, Communication, Problem-solving",
    },
    {
        "question_text": "What skills do you wish were taught more in your program?",
        "question_type": QuestionType.TEXT,
        "is_required": False,
        "placeholder": "e.g. Project management, Industry certifications",
    },
    {
        "question_text": "Would you recommend your program to incoming students?",
        "question_type": QuestionType.YES_NO,
        "is_required": True,
    },
]


def _get_or_create_question(session: Session, q_def: dict) -> Question:
    """
    Look up an existing Question by exact question_text.
    If it already exists (e.g. from a previous template run), reuse it to avoid library pollution.
    Otherwise create a new one.
    """
    from sqlmodel import func
    existing = session.exec(
        select(Question).where(
            func.lower(Question.question_text) == q_def["question_text"].lower()
        )
    ).first()

    if existing:
        return existing

    question = Question(
        question_id=generate_question_id(session),
        question_text=q_def["question_text"],
        question_type=q_def["question_type"],
        options=q_def.get("options"),
        scale_min=q_def.get("scale_min"),
        scale_max=q_def.get("scale_max"),
        scale_label_min=q_def.get("scale_label_min"),
        scale_label_max=q_def.get("scale_label_max"),
        placeholder=q_def.get("placeholder"),
        is_required=q_def.get("is_required", True),
    )
    session.add(question)
    session.flush()
    return question


def create_tracer_study_template(session: Session) -> Survey:
    """
    Create a new DRAFT survey pre-populated with 10 standard CHED Tracer Study questions.
    Each call creates a fresh survey (new survey_id) but reuses existing Question library
    records where the question_text already exists, so the library stays clean.
    """
    # 1. Create the survey
    survey = Survey(
        survey_id=generate_survey_id(session),
        title="CHED Tracer Study",
        description=(
            "Standard CHED Tracer Study survey to track alumni employment outcomes "
            "and program effectiveness. Customise as needed before publishing."
        ),
        status=SurveyStatus.DRAFT,
        is_anonymous=False,
        allow_multiple_responses=False,
    )
    session.add(survey)
    session.flush()

    # 2. Get/create each question and link to survey
    for order_index, q_def in enumerate(_TRACER_STUDY_QUESTIONS, start=1):
        question = _get_or_create_question(session, q_def)

        sq = SurveyQuestion(
            survey_ref_id=survey.id,
            question_ref_id=question.id,
            order_index=order_index,
        )
        session.add(sq)

    session.commit()
    session.refresh(survey)
    return survey
