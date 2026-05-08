import joblib
from pathlib import Path
import pandas as pd

def split_skills(text):
    return [s.strip() for s in text.split(',') if s.strip()]

class CareerTrackPredictor:
    """
    Career Track prediction system.
    
    Loads a Random Forest pipeline that expects:
    - skills: string of comma-separated skills
    - internship_duration: numeric months
    - gwa: numeric grade
    
    Usage:
        predictor = CareerTrackPredictor()
        result = predictor.predict({"skills": "React, FastAPI", "internship_duration": 3, "gwa": 1.5})
    """
    
    _DEFAULT_PICKLE_DIR = Path(__file__).parent / "random_pickles"
    
    def __init__(self, pickle_dir: str | Path | None = None):
        self._dir = Path(pickle_dir) if pickle_dir else self._DEFAULT_PICKLE_DIR
        self._model = None
        self._load_model()
        
    def _load_model(self):
        model_path = self._dir / "career_track_pipeline.pkl"
        if not model_path.exists():
            raise FileNotFoundError(
                f"Required model file not found: {model_path}\n"
                f"Please run the train_career_track.py script first."
            )
        self._model = joblib.load(model_path)
        
    @property
    def is_loaded(self) -> bool:
        return self._model is not None
        
    def __enter__(self):
        return self

    def __exit__(self, *_):
        self._model = None
        
    def predict(self, student_data: dict) -> dict:
        """
        Run the model on single student data.
        
        Args:
            student_data: Dictionary of features
                "skills" (str): e.g. "React, Node.js"
                "internship_duration" (int/float): e.g. 6
                "gwa" (float): e.g. 1.75
                
        Returns:
            dict with:
                prediction: predicted class
                probability: top probability percentage
                all_probabilities: dict mapping all classes to probabilities
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded.")
            
        df = pd.DataFrame([student_data])
        
        # Enforce columns in case they are missing
        for col, default in [("skills", ""), ("internship_duration", 0), ("gwa", 2.0)]:
            if col not in df.columns:
                df[col] = default
                
        # Predict
        probs = self._model.predict_proba(df)[0]
        pred_class = self._model.predict(df)[0]
        classes = self._model.classes_
        
        all_probs = {
            cls: round(float(prob) * 100, 2)
            for cls, prob in zip(classes, probs)
        }
        
        top_prob = round(float(max(probs)) * 100, 2)
        
        return {
            "prediction": pred_class,
            "probability": top_prob,
            "all_probabilities": all_probs,
            "input_data": student_data
        }
