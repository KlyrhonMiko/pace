"""
Model Information router — exposes metadata and performance metrics
for all ML models deployed in the system (admin-only).
"""

import os
import pickle
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from models.auth import CurrentUser
from models.job_listings import JobListing
from models.response_codes import StandardResponse, SuccessCode
from core.database import get_session
from services.machines.job_matching import job_matching_service
from utils.rbac import require_admin

router = APIRouter(prefix="/predict", tags=["Model Information"])

# Paths to model artifacts
_PICKLE_DIR = Path(__file__).parent.parent / "services" / "machines" / "random_pickles"
_REGRESSION_BUNDLE = _PICKLE_DIR / "alumni_regression_bundle.pkl"


def _file_meta(path: Path) -> dict:
    """Return size and last-modified timestamp for a file."""
    if not path.exists():
        return {"size_bytes": 0, "last_modified": None}
    stat = path.stat()
    return {
        "size_bytes": stat.st_size,
        "last_modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def _load_rf_info() -> list[dict]:
    """Load Random Forest model metadata from pickle info files."""
    models = []

    # Model 1 — Realistic Assessment (with CGPA)
    info1_path = _PICKLE_DIR / "model1_info.pkl"
    model1_path = _PICKLE_DIR / "model1_realistic.pkl"
    if info1_path.exists():
        with open(info1_path, "rb") as f:
            info1 = pickle.load(f)
        models.append({
            "id": "rf_model1",
            "name": "Employability — Realistic Assessment",
            "type": "Random Forest Classifier",
            "target": "Employability (with CGPA)",
            "description": "Predicts graduate employability using all features including CGPA for an overall realistic assessment.",
            "includes_cgpa": info1.get("includes_cgpa", True),
            "num_features": len(info1.get("feature_columns", [])),
            "features": info1.get("common_features", []),
            "programs": [c.replace("Program_", "") for c in info1.get("dummy_columns", [])],
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 8,
                "min_samples_split": 20,
                "min_samples_leaf": 10,
                "class_weight": "balanced",
            },
            **_file_meta(model1_path),
        })

    # Model 2 — Improvement Roadmap (without CGPA)
    info2_path = _PICKLE_DIR / "model2_info.pkl"
    model2_path = _PICKLE_DIR / "model2_improvement.pkl"
    if info2_path.exists():
        with open(info2_path, "rb") as f:
            info2 = pickle.load(f)
        models.append({
            "id": "rf_model2",
            "name": "Employability — Improvement Roadmap",
            "type": "Random Forest Classifier",
            "target": "Employability (without CGPA)",
            "description": "Predicts employability excluding CGPA to surface actionable skill gaps and improvement areas.",
            "includes_cgpa": info2.get("includes_cgpa", False),
            "num_features": len(info2.get("feature_columns", [])),
            "features": info2.get("common_features", []),
            "programs": [c.replace("Program_", "") for c in info2.get("dummy_columns", [])],
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 8,
                "min_samples_split": 20,
                "min_samples_leaf": 10,
                "class_weight": "balanced",
            },
            **_file_meta(model2_path),
        })

    return models


def _load_regression_info() -> list[dict]:
    """Load Linear Regression model metadata from the bundle."""
    models = []
    if not _REGRESSION_BUNDLE.exists():
        return models

    with open(_REGRESSION_BUNDLE, "rb") as f:
        bundle = pickle.load(f)

    features = bundle.get("features", [])
    metrics = bundle.get("metrics", {})
    file_meta = _file_meta(_REGRESSION_BUNDLE)

    # Salary model
    salary_metrics = metrics.get("salary", {})
    models.append({
        "id": "lr_salary",
        "name": "Alumni Salary Prediction",
        "type": "Linear Regression",
        "target": "Starting Salary (PHP/month)",
        "description": "Predicts the expected starting salary for alumni based on academic performance and extracurricular factors.",
        "num_features": len(features),
        "features": features,
        "metrics": {
            "r_squared": salary_metrics.get("r2"),
            "mae": salary_metrics.get("mae"),
            "rmse": salary_metrics.get("rmse"),
        },
        **file_meta,
    })

    # Duration model
    duration_metrics = metrics.get("duration", {})
    models.append({
        "id": "lr_duration",
        "name": "Job Search Duration Prediction",
        "type": "Linear Regression",
        "target": "Job Search Duration (weeks)",
        "description": "Estimates how long an alumni's job search will take based on academic and skill factors.",
        "num_features": len(features),
        "features": features,
        "metrics": {
            "r_squared": duration_metrics.get("r2"),
            "mae": duration_metrics.get("mae"),
            "rmse": duration_metrics.get("rmse"),
        },
        **file_meta,
    })

    return models


def _load_career_track_info() -> list[dict]:
    """Load Career Track model metadata."""
    models = []
    career_path = _PICKLE_DIR / "career_track_pipeline.pkl"
    if career_path.exists():
        models.append({
            "id": "rf_career_track",
            "name": "Career Track Predictor",
            "type": "Random Forest Classifier",
            "target": "Career Track (Role)",
            "description": "Predicts the most suitable IT/CS career track based on skills, internship duration, and academic performance (GWA).",
            "num_features": 3,
            "features": ["skills", "internship_duration", "gwa"],
            "programs": ["BSIT", "BSCS", "BSIS"],
            "hyperparameters": {
                "n_estimators": 100,
                "random_state": 42,
            },
            **_file_meta(career_path),
        })
    return models


def _load_semantic_matcher_info(session: Session) -> list[dict]:
    """Return metadata for the semantic matching model."""
    runtime_status = job_matching_service.get_runtime_status()
    missing_embedding_count = session.exec(
        select(func.count()).select_from(JobListing).where(
            (JobListing.is_active == True) &
            (JobListing.is_deleted == False) &
            (JobListing.vector_embedding == None)
        )
    ).one()
    return [{
        "id": "semantic_matcher",
        "name": "Semantic Job Matcher",
        "type": "Sentence Transformer (Dense Embeddings)",
        "target": "Semantic Similarity Score",
        "description": "Calculates semantic similarity between alumni profiles and job listings using the all-MiniLM-L6-v2 model (384-dimensional dense vectors). Powering both search results and personalized recommendations.",
        "num_features": 384,
        "features": ["profile_text", "job_description"],
        "metrics": {
            "algorithm": "Cosine Similarity",
            "dimensions": 384,
            "normalization": "Linear with boost (0-100%)"
        },
        "size_bytes": 83886080, # Standard footprint for all-MiniLM-L6-v2 (~80MB)
        "last_modified": None,
        "runtime_available": runtime_status["runtime_available"],
        "last_load_error": runtime_status["last_load_error"],
        "last_failure_at": runtime_status["last_failure_at"],
        "active_device": runtime_status["active_device"],
        "active_backend": runtime_status["active_backend"],
        "active_device_name": runtime_status["active_device_name"],
        "missing_embedding_count": missing_embedding_count,
    }]


def _arima_info() -> list[dict]:
    """Return static metadata for the ARIMA model."""
    return [{
        "id": "arima_employment",
        "name": "Employment Trend Forecast",
        "type": "ARIMA(1,1,1)",
        "target": "Annual Employment Rate (%)",
        "description": "Forecasts alumni employment trends using historical data. Uses synthetic baseline when insufficient data is available.",
        "num_features": 1,
        "features": ["historical_employment_rate"],
        "metrics": None,
        "size_bytes": 0,
        "last_modified": None,
    }]


# ─────────────────────────────────────────────────────────────────
# GET  /predict/models/info
# ─────────────────────────────────────────────────────────────────

@router.get("/models/info")
def get_models_info(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """
    Return metadata and performance metrics for every ML model
    deployed in the system. Admin-only.
    """
    rf_models = _load_rf_info()
    career_models = _load_career_track_info()
    semantic_models = _load_semantic_matcher_info(session)
    lr_models = _load_regression_info()
    arima_models = _arima_info()

    all_models = rf_models + career_models + semantic_models + lr_models + arima_models

    return StandardResponse(
        success=True,
        code=SuccessCode.MODEL_INFO_RETRIEVED.value,
        message=f"Retrieved info for {len(all_models)} models",
        data={
            "total_models": len(all_models),
            "models": all_models,
        },
    )
