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
    result    = predictor.predict(soft_skills_ave=75.0, hard_skills_ave=80.0,
                                   cgpa=2.0, internships=1,
                                   program_skills_average=70.0)
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
_DEFAULT_BUNDLE = Path(__file__).parent / "random_pickles" / \
    "alumni_regression_bundle.pkl"


# ── Result container ──────────────────────────────────────────────────────────

@dataclass
class PredictionResult:
    """
    Structured output from a single AlumniPredictor.predict() call.

    Attributes (inputs)
    -------------------
    soft_skills_ave      : float — average soft skills score (0–100)
    hard_skills_ave      : float — average hard skills score (0–100)
    cgpa                 : float — CGPA used for this prediction
    internships          : int   — 0 or 1
    program_skills_average : float — average of program-specific skills (0–100)

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
    soft_skills_ave: float
    hard_skills_ave: float
    cgpa: float
    internships: int
    program_skills_average: float

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
                "soft_skills_ave": self.soft_skills_ave,
                "hard_skills_ave": self.hard_skills_ave,
                "cgpa": self.cgpa,
                "internships": self.internships,
                "program_skills_average": self.program_skills_average,
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
        soft_skills_ave: float = 0.0,
        hard_skills_ave: float = 0.0,
        cgpa: float = 2.0,
        internships: int = 0,
        program_skills_average: float = 0.0,
    ) -> PredictionResult:
        """
        Predict starting salary and job search duration for one alumnus.

        Parameters
        ----------
        soft_skills_ave : float, default 0.0
            Average soft skills score (0–100).

        hard_skills_ave : float, default 0.0
            Average hard skills score (0–100).

        cgpa : float, default 2.0
            GPA on a 1.0–3.75 scale. 1.0 = best, 3.75 = lowest passing.

        internships : int, default 0
            Whether the student completed at least one internship. 0 or 1.

        program_skills_average : float, default 0.0
            Average of all program-specific skill scores (0–100).
        """
        self._validate(soft_skills_ave, hard_skills_ave, cgpa,
                       internships, program_skills_average)

        X_raw = np.array(
            [[soft_skills_ave, hard_skills_ave, cgpa, internships, program_skills_average]])
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
            soft_skills_ave=soft_skills_ave,
            hard_skills_ave=hard_skills_ave,
            cgpa=cgpa,
            internships=internships,
            program_skills_average=program_skills_average,
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
            soft_skills_ave, hard_skills_ave, cgpa, internships, program_skills_average

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
    def _validate(soft_skills_ave, hard_skills_ave, cgpa, internships, program_skills_average):
        if not (0.0 <= soft_skills_ave <= 100.0):
            raise ValueError(
                f"soft_skills_ave must be 0–100 (received {soft_skills_ave})"
            )
        if not (0.0 <= hard_skills_ave <= 100.0):
            raise ValueError(
                f"hard_skills_ave must be 0–100 (received {hard_skills_ave})"
            )
        if not (1.0 <= cgpa <= 3.75):
            raise ValueError(
                f"cgpa must be 1.0–3.75 (received {cgpa}). "
                "Values >= 4.0 indicate academic failure and are not accepted."
            )
        if not isinstance(internships, int) or not (0 <= internships <= 5):
            raise ValueError(
                f"internships must be a whole number from 0 to 5 (received {internships})."
            )
        if not (0.0 <= program_skills_average <= 100.0):
            raise ValueError(
                f"program_skills_average must be 0–100 (received {program_skills_average})")

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
