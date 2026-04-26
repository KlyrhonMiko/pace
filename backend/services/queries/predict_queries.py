"""
DB query functions for employability prediction domain.
"""
import uuid
from sqlmodel import Session, select
from models.alumni import Alumni
from models.alumni_skills import AlumniSkills
from models.student_records import StudentRecord
from models.courses import Course
from models.employability import EmployabilityPrediction


# ── Alumni resolution ─────────────────────────────────────────


def get_active_alumni_by_ref_id(session: Session, alumni_ref_id: uuid.UUID) -> Alumni | None:
    """Resolve an active alumni by its internal UUID id."""
    return session.exec(
        select(Alumni).where((Alumni.id == alumni_ref_id) & (Alumni.is_deleted == False))
    ).first()


def get_alumni_by_user_ref_id(session: Session, user_ref_id: uuid.UUID) -> Alumni | None:
    """Find an active alumni record linked to a specific user ref id."""
    return session.exec(
        select(Alumni).where(
            (Alumni.user_ref_id == user_ref_id)
            & (Alumni.is_deleted == False)
        )
    ).first()


# ── Data lookup for ML models ─────────────────────────────────


def get_student_record_by_alumni_ref_id(session: Session, alumni_ref_id: uuid.UUID) -> StudentRecord | None:
    """Get the student record linked to an alumni."""
    return session.exec(
        select(StudentRecord).where(
            (StudentRecord.alumni_ref_id == alumni_ref_id)
            & (StudentRecord.is_deleted == False)
        )
    ).first()


def get_alumni_skills_by_alumni_ref_id(session: Session, alumni_ref_id: uuid.UUID) -> AlumniSkills | None:
    """Get the alumni_skills record for a given alumni."""
    return session.exec(
        select(AlumniSkills).where(AlumniSkills.alumni_ref_id == alumni_ref_id)
    ).first()


def get_course_abbv_by_course_ref_id(session: Session, course_ref_id: uuid.UUID) -> str | None:
    """Resolve the course abbreviation (degree name) from a course ref id."""
    course = session.exec(
        select(Course).where(
            (Course.id == course_ref_id)
            & (Course.is_deleted == False)
        )
    ).first()
    return course.course_abbv if course else None


def build_employability_dict(
    student_record: StudentRecord,
    alumni_skills: AlumniSkills,
    degree: str,
) -> dict:
    """
    Assemble the predictor-ready dictionary from database records.
    Maps DB fields → the exact key names EmployabilityPredictor.predict() expects.
    """
    data = {
        # Core academic fields from student_records
        "CGPA": student_record.gwa,
        "Average Prof Grade": student_record.avg_prof_grade or 0.0,
        "Average Elec Grade": student_record.avg_elec_grade or 0.0,
        "OJT Grade": student_record.ojt_grade or 0.0,
        "Leadership POS": "Yes" if student_record.leadership_pos else "No",
        "Act Member POS": "Yes" if student_record.act_member_pos else "No",

        # Skill scores from alumni_skills
        "Soft Skills Ave": alumni_skills.soft_skills_ave or 0.0,
        "Hard Skills Ave": alumni_skills.hard_skills_ave or 0.0,

        # Degree and year
        "Degree": degree,
        "Year Graduated": student_record.year_graduated,
    }

    # Merge program-specific skills from the JSON column
    if alumni_skills.program_skills and isinstance(alumni_skills.program_skills, dict):
        data.update(alumni_skills.program_skills)

    return data


def build_regression_inputs(
    student_record: StudentRecord,
    alumni_skills: AlumniSkills,
) -> dict:
    """
    Assemble the inputs for the Linear Regression AlumniPredictor.
    Returns a dict with keys: soft_skills_ave, hard_skills_ave, cgpa,
    internships, program_skills_average.
    """
    # Internships: derived from OJT grade > 0 (0 or 1)
    internships = 1 if (student_record.ojt_grade and student_record.ojt_grade > 0) else 0

    return {
        "soft_skills_ave": alumni_skills.soft_skills_ave or 0.0,
        "hard_skills_ave": alumni_skills.hard_skills_ave or 0.0,
        "cgpa": student_record.gwa,
        "internships": internships,
        "program_skills_average": alumni_skills.program_skills_average or 0.0,
    }


# ── Employability prediction CRUD ─────────────────────────────


def get_predictions_by_alumni_ref_id(session: Session, alumni_ref_id: uuid.UUID, limit: int = 10) -> list[EmployabilityPrediction]:
    """Fetch recent predictions for a specific alumni, newest first."""
    return session.exec(
        select(EmployabilityPrediction)
        .where(EmployabilityPrediction.alumni_ref_id == alumni_ref_id)
        .order_by(EmployabilityPrediction.created_at.desc())
        .limit(limit)
    ).all()


def save_prediction(session: Session, prediction: EmployabilityPrediction) -> EmployabilityPrediction:
    """Persist a new employability prediction result."""
    session.add(prediction)
    session.commit()
    session.refresh(prediction)
    return prediction


def get_prediction_by_id(session: Session, prediction_id: uuid.UUID) -> EmployabilityPrediction | None:
    """Retrieve a stored prediction by its UUID."""
    return session.get(EmployabilityPrediction, prediction_id)
