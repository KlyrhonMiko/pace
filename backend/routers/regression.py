"""
Linear Regression prediction router — predicts alumni starting salary
and job search duration using data from the alumni's database records.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from models.alumni_regression_prediction import (
    AlumniRegressionPrediction,
    AlumniRegressionPredictionRead,
)
from models.auth import CurrentUser
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.users import UserType
from services.machines.alumni_regression import AlumniPredictor
from services.queries.predict_queries import (
    get_active_alumni_by_code,
    get_alumni_by_user_code,
    get_student_record_by_alumni_code,
    get_alumni_skills_by_alumni_code,
    build_regression_inputs,
)
from services.queries.regression_queries import (
    save_regression_prediction,
    get_regression_prediction_by_id,
    get_regression_predictions_by_alumni,
)
from utils.rbac import require_authenticated


router = APIRouter(prefix="/predict", tags=["Linear Regression Prediction"])
REGRESSION_CACHE_NAMESPACE = "regression"
REGRESSION_DETAIL_TTL = 1800
REGRESSION_ALUMNI_TTL = 300


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
    regression_predictor = AlumniPredictor()
    print("[REGRESSION] ✓ AlumniPredictor (Linear Regression) loaded successfully")
except FileNotFoundError as e:
    regression_predictor = None
    print(f"[REGRESSION] ⚠ Could not load regression predictor: {e}")


# ─────────────────────────────────────────────────────────────────
# POST  /predict/regression/{alumni_code}
# ─────────────────────────────────────────────────────────────────

@router.post("/regression/{alumni_code}")
def predict_regression(
    alumni_code: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Predict starting salary and job search duration for an alumni.

    1. Looks up alumni's student_record and alumni_skills from DB.
    2. Derives the 5 regression inputs (cgpa, internships, projects, skills_count, extracurricular).
    3. Runs both Linear Regression models (salary + duration).
    4. Persists the result in the `alumni_regression_predictions` table.
    5. Returns the prediction wrapped in StandardResponse.
    """
    if regression_predictor is None:
        raise HTTPException(
            status_code=503,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.MODEL_NOT_LOADED.value,
                message="Linear Regression models are not loaded. Please contact the administrator.",
            ).model_dump(mode="json"),
        )

    # Resolve and validate alumni
    alumni = get_active_alumni_by_code(db, alumni_code)
    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message=f"Alumni with code '{alumni_code}' not found",
            ).model_dump(mode="json"),
        )

    # Authorization
    if current_user.user_type == UserType.USER.value:
        _ensure_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

    # Look up required data
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

    # Build regression inputs from DB records
    regression_inputs = build_regression_inputs(student_record, alumni_skills)

    try:
        result = regression_predictor.predict(**regression_inputs)
        result_dict = result.to_dict()
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.REGRESSION_PREDICTION_FAILED.value,
                message=f"Prediction failed due to invalid data: {str(e)}",
            ).model_dump(mode="json"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.REGRESSION_PREDICTION_FAILED.value,
                message=f"Prediction failed: {str(e)}",
            ).model_dump(mode="json"),
        )

    # Persist to database
    prediction = AlumniRegressionPrediction(
        alumni_code=alumni_code,
        input_data=regression_inputs,
        prediction_result=result_dict,
        predicted_salary=result.predicted_salary_php,
        predicted_duration_weeks=result.predicted_job_search_weeks,
        salary_band=result.salary_band,
        search_outlook=result.search_outlook,
    )
    save_regression_prediction(db, prediction)
    invalidate_cache_namespaces(REGRESSION_CACHE_NAMESPACE)

    return StandardResponse(
        success=True,
        code=SuccessCode.REGRESSION_PREDICTION_COMPLETED.value,
        message="Linear Regression prediction completed successfully",
        data={
            "prediction_id": str(prediction.id),
            **result_dict,
        },
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/regression/me
# ─────────────────────────────────────────────────────────────────

@router.get("/regression/me")
def get_my_regression_predictions(
    db: Session = Depends(get_session),
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get all regression predictions for the current authenticated alumni."""
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

    cache_key = generate_cache_key(
        f"{REGRESSION_CACHE_NAMESPACE}:me",
        user_code=str(current_user.user_code),
        limit=limit,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_regression_list_response(db, alumni.alumni_code, limit),
        ttl=REGRESSION_DETAIL_TTL,
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/regression/{prediction_id}
# ─────────────────────────────────────────────────────────────────

@router.get("/regression/{prediction_id}")
def get_regression_prediction(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Retrieve a stored regression prediction by its UUID."""
    prediction = get_regression_prediction_by_id(db, prediction_id)
    if not prediction:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.REGRESSION_PREDICTION_NOT_FOUND.value,
                message=f"Regression prediction with ID '{prediction_id}' not found",
            ).model_dump(mode="json"),
        )

    # Authorization for regular users
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
        alumni = get_active_alumni_by_code(db, prediction.alumni_code)
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
        f"{REGRESSION_CACHE_NAMESPACE}:detail",
        prediction_id=str(prediction_id),
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_regression_detail_response(db, prediction_id),
        ttl=REGRESSION_DETAIL_TTL,
    )


# ─────────────────────────────────────────────────────────────────
# GET  /predict/regression/alumni/{alumni_code}
# ─────────────────────────────────────────────────────────────────

@router.get("/regression/alumni/{alumni_code}")
def get_alumni_regression_predictions(
    alumni_code: uuid.UUID,
    db: Session = Depends(get_session),
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get all regression predictions for a specific alumni."""
    if current_user.user_type == UserType.USER.value:
        alumni = get_active_alumni_by_code(db, alumni_code)
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
        f"{REGRESSION_CACHE_NAMESPACE}:alumni",
        alumni_code=str(alumni_code),
        limit=limit,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_regression_list_response(db, alumni_code, limit),
        ttl=REGRESSION_ALUMNI_TTL,
    )


# ── Response builders ─────────────────────────────────────────


def _build_regression_detail_response(
    db: Session,
    prediction_id: uuid.UUID,
) -> StandardResponse:
    prediction = get_regression_prediction_by_id(db, prediction_id)
    if not prediction:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.REGRESSION_PREDICTION_NOT_FOUND.value,
                message=f"Regression prediction with ID '{prediction_id}' not found",
            ).model_dump(mode="json"),
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.REGRESSION_PREDICTION_RETRIEVED.value,
        message="Regression prediction retrieved successfully",
        data=AlumniRegressionPredictionRead.model_validate(prediction).model_dump(mode="json"),
    )


def _build_regression_list_response(
    db: Session,
    alumni_code: uuid.UUID,
    limit: int,
) -> StandardResponse:
    predictions = get_regression_predictions_by_alumni(db, alumni_code, limit)

    data = [
        AlumniRegressionPredictionRead.model_validate(p).model_dump(mode="json")
        for p in predictions
    ]

    return StandardResponse(
        success=True,
        code=SuccessCode.REGRESSION_PREDICTIONS_RETRIEVED.value,
        message=f"Found {len(data)} regression prediction(s) for alumni '{alumni_code}'",
        data=data,
    )
