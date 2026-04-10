"""
DB query functions for Linear Regression prediction domain.
"""
import uuid
from sqlmodel import Session, select
from models.alumni_regression_prediction import AlumniRegressionPrediction


def save_regression_prediction(
    session: Session, prediction: AlumniRegressionPrediction
) -> AlumniRegressionPrediction:
    """Persist a new regression prediction result."""
    session.add(prediction)
    session.commit()
    session.refresh(prediction)
    return prediction


def get_regression_prediction_by_id(
    session: Session, prediction_id: uuid.UUID
) -> AlumniRegressionPrediction | None:
    """Retrieve a stored regression prediction by its UUID."""
    return session.get(AlumniRegressionPrediction, prediction_id)


def get_regression_predictions_by_alumni(
    session: Session, alumni_code: uuid.UUID, limit: int = 10
) -> list[AlumniRegressionPrediction]:
    """Fetch recent regression predictions for a specific alumni, newest first."""
    return session.exec(
        select(AlumniRegressionPrediction)
        .where(AlumniRegressionPrediction.alumni_code == alumni_code)
        .order_by(AlumniRegressionPrediction.created_at.desc())
        .limit(limit)
    ).all()
