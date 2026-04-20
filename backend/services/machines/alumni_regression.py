"""
alumni_regression.py
====================
Drop-in module exposing two classes:

    AlumniPredictor   — load trained models and run predictions
    PredictionResult  — structured result object returned by AlumniPredictor.predict()

Intended use
------------
    from alumni_regression import AlumniPredictor

    predictor = AlumniPredictor()                         # load once at startup
    result    = predictor.predict(cgpa=2.0, internships=1)
    print(result.to_dict())                               # serialise to dict / JSON

CGPA scale
----------
1.0  → highest honour / best student
3.75 → lowest passing grade
≥ 4.0 → academic failure — rejected with ValueError
"""

import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

# Default bundle location: models/ folder next to this file.
# Override by passing bundle_path= to AlumniPredictor().
_DEFAULT_BUNDLE = Path(__file__).parent / "random_pickles" / \
    "alumni_regression_bundle.pkl"


# ── Result container ──────────────────────────────────────────────────────────

@dataclass
class PredictionResult:
    """
    Structured output from a single AlumniPredictor.predict() call.

    Attributes (inputs)
    -------------------
    cgpa            : float — CGPA used for this prediction
    internships     : int   — 0 or 1
    projects        : int   — number of projects
    skills_count    : int   — number of skills
    extracurricular : int   — 0 or 1

    Attributes (predictions)
    ------------------------
    predicted_salary_php       : int   — estimated starting salary in PHP/month (rounded)
    predicted_job_search_weeks : float — estimated job search duration in weeks
    duration_range             : str   — plain-language range for UI display (e.g. "8–16 weeks")

    salary_lower / salary_upper     : float — ±1 RMSE confidence interval for salary
    duration_lower / duration_upper : float — bounded interval for duration (±4 weeks)

    salary_band    : str — "Low" | "Mid" | "High"
    search_outlook : str — "Short" | "Moderate" | "Long"

    Methods
    -------
    to_dict() → dict
        Serialise to a plain Python dict. Safe to pass directly to
        jsonify(), json.dumps(), or a Pydantic response model.
    """

    # — inputs —
    cgpa: float
    internships: int
    projects: int
    skills_count: int
    extracurricular: int

    # — raw predictions —
    predicted_salary_php: int
    predicted_job_search_weeks: float
    duration_range: str

    # — confidence intervals / bounds —
    salary_lower: float
    salary_upper: float
    duration_lower: float
    duration_upper: float

    # — human-readable labels —
    salary_band: str     # "Low" | "Mid" | "High"
    search_outlook: str  # "Short" | "Moderate" | "Long"

    def to_dict(self) -> dict:
        """
        Return a serialisation-ready dict.
        """
        return {
            "input": {
                "cgpa": self.cgpa,
                "internships": self.internships,
                "projects": self.projects,
                "skills_count": self.skills_count,
                "extracurricular": self.extracurricular,
            },
            "predictions": {
                "starting_salary": {
                    "value": self.predicted_salary_php,
                    "lower": round(self.salary_lower, 2),
                    "upper": round(self.salary_upper, 2),
                    "band": self.salary_band,
                    "unit": "PHP/month",
                },
                "job_search_duration": {
                    "value": round(self.predicted_job_search_weeks, 1),
                    "range_str": self.duration_range,
                    "lower": round(self.duration_lower, 1),
                    "upper": round(self.duration_upper, 1),
                    "outlook": self.search_outlook,
                    "unit": "weeks",
                },
            },
        }


# ── Main predictor class ──────────────────────────────────────────────────────

class AlumniPredictor:
    """
    Loads trained Linear Regression models from a .pkl bundle and runs
    alumni outcome predictions.

    Two models are loaded internally:
        - Salary model    → predicts starting salary (PHP/month)
        - Duration model  → predicts job search duration (weeks)

    Both models share the same 5-feature input and a fitted StandardScaler.

    Parameters
    ----------
    bundle_path : Path or str, optional
        Path to `alumni_regression_bundle.pkl`.
        Defaults to `random_pickles/alumni_regression_bundle.pkl` next to this file.
        Pass an explicit path if your project layout differs.

    Raises
    ------
    FileNotFoundError
        If the .pkl bundle cannot be found at the resolved path.
    """

    def __init__(self, bundle_path: Optional[Path] = None):
        path = Path(bundle_path) if bundle_path else _DEFAULT_BUNDLE

        if not path.exists():
            raise FileNotFoundError(
                f"Model bundle not found: {path}\n"
                "Run `python train_models.py` to generate it first."
            )

        with open(path, "rb") as f:
            bundle = pickle.load(f)

        self._salary_model = bundle["salary_model"]
        self._duration_model = bundle["duration_model"]
        self._scaler = bundle["scaler"]
        self._features = bundle["features"]
        self._metrics = bundle.get("metrics", {})

        # Dynamically extract RMSE for salary bounds if available, fallback to 2900
        self._salary_rmse = self._metrics.get("salary", {}).get("rmse", 2900.0)

    # ── Public methods ────────────────────────────────────────────────────────

    def predict(
        self,
        cgpa: float,
        internships: int = 0,
        projects: int = 0,
        skills_count: int = 5,
        extracurricular: int = 0,
    ) -> PredictionResult:
        """
        Predict starting salary and job search duration for one alumnus.

        Parameters
        ----------
        cgpa : float
            GPA on a 1.0–3.75 scale. 1.0 = best, 3.75 = lowest passing.

        internships : int, default 0
            Whether the student completed at least one internship. 0 or 1.

        projects : int, default 0
            Number of notable academic or personal projects. Range: 0–6.

        skills_count : int, default 5
            Total number of technical and soft skills listed. Range: 1–10.

        extracurricular : int, default 0
            Whether the student was involved in extracurricular activities. 0 or 1.
        """
        self._validate(cgpa, internships, projects,
                       skills_count, extracurricular)

        X_raw = np.array(
            [[cgpa, internships, projects, skills_count, extracurricular]])
        X_scaled = self._scaler.transform(X_raw)

        raw_salary = float(self._salary_model.predict(X_scaled)[0])
        raw_duration = float(self._duration_model.predict(X_scaled)[0])

        # Clamp to physically meaningful bounds matching training data
        salary = int(round(np.clip(raw_salary, 16_000.0, 65_000.0), -2))
        duration = round(float(np.clip(raw_duration, 4.0, 32.0)), 1)

        # Express duration as a ±4-week range
        dur_lo = max(4.0, round(duration - 4.0, 1))
        dur_hi = min(32.0, round(duration + 4.0, 1))
        duration_range = f"{dur_lo:.0f}–{dur_hi:.0f} weeks"

        return PredictionResult(
            cgpa=cgpa,
            internships=internships,
            projects=projects,
            skills_count=skills_count,
            extracurricular=extracurricular,
            predicted_salary_php=salary,
            predicted_job_search_weeks=duration,
            duration_range=duration_range,
            salary_lower=salary - self._salary_rmse,
            salary_upper=salary + self._salary_rmse,
            duration_lower=dur_lo,
            duration_upper=dur_hi,
            salary_band=self._salary_band(salary),
            search_outlook=self._search_outlook(duration),
        )

    def predict_batch(self, records: list[dict]) -> list[dict]:
        """
        Predict outcomes for multiple alumni in one call.
        """
        return [self.predict(**r).to_dict() for r in records]

    def model_info(self) -> dict:
        """
        Return model metadata and training performance metrics.
        """
        return {
            "features": self._features,
            "cgpa_scale": "1.0 (best) → 3.75 (lowest passing). Values ≥ 4.0 are rejected.",
            "models": {
                "salary": {
                    "type": "LinearRegression",
                    "target": "starting_salary (PHP/month)",
                    **self._metrics.get("salary", {}),
                },
                "duration": {
                    "type": "LinearRegression",
                    "target": "job_search_duration_weeks",
                    **self._metrics.get("duration", {}),
                },
            },
        }

    # ── Internal helpers (not part of the public API) ─────────────────────────

    @staticmethod
    def _validate(cgpa, internships, projects, skills_count, extracurricular):
        if not (1.0 <= cgpa <= 3.75):
            raise ValueError(
                f"cgpa must be 1.0–3.75 (received {cgpa}). "
                "Values ≥ 4.0 indicate academic failure and are not accepted."
            )
        if internships not in (0, 1):
            raise ValueError(
                f"internships must be 0 or 1 (received {internships})")
        if not (0 <= projects <= 6):
            raise ValueError(f"projects must be 0–6 (received {projects})")
        if not (1 <= skills_count <= 10):
            raise ValueError(
                f"skills_count must be 1–10 (received {skills_count})")
        if extracurricular not in (0, 1):
            raise ValueError(
                f"extracurricular must be 0 or 1 (received {extracurricular})")

    @staticmethod
    def _salary_band(salary: float) -> str:
        if salary < 30_000:
            return "Low"
        if salary < 45_000:
            return "Mid"
        return "High"

    @staticmethod
    def _search_outlook(weeks: float) -> str:
        if weeks <= 6:
            return "Short"
        if weeks <= 14:
            return "Moderate"
        return "Long"
