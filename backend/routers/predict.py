"""
Employability prediction router — runs the dual Random Forest
models and (optionally) persists input + results.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from models.employability import (
    EmployabilityInput,
    EmployabilityPrediction,
    EmployabilityPredictionRead,
)
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from services.machines.random_forest import EmployabilityPredictor


router = APIRouter(prefix="/predict", tags=["Employability Prediction"])
PREDICT_CACHE_NAMESPACE = "predict"
PREDICT_DETAIL_TTL = 1800
PREDICT_ALUMNI_TTL = 300

# ── Singleton predictor — loaded once, reused for every request ──
try:
    predictor = EmployabilityPredictor()
    print("[PREDICT] ✓ EmployabilityPredictor loaded successfully")
except FileNotFoundError as e:
    predictor = None
    print(f"[PREDICT] ⚠ Could not load predictor: {e}")


# ─────────────────────────────────────────────────────────────────
# POST  /predict/employability
# ─────────────────────────────────────────────────────────────────

@router.post("/employability")
def predict_employability(
    input_data: EmployabilityInput,
    db: Session = Depends(get_session),
    alumni_code: Optional[uuid.UUID] = Query(
        default=None,
        description="Optional alumni UUID to link the prediction to an alumni record",
    ),
):
    """
    Run the dual-model employability prediction.

    1. Validates the input via Pydantic (automatic).
    2. Maps snake_case fields → predictor key names.
    3. Runs both Random Forest models.
    4. Stores input + result in the `employability_predictions` table.
    5. Returns the prediction wrapped in StandardResponse.
    """
    # Guard: make sure the models are available
    if predictor is None or not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.MODEL_NOT_LOADED.value,
                message="ML models are not loaded. Please contact the administrator.",
            ).model_dump(mode="json"),
        )

    # Map API fields → predictor keys and run prediction
    student_dict = input_data.to_predictor_dict()

    try:
        result = predictor.predict(student_dict)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.PREDICTION_FAILED.value,
                message=f"Prediction failed: {str(e)}",
            ).model_dump(mode="json"),
        )

    # Persist to database
    prediction = EmployabilityPrediction(
        alumni_code=alumni_code,
        input_data=student_dict,
        prediction_result=result,
        realistic_prediction=result["realistic_assessment"]["prediction"],
        realistic_probability=result["realistic_assessment"]["probability"],
        improvement_prediction=result["improvement_roadmap"]["prediction"],
        improvement_probability=result["improvement_roadmap"]["probability"],
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    invalidate_cache_namespaces(PREDICT_CACHE_NAMESPACE)

    return StandardResponse(
        success=True,
        code=SuccessCode.PREDICTION_COMPLETED.value,
        message="Employability prediction completed successfully",
        data={
            "prediction_id": str(prediction.id),
            **result,
        },
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/employability/{prediction_id}
# ─────────────────────────────────────────────────────────────────

@router.get("/employability/{prediction_id}")
def get_prediction(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_session),
):
    """Retrieve a stored prediction by its UUID."""
    cache_key = generate_cache_key(f"{PREDICT_CACHE_NAMESPACE}:detail", prediction_id=str(prediction_id))
    return cache_get_or_set(
        cache_key,
        lambda: _build_prediction_detail_response(db, prediction_id),
        ttl=PREDICT_DETAIL_TTL,
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/employability/alumni/{alumni_code}
# ─────────────────────────────────────────────────────────────────

@router.get("/employability/alumni/{alumni_code}")
def get_alumni_predictions(
    alumni_code: uuid.UUID,
    db: Session = Depends(get_session),
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
):
    """Get all predictions linked to a specific alumni, newest first."""
    cache_key = generate_cache_key(
        f"{PREDICT_CACHE_NAMESPACE}:alumni",
        alumni_code=str(alumni_code),
        limit=limit,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_alumni_predictions_response(db, alumni_code, limit),
        ttl=PREDICT_ALUMNI_TTL,
    )


def _build_prediction_detail_response(
    db: Session,
    prediction_id: uuid.UUID,
) -> StandardResponse:
    prediction = db.get(EmployabilityPrediction, prediction_id)

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.PREDICTION_NOT_FOUND.value,
                message=f"Prediction with ID '{prediction_id}' not found",
            ).model_dump(mode="json"),
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.PREDICTION_RETRIEVED.value,
        message="Prediction retrieved successfully",
        data=EmployabilityPredictionRead.model_validate(prediction).model_dump(mode="json"),
    )


def _build_alumni_predictions_response(
    db: Session,
    alumni_code: uuid.UUID,
    limit: int,
) -> StandardResponse:
    query = (
        select(EmployabilityPrediction)
        .where(EmployabilityPrediction.alumni_code == alumni_code)
        .order_by(EmployabilityPrediction.created_at.desc())
        .limit(limit)
    )
    predictions = db.exec(query).all()

    data = [
        EmployabilityPredictionRead.model_validate(p).model_dump(mode="json")
        for p in predictions
    ]

    return StandardResponse(
        success=True,
        code=SuccessCode.PREDICTIONS_RETRIEVED.value,
        message=f"Found {len(data)} prediction(s) for alumni '{alumni_code}'",
        data=data,
    )