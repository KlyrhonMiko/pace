import pickle
import pandas as pd
from pathlib import Path


class EmployabilityPredictor:
    """
    Dual-model employability prediction system.

    Loads two Random Forest models:
      - Model 1 (Realistic Assessment): includes CGPA for overall prediction
      - Model 2 (Improvement Roadmap): excludes CGPA to surface actionable skill gaps

    Usage:
        predictor = EmployabilityPredictor()
        result = predictor.predict(student_data)

    Or as a context manager (recommended for scripts/jobs):
        with EmployabilityPredictor() as predictor:
            result = predictor.predict(student_data)
    """

    # Default path to pickles relative to this file
    _DEFAULT_PICKLE_DIR = Path(__file__).parent / "random_pickles"

    def __init__(self, pickle_dir: str | Path | None = None):
        """
        Initialize and load both models.

        Args:
            pickle_dir: Path to the folder containing the 4 .pkl files.
                        Defaults to a 'random_pickles/' folder next to this file.
        """
        self._dir = Path(
            pickle_dir) if pickle_dir else self._DEFAULT_PICKLE_DIR
        self._model1 = None
        self._model2 = None
        self._info1 = None
        self._info2 = None
        self._load_models()

    # ------------------------------------------------------------------
    # Context manager support
    # ------------------------------------------------------------------

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.unload()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict(self, student_data: dict) -> dict:
        """
        Run both models on a single student's data.

        Args:
            student_data: Dictionary of student features. All fields are
                          optional except where noted. Unknown keys are ignored.

                          Common fields (all programs):
                            CGPA                    (float)  e.g. 1.75
                            Average Prof Grade      (float)  e.g. 85.0
                            Average Elec Grade      (float)  e.g. 88.0
                            OJT Grade               (float)  e.g. 90.0
                            Leadership POS          (str)    "Yes" / "No"
                            Act Member POS          (str)    "Yes" / "No"
                            Soft Skills Ave         (float)  e.g. 80.0
                            Hard Skills Ave         (float)  e.g. 82.0
                            Degree                  (str)    e.g. "BSIT"
                            Year Graduated          (int)    e.g. 2024

                          Program-specific fields (supply only relevant ones):
                            Python Programming Skills, Java Programming Skills,
                            Database Management Skills, Web Development Skills,
                            Financial Accounting Skills, Marketing Skills,
                            Teaching Skills, Classroom Management Skills, etc.

        Returns:
            {
                "realistic_assessment": {
                    "prediction":    "Employable" | "Not Employable",
                    "probability":   float  (0–100, likelihood of being employable),
                    "confidence":    float  (0–100, model confidence in its call)
                },
                "improvement_roadmap": {
                    "prediction":    "Employable" | "Not Employable",
                    "probability":   float,
                    "confidence":    float
                },
                "cgpa": float | "N/A",
                "top_factors": list[str],          # top 5 controllable features
                "improvement_suggestions": [       # skills below 80 in top 5
                    {
                        "feature":    str,
                        "current":    float,
                        "importance": float  (0–1)
                    },
                    ...
                ]
            }
        """
        self._require_loaded()

        X1 = self._preprocess(student_data, self._info1)
        X2 = self._preprocess(student_data, self._info2)

        prob1 = self._model1.predict_proba(X1)[0]
        pred1 = self._model1.predict(X1)[0]

        prob2 = self._model2.predict_proba(X2)[0]
        pred2 = self._model2.predict(X2)[0]

        top_factors, suggestions = self._improvement_insights(X2)

        return {
            "realistic_assessment": {
                "prediction": "Employable" if pred1 == 1 else "Not Employable",
                "probability": round(float(prob1[1]) * 100, 2),
                "confidence":  round(float(max(prob1)) * 100, 2),
            },
            "improvement_roadmap": {
                "prediction": "Employable" if pred2 == 1 else "Not Employable",
                "probability": round(float(prob2[1]) * 100, 2),
                "confidence":  round(float(max(prob2)) * 100, 2),
            },
            "cgpa": student_data.get("CGPA", "N/A"),
            "top_factors": top_factors,
            "improvement_suggestions": suggestions,
        }

    def unload(self):
        """
        Release the models from memory.
        Useful for long-running processes that only need predictions occasionally.
        """
        self._model1 = None
        self._model2 = None
        self._info1 = None
        self._info2 = None

    def reload(self):
        """Re-load models from disk (e.g. after an unload or a model update)."""
        self._load_models()

    @property
    def is_loaded(self) -> bool:
        """True if both models are currently in memory."""
        return all(x is not None for x in (self._model1, self._model2,
                                           self._info1,  self._info2))

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_models(self):
        """Load all four pickle files from disk."""
        files = {
            "_model1": "model1_realistic.pkl",
            "_info1":  "model1_info.pkl",
            "_model2": "model2_improvement.pkl",
            "_info2":  "model2_info.pkl",
        }
        for attr, filename in files.items():
            path = self._dir / filename
            if not path.exists():
                raise FileNotFoundError(
                    f"Required file not found: {path}\n"
                    f"Make sure all 4 .pkl files are in: {self._dir}"
                )
            with open(path, "rb") as f:
                setattr(self, attr, pickle.load(f))

    def _require_loaded(self):
        if not self.is_loaded:
            raise RuntimeError(
                "Models are not loaded. "
                "Call reload() or create a new EmployabilityPredictor instance."
            )

    @staticmethod
    def _preprocess(student_data: dict, feature_info: dict) -> pd.DataFrame:
        """Transform raw student dict into a model-ready DataFrame."""
        df = pd.DataFrame([student_data])

        # Drop columns not used during training
        cols_to_drop = ["Student Number", "Age", "Gender"]
        if not feature_info["includes_cgpa"]:
            cols_to_drop.append("CGPA")

        df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

        # Fill missing program-specific skills with 0
        for col in feature_info["program_specific"]:
            if col in df.columns:
                df[col] = df[col].fillna(0)

        # Binary-encode Yes/No fields
        for col in ("Leadership POS", "Act Member POS"):
            if col in df.columns:
                df[col] = df[col].map({"Yes": 1, "No": 0})

        # One-hot encode Degree
        if "Degree" in df.columns:
            df = pd.get_dummies(df, columns=["Degree"], prefix="Program")

        # Add any columns the model expects that are absent (e.g. unseen programs)
        for col in feature_info["feature_columns"]:
            if col not in df.columns:
                df[col] = 0

        # Align column order to match training
        return df[feature_info["feature_columns"]]

    def _improvement_insights(self, X2: pd.DataFrame) -> tuple[list, list]:
        """
        Return the top 5 controllable features and a list of skill gaps.

        A skill gap is any top-5 feature whose name contains 'Skills'
        and whose current value is below 80.
        """
        importance_df = (
            pd.DataFrame({
                "feature":    self._info2["feature_columns"],
                "importance": self._model2.feature_importances_,
            })
            .sort_values("importance", ascending=False)
        )

        top_features = importance_df.head(10)["feature"].tolist()
        top_factors = top_features[:5]

        suggestions = []
        for feature in top_factors:
            if feature not in X2.columns:
                continue
            current_value = float(X2[feature].values[0])
            if "Skills" in feature and current_value < 80:
                suggestions.append({
                    "feature":    feature,
                    "current":    round(current_value, 2),
                    "importance": round(
                        float(importance_df.loc[
                            importance_df["feature"] == feature, "importance"
                        ].values[0]),
                        4
                    ),
                })

        return top_factors, suggestions
