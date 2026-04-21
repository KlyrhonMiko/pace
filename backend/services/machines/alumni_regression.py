"""
alumni_regression.py
====================
Drop-in module exposing two classes:

    AlumniPredictor   — load trained models and run predictions
    PredictionResult  — structured result object returned by AlumniPredictor.predict()

Intended use
------------
Place this file and the `models/` folder in your project, then:

    from alumni_regression import AlumniPredictor

    predictor = AlumniPredictor()                         # load once at startup
    result    = predictor.predict(
                    cgpa=2.0,
                    internships=1,
                    soft_skills_avg=86.0,
                    hard_skills_avg=85.0,
                    avg_program_skill=87.0,
                )
    print(result.to_dict())                               # serialise to dict / JSON

No FastAPI, Flask, or any web framework is imported here.
Wire it into whatever backend your team is using.

CGPA scale
----------
1.0  → highest honour / best student
3.75 → lowest passing grade
≥ 4.0 → academic failure — rejected with ValueError

Skill averages
--------------
All three skill averages (soft_skills_avg, hard_skills_avg, avg_program_skill)
are on a 0–100 scale. In the training data they cluster between 75–100 (mean ~85).
The model is sensitive to differences in that band. Passing values below 60 is
extrapolation outside the training distribution and will produce unreliable results.

Internships
-----------
Minimum 1 (all students have completed at least one OJT). Maximum 5.
The salary premium for a first internship is small since it is universal;
each additional internship adds a meaningful but diminishing increment.
"""

import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

# Default bundle location: models/ folder next to this file.
# Override by passing bundle_path= to AlumniPredictor().
_DEFAULT_BUNDLE = Path(__file__).parent / "models" / \
    "alumni_regression_bundle.pkl"


# ── Result container ──────────────────────────────────────────────────────────

@dataclass
class PredictionResult:
    """
    Structured output from a single AlumniPredictor.predict() call.

    Attributes (inputs)
    -------------------
    cgpa              : float — CGPA used for this prediction (1.0 best, 3.75 lowest passing)
    internships       : int   — internship count, 1–5
    soft_skills_avg   : float — average soft skills score, 0–100
    hard_skills_avg   : float — average hard skills score, 0–100
    avg_program_skill : float — average program-specific skill score, 0–100

    Attributes (predictions)
    ------------------------
    predicted_salary_php       : int   — estimated starting salary in PHP/month (rounded to ₱100)
    predicted_job_search_weeks : float — estimated job search duration in weeks
    duration_range             : str   — plain-language range for UI display (e.g. "11–19 weeks")

    salary_lower / salary_upper     : float — ±1 RMSE confidence interval for salary
    duration_lower / duration_upper : float — ±4-week bounded interval for duration

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
    soft_skills_avg: float
    hard_skills_avg: float
    avg_program_skill: float

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
                "cgpa":              self.cgpa,
                "internships":       self.internships,
                "soft_skills_avg":   self.soft_skills_avg,
                "hard_skills_avg":   self.hard_skills_avg,
                "avg_program_skill": self.avg_program_skill,
            },
            "predictions": {
                "starting_salary": {
                    "value": self.predicted_salary_php,
                    "lower": round(self.salary_lower, 2),
                    "upper": round(self.salary_upper, 2),
                    "band":  self.salary_band,
                    "unit":  "PHP/month",
                },
                "job_search_duration": {
                    "value":     round(self.predicted_job_search_weeks, 1),
                    "range_str": self.duration_range,
                    "lower":     round(self.duration_lower, 1),
                    "upper":     round(self.duration_upper, 1),
                    "outlook":   self.search_outlook,
                    "unit":      "weeks",
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
        Defaults to `models/alumni_regression_bundle.pkl` next to this file.
        Pass an explicit path if your project layout differs.

    Raises
    ------
    FileNotFoundError
        If the .pkl bundle cannot be found at the resolved path.
    """

    # Output clipping bounds — must match train_models.py
    _SALARY_MIN = 16_000.0
    _SALARY_MAX = 65_000.0
    _DURATION_MIN = 4.0
    _DURATION_MAX = 32.0

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
        self._input_ranges = bundle.get("input_ranges", {})
        self._model_notes = bundle.get("model_notes", {})

        # RMSE used for ±1-RMSE salary confidence interval
        self._salary_rmse = self._metrics.get("salary", {}).get("rmse", 3053.0)

    # ── Public methods ────────────────────────────────────────────────────────

    def predict(
        self,
        cgpa: float,
        internships: int,
        soft_skills_avg: float,
        hard_skills_avg: float,
        avg_program_skill: float,
    ) -> PredictionResult:
        """
        Predict starting salary and job search duration for one alumnus.

        Parameters
        ----------
        cgpa : float
            GPA on a 1.0–3.75 scale. 1.0 = best, 3.75 = lowest passing.

        internships : int
            Number of internships completed. Minimum 1 (all students have
            completed at least one OJT). Maximum 5.
            The salary premium for a first internship is modest since it is
            universal; each additional internship adds a meaningful but
            diminishing increment.

        soft_skills_avg : float
            Average score across soft skill assessments (0–100 scale).
            Training data clusters between 75–100 (mean ~85). Values below 60
            are outside the training distribution.

        hard_skills_avg : float
            Average score across hard skill assessments (0–100 scale).
            Same distribution note as soft_skills_avg.

        avg_program_skill : float
            Average score across program-specific skill assessments (0–100 scale).
            Same distribution note as soft_skills_avg.

        Returns
        -------
        PredictionResult
            Structured result with salary, duration, confidence intervals,
            and human-readable band/outlook labels.

        Raises
        ------
        ValueError
            If any parameter is outside its valid range.
        """
        self._validate(cgpa, internships, soft_skills_avg,
                       hard_skills_avg, avg_program_skill)

        X_raw = np.array([[cgpa, internships, soft_skills_avg,
                           hard_skills_avg, avg_program_skill]])
        X_scaled = self._scaler.transform(X_raw)

        raw_salary = float(self._salary_model.predict(X_scaled)[0])
        raw_duration = float(self._duration_model.predict(X_scaled)[0])

        # Clamp to physically meaningful bounds matching training data
        salary = int(
            round(np.clip(raw_salary,   self._SALARY_MIN,   self._SALARY_MAX),   -2))
        duration = round(
            float(np.clip(raw_duration, self._DURATION_MIN, self._DURATION_MAX)), 1)

        # ±4-week range communicates the duration model's R²=0.22 uncertainty.
        # Display this range in the UI — do not show duration as a point estimate.
        dur_lo = max(self._DURATION_MIN, round(duration - 4.0, 1))
        dur_hi = min(self._DURATION_MAX, round(duration + 4.0, 1))
        duration_range = f"{dur_lo:.0f}–{dur_hi:.0f} weeks"

        return PredictionResult(
            cgpa=cgpa,
            internships=internships,
            soft_skills_avg=soft_skills_avg,
            hard_skills_avg=hard_skills_avg,
            avg_program_skill=avg_program_skill,
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

        Each record must be a dict with keys:
            cgpa, internships, soft_skills_avg, hard_skills_avg, avg_program_skill

        Returns a list of to_dict() results in the same order.
        """
        return [self.predict(**r).to_dict() for r in records]

    def model_info(self) -> dict:
        """
        Return model metadata, training performance metrics, and input ranges.
        Useful for exposing a /model-info endpoint or debugging.
        """
        return {
            "features":     self._features,
            "input_ranges": self._input_ranges,
            "cgpa_scale":   "1.0 (best) → 3.75 (lowest passing). Values >= 4.0 are rejected.",
            "skill_note":   self._model_notes.get("skill_note", ""),
            "models": {
                "salary": {
                    "type":   "LinearRegression",
                    "target": "starting_salary (PHP/month)",
                    **self._metrics.get("salary", {}),
                },
                "duration": {
                    "type":    "LinearRegression",
                    "target":  "job_search_duration_weeks",
                    "warning": self._model_notes.get("duration", ""),
                    **self._metrics.get("duration", {}),
                },
            },
        }

    # ── Internal helpers (not part of the public API) ─────────────────────────

    @staticmethod
    def _validate(
        cgpa: float,
        internships: int,
        soft_skills_avg: float,
        hard_skills_avg: float,
        avg_program_skill: float,
    ) -> None:
        if not (1.0 <= cgpa <= 3.75):
            raise ValueError(
                f"cgpa must be 1.0–3.75 (received {cgpa}). "
                "Values >= 4.0 indicate academic failure and are not accepted."
            )
        if not isinstance(internships, int) or not (1 <= internships <= 5):
            raise ValueError(
                f"internships must be a whole number from 1 to 5 (received {internships}). "
                "All students have completed at least one OJT (minimum = 1)."
            )
        if not (0.0 <= soft_skills_avg <= 100.0):
            raise ValueError(
                f"soft_skills_avg must be 0–100 (received {soft_skills_avg})."
            )
        if not (0.0 <= hard_skills_avg <= 100.0):
            raise ValueError(
                f"hard_skills_avg must be 0–100 (received {hard_skills_avg})."
            )
        if not (0.0 <= avg_program_skill <= 100.0):
            raise ValueError(
                f"avg_program_skill must be 0–100 (received {avg_program_skill})."
            )

    @staticmethod
    def _salary_band(salary: float) -> str:
        if salary < 25_000:
            return "Low"
        if salary < 40_000:
            return "Mid"
        return "High"

    @staticmethod
    def _search_outlook(weeks: float) -> str:
        if weeks <= 8:
            return "Short"
        if weeks <= 16:
            return "Moderate"
        return "Long"
