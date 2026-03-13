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
from models.alumni import Alumni
from models.auth import CurrentUser
from models.employability import (
    EmployabilityInput,
    EmployabilityPrediction,
    EmployabilityPredictionRead,
)
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.users import UserType
from services.machines.random_forest import EmployabilityPredictor
from utils.rbac import require_authenticated


router = APIRouter(prefix="/predict", tags=["Employability Prediction"])
PREDICT_CACHE_NAMESPACE = "predict"
PREDICT_DETAIL_TTL = 1800
PREDICT_ALUMNI_TTL = 300


def _resolve_active_alumni(db: Session, alumni_code: uuid.UUID) -> Alumni | None:
    return db.exec(
        select(Alumni).where((Alumni.alumni_code == alumni_code) & (Alumni.is_deleted == False))
    ).first()


def _ensure_owner_or_staff_plus(current_user: CurrentUser, alumni_user_code: str | None) -> None:
    if current_user.user_type in {UserType.STAFF.value, UserType.ADMIN.value}:
        return

    if not current_user.user_code or not alumni_user_code or str(current_user.user_code) != str(alumni_user_code):
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="You are only allowed to access your own prediction records",
            ).model_dump(mode="json"),
        )

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
    current_user: CurrentUser = Depends(require_authenticated),
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

    if current_user.user_type == UserType.USER.value:
        if alumni_code is None:
            alumni = db.exec(
                select(Alumni).where(
                    (Alumni.user_code == uuid.UUID(str(current_user.user_code)))
                    & (Alumni.is_deleted == False)
                )
            ).first()
            if not alumni:
                raise HTTPException(
                    status_code=404,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message="Alumni profile not found for current user",
                    ).model_dump(mode="json"),
                )
            alumni_code = alumni.alumni_code
        else:
            alumni = _resolve_active_alumni(db, alumni_code)
            if not alumni:
                raise HTTPException(
                    status_code=404,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message="Alumni not found",
                    ).model_dump(mode="json"),
                )
            _ensure_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

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
# GET  /predict/employability/me
# ─────────────────────────────────────────────────────────────────

@router.get("/employability/me")
def get_my_predictions(
    db: Session = Depends(get_session),
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get all predictions linked to the current authenticated alumni, newest first."""
    # Find alumni record for the current user
    alumni = db.exec(
        select(Alumni).where(
            (Alumni.user_code == uuid.UUID(str(current_user.user_code)))
            & (Alumni.is_deleted == False)
        )
    ).first()

    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni profile not found for current user",
            ).model_dump(mode="json"),
        )

    # Use the existing response builder
    return _build_alumni_predictions_response(db, alumni.alumni_code, limit)


# ─────────────────────────────────────────────────────────────────
# GET  /predict/employability/{prediction_id}
# ─────────────────────────────────────────────────────────────────

@router.get("/employability/{prediction_id}")
def get_prediction(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Retrieve a stored prediction by its UUID."""
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

    if current_user.user_type == UserType.USER.value:
        if prediction.alumni_code is None:
            raise HTTPException(
                status_code=403,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.FORBIDDEN.value,
                    message="You are not allowed to access this prediction",
                ).model_dump(mode="json"),
            )
        alumni = _resolve_active_alumni(db, prediction.alumni_code)
        if not alumni:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message="Alumni not found",
                ).model_dump(mode="json"),
            )
        _ensure_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

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
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get all predictions linked to a specific alumni, newest first."""
    if current_user.user_type == UserType.USER.value:
        alumni = _resolve_active_alumni(db, alumni_code)
        if not alumni:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message="Alumni not found",
                ).model_dump(mode="json"),
            )
        _ensure_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

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