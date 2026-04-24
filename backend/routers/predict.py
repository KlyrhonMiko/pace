"""
Employability prediction router — runs the dual Random Forest
models using data looked up from the alumni's database records.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from models.alumni import Alumni
from models.auth import CurrentUser
from models.employability import (
    EmployabilityPrediction,
    EmployabilityPredictionRead,
)
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.users import UserType
from services.machines.random_forest import EmployabilityPredictor
from services.queries.predict_queries import (
    get_active_alumni_by_code,
    get_alumni_by_user_code,
    get_predictions_by_alumni,
    save_prediction,
    get_prediction_by_id,
    get_student_record_by_alumni_code,
    get_alumni_skills_by_alumni_code,
    get_course_abbv_by_course_code,
    build_employability_dict,
)
from utils.rbac import require_authenticated


router = APIRouter(prefix="/predict", tags=["Employability Prediction"])
PREDICT_CACHE_NAMESPACE = "predict"
PREDICT_DETAIL_TTL = 1800
PREDICT_ALUMNI_TTL = 300


def _resolve_active_alumni(db: Session, alumni_code: uuid.UUID) -> Alumni | None:
    return get_active_alumni_by_code(db, alumni_code)


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

# ── Singleton predictor — loaded lazily on first request ──
_predictor: Optional[EmployabilityPredictor] = None

def get_predictor() -> Optional[EmployabilityPredictor]:
    """Lazy initializer for the predictor singleton."""
    global _predictor
    if _predictor is None:
        try:
            _predictor = EmployabilityPredictor()
            print("[PREDICT] ✓ EmployabilityPredictor loaded (lazy)")
        except Exception as e:
            print(f"[PREDICT] ⚠ Could not load predictor: {e}")
            _predictor = None
    return _predictor


# ─────────────────────────────────────────────────────────────────
# POST  /predict/employability/{alumni_code}
# ─────────────────────────────────────────────────────────────────

@router.post("/employability/{alumni_code}")
def predict_employability(
    alumni_code: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Run the dual-model employability prediction for a specific alumni.
    """
    predictor = get_predictor()
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

    # Resolve and validate alumni
    alumni = _resolve_active_alumni(db, alumni_code)
    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message=f"Alumni with code '{alumni_code}' not found",
            ).model_dump(mode="json"),
        )

    # Authorization: regular users can only predict for themselves
    if current_user.user_type == UserType.USER.value:
        _ensure_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

    # Look up required data from the database
    student_record = get_student_record_by_alumni_code(db, alumni_code)
    if not student_record:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.STUDENT_RECORD_NOT_LINKED.value,
                message="No student record found for this alumni. Please ensure academic records are linked.",
            ).model_dump(mode="json"),
        )

    alumni_skills = get_alumni_skills_by_alumni_code(db, alumni_code)
    if not alumni_skills:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_SKILLS_NOT_LINKED.value,
                message="No skills record found for this alumni. Please ensure skill scores are linked.",
            ).model_dump(mode="json"),
        )

    # Resolve degree from course
    degree = "BSIT"  # fallback
    if student_record.course_code:
        resolved = get_course_abbv_by_course_code(db, student_record.course_code)
        if resolved:
            degree = resolved

    # Assemble predictor dict from DB data
    student_dict = build_employability_dict(student_record, alumni_skills, degree)

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
    save_prediction(db, prediction)
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
    alumni = get_alumni_by_user_code(db, uuid.UUID(str(current_user.user_code)))

    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni profile not found for current user",
            ).model_dump(mode="json"),
        )

    # Cache the result for this specific user
    cache_key = generate_cache_key(
        f"{PREDICT_CACHE_NAMESPACE}:me",
        user_code=str(current_user.user_code),
        limit=limit,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_alumni_predictions_response(db, alumni.alumni_code, limit),
        ttl=PREDICT_DETAIL_TTL,
    )


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
    prediction = get_prediction_by_id(db, prediction_id)
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
    prediction = get_prediction_by_id(db, prediction_id)

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
    predictions = get_predictions_by_alumni(db, alumni_code, limit)

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