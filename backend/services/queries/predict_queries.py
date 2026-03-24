"""
DB query functions for employability prediction domain.
"""
import uuid
from sqlmodel import Session, select
from models.alumni import Alumni
from models.employability import EmployabilityPrediction

def get_active_alumni_by_code(session: Session, alumni_code: uuid.UUID) -> Alumni | None:
    """Resolve an active alumni by its UUID code."""
    return session.exec(
        select(Alumni).where((Alumni.alumni_code == alumni_code) & (Alumni.is_deleted == False))
    ).first()

def get_alumni_by_user_code(session: Session, user_code: uuid.UUID) -> Alumni | None:
    """Find an active alumni record linked to a specific user_code."""
    return session.exec(
        select(Alumni).where(
            (Alumni.user_code == user_code)
            & (Alumni.is_deleted == False)
        )
    ).first()

def get_predictions_by_alumni(session: Session, alumni_code: uuid.UUID, limit: int = 10) -> list[EmployabilityPrediction]:
    """Fetch recent predictions for a specific alumni, newest first."""
    return session.exec(
        select(EmployabilityPrediction)
        .where(EmployabilityPrediction.alumni_code == alumni_code)
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
