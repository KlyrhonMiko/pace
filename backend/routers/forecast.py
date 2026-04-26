"""
ARIMA employment forecast router — forecasts alumni employment trends
using historical data from the database or synthetic baseline.

The ARIMA(1,1,1) model works in phases:
  - Phase 1 (no data): Uses synthetic baseline for illustrative forecasts.
  - Phase 2 (partial data): Fits on whatever real alumni employment records exist.
  - Phase 3 (sufficient data): Full statistical analysis with reliable diagnostics.

The model automatically transitions between phases based on available data.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from models.arima_forecast_result import (
    ArimaForecastResult,
    ArimaForecastResultRead,
)
from models.auth import CurrentUser
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.users import UserType
from services.machines.arima import ArimaForecast
from services.queries.forecast_queries import (
    save_forecast_result,
    get_forecast_by_id,
    get_latest_forecast,
    get_all_forecasts,
    get_historical_employment_counts,
)
from utils.rbac import require_authenticated


router = APIRouter(prefix="/predict", tags=["ARIMA Employment Forecast"])
FORECAST_CACHE_NAMESPACE = "forecast"
FORECAST_TTL = 3600  # forecasts are expensive and change slowly


# ─────────────────────────────────────────────────────────────────
# POST  /predict/forecast
# ─────────────────────────────────────────────────────────────────

@router.post("/forecast")
def run_employment_forecast(
    db: Session = Depends(get_session),
    forecast_steps: int = Query(
        default=3, ge=1, le=10,
        description="Number of years ahead to forecast",
    ),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Run an ARIMA(1,1,1) employment trend forecast.

    The model automatically uses real alumni employment data from the database
    when sufficient records are available (3+ years of data). Otherwise, it
    falls back to a synthetic baseline for illustrative forecasts.

    Staff and admin users only.
    """
    # Only staff/admin can run forecasts (it's an institutional analytics tool)
    if current_user.user_type not in {UserType.STAFF.value, UserType.ADMIN.value}:
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only staff and admin users can run employment forecasts",
            ).model_dump(mode="json"),
        )

    # Try to get real historical data from the alumni table
    real_data = get_historical_employment_counts(db)

    try:
        model = ArimaForecast(
            real_data=real_data,
            forecast_steps=forecast_steps,
        )
        result = model.forecast()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORECAST_FAILED.value,
                message=f"ARIMA forecast failed: {str(e)}",
            ).model_dump(mode="json"),
        )

    # Persist to database
    forecast_record = ArimaForecastResult(
        requested_by_ref_id=current_user.id,
        forecast_data=result,
        data_source=result["data_source"],
        observations_count=result["observations"],
        forecast_steps=forecast_steps,
    )
    save_forecast_result(db, forecast_record)
    invalidate_cache_namespaces(FORECAST_CACHE_NAMESPACE)

    return StandardResponse(
        success=True,
        code=SuccessCode.FORECAST_COMPLETED.value,
        message=(
            f"ARIMA forecast completed using {result['data_source']} data "
            f"({result['observations']} observations, {forecast_steps} years ahead)"
        ),
        data={
            "forecast_id": str(forecast_record.id),
            **result,
        },
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/forecast/latest
# ─────────────────────────────────────────────────────────────────

@router.get("/forecast/latest")
def get_latest_employment_forecast(
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get the most recent ARIMA forecast result."""
    if current_user.user_type not in {UserType.STAFF.value, UserType.ADMIN.value}:
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only staff and admin users can view employment forecasts",
            ).model_dump(mode="json"),
        )

    cache_key = generate_cache_key(f"{FORECAST_CACHE_NAMESPACE}:latest")
    return cache_get_or_set(
        cache_key,
        lambda: _build_latest_forecast_response(db),
        ttl=FORECAST_TTL,
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/forecast/history
# ─────────────────────────────────────────────────────────────────

@router.get("/forecast/history")
def get_forecast_history(
    db: Session = Depends(get_session),
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get all stored ARIMA forecast results, newest first."""
    if current_user.user_type not in {UserType.STAFF.value, UserType.ADMIN.value}:
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only staff and admin users can view employment forecasts",
            ).model_dump(mode="json"),
        )

    cache_key = generate_cache_key(f"{FORECAST_CACHE_NAMESPACE}:history", limit=limit)
    return cache_get_or_set(
        cache_key,
        lambda: _build_forecast_list_response(db, limit),
        ttl=FORECAST_TTL,
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/forecast/{forecast_id}
# ─────────────────────────────────────────────────────────────────

@router.get("/forecast/{forecast_id}")
def get_forecast_detail(
    forecast_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Retrieve a stored ARIMA forecast by its UUID."""
    if current_user.user_type not in {UserType.STAFF.value, UserType.ADMIN.value}:
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only staff and admin users can view employment forecasts",
            ).model_dump(mode="json"),
        )

    forecast = get_forecast_by_id(db, forecast_id)
    if not forecast:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORECAST_NOT_FOUND.value,
                message=f"Forecast with ID '{forecast_id}' not found",
            ).model_dump(mode="json"),
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.FORECAST_RETRIEVED.value,
        message="Forecast retrieved successfully",
        data=ArimaForecastResultRead.model_validate(forecast).model_dump(mode="json"),
    )


# ── Response builders ─────────────────────────────────────────


def _build_latest_forecast_response(db: Session) -> StandardResponse:
    forecast = get_latest_forecast(db)
    if not forecast:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORECAST_NOT_FOUND.value,
                message="No forecast results found. Run a forecast first via POST /predict/forecast.",
            ).model_dump(mode="json"),
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.FORECAST_RETRIEVED.value,
        message="Latest forecast retrieved successfully",
        data=ArimaForecastResultRead.model_validate(forecast).model_dump(mode="json"),
    )


def _build_forecast_list_response(
    db: Session,
    limit: int,
) -> StandardResponse:
    forecasts = get_all_forecasts(db, limit)

    data = [
        ArimaForecastResultRead.model_validate(f).model_dump(mode="json")
        for f in forecasts
    ]

    return StandardResponse(
        success=True,
        code=SuccessCode.FORECASTS_RETRIEVED.value,
        message=f"Found {len(data)} forecast(s)",
        data=data,
    )
