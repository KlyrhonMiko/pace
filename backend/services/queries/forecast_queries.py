"""
DB query functions for ARIMA forecast domain.
"""
import uuid
from sqlmodel import Session, select
from models.arima_forecast_result import ArimaForecastResult
from models.alumni import Alumni


def save_forecast_result(
    session: Session, result: ArimaForecastResult
) -> ArimaForecastResult:
    """Persist a new ARIMA forecast result."""
    session.add(result)
    session.commit()
    session.refresh(result)
    return result


def get_forecast_by_id(
    session: Session, forecast_id: uuid.UUID
) -> ArimaForecastResult | None:
    """Retrieve a stored forecast by its UUID."""
    return session.get(ArimaForecastResult, forecast_id)


def get_latest_forecast(session: Session) -> ArimaForecastResult | None:
    """Get the most recent ARIMA forecast result."""
    return session.exec(
        select(ArimaForecastResult)
        .order_by(ArimaForecastResult.created_at.desc())
        .limit(1)
    ).first()


def get_all_forecasts(
    session: Session, limit: int = 10
) -> list[ArimaForecastResult]:
    """Fetch recent forecast results, newest first."""
    return session.exec(
        select(ArimaForecastResult)
        .order_by(ArimaForecastResult.created_at.desc())
        .limit(limit)
    ).all()


def get_historical_employment_counts(session: Session) -> list[int] | None:
    """
    Query the alumni table to get year-by-year counts of employed alumni.

    Groups alumni by year_graduated (via student_records) where
    employment_status == 'Employed', ordered oldest-first.

    Returns None if fewer than 3 data points are available (not enough
    for meaningful ARIMA fitting — the model will fall back to synthetic data).
    """
    from models.student_records import StudentRecord

    # Get all employed alumni with their graduation year
    results = session.exec(
        select(StudentRecord.year_graduated)
        .join(Alumni, Alumni.id == StudentRecord.alumni_ref_id)
        .where(
            Alumni.employment_status == "Employed",
            Alumni.is_deleted == False,
            StudentRecord.is_deleted == False,
        )
        .order_by(StudentRecord.year_graduated)
    ).all()

    if not results:
        return None

    # Group by year and count
    from collections import Counter
    year_counts = Counter(results)

    if len(year_counts) < 3:
        return None

    # Build a contiguous series from min_year to max_year
    min_year = min(year_counts.keys())
    max_year = max(year_counts.keys())
    series = [year_counts.get(y, 0) for y in range(min_year, max_year + 1)]

    return series
