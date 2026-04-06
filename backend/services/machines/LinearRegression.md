# Alumni Outcome Predictor — Linear Regression Module

Developer reference for `alumni_regression.py`, the self-contained prediction module your backend team imports to get alumni outcome predictions without touching any ML code.

---

## Overview

Two Linear Regression models are trained on alumni profile data to predict:

| Target                  | Unit        | Model R² |
| ----------------------- | ----------- | -------- |
| **Starting Salary**     | PHP / month | 0.908    |
| **Job Search Duration** | Weeks       | 0.857    |

Both models share the same five input features and a fitted `StandardScaler`. Everything is packaged into a single `.pkl` bundle that `AlumniPredictor` loads at startup.

---

## CGPA Scale

This system uses a **lower-is-better** CGPA convention:

| CGPA       | Meaning                                      |
| ---------- | -------------------------------------------- |
| 1.0        | Highest honour / top of class                |
| 1.75 – 2.5 | Good standing                                |
| 3.0 – 3.75 | Lowest passing grades                        |
| ≥ 4.0      | Academic failure — **rejected by the model** |

Any CGPA value outside `1.0–3.75` raises a `ValueError`.

---

## File Structure Required

Your backend project needs these two things from the ML team:

```
your_project/
├── alumni_regression.py              ← the module your team imports
└── random_pickles/
    └── alumni_regression_bundle.pkl  ← trained model bundle
```

The `models/` folder must be placed **next to** `alumni_regression.py`. If your layout differs, pass an explicit path when instantiating — see [Custom Bundle Path](#custom-bundle-path).

---

## Installation

```bash
pip install scikit-learn numpy
```

No other dependencies are required to use `alumni_regression.py`.

---

## Quick Start

```python
from alumni_regression import AlumniPredictor

# Load once at app startup
predictor = AlumniPredictor()

# Predict for one student
result = predictor.predict(
    cgpa=2.0,
    internships=1,
    projects=2,
    skills_count=7,
    extracurricular=0,
)

print(result.predicted_salary_php)         # → 48023.83
print(result.predicted_job_search_weeks)   # → 8.5
print(result.salary_band)                  # → "High"
print(result.search_outlook)               # → "Moderate"

# Serialise to dict/JSON for your API response
print(result.to_dict())
```

---

## Class: `AlumniPredictor`

### Constructor

```python
AlumniPredictor(bundle_path=None)
```

| Parameter     | Type            | Default | Description                                                                                 |
| ------------- | --------------- | ------- | ------------------------------------------------------------------------------------------- |
| `bundle_path` | `Path` or `str` | `None`  | Path to `.pkl` bundle. Defaults to `models/alumni_regression_bundle.pkl` next to this file. |

Raises `FileNotFoundError` if the bundle cannot be found.

**Instantiate once per process** — loading the model is the expensive step. Store it as a module-level variable or in your app's startup hook.

---

### `predict()`

```python
result = predictor.predict(
    cgpa,
    internships=0,
    projects=0,
    skills_count=5,
    extracurricular=0,
)
```

#### Parameters

| Parameter         | Type    | Default      | Valid Range | Description                                      |
| ----------------- | ------- | ------------ | ----------- | ------------------------------------------------ |
| `cgpa`            | `float` | **required** | 1.0 – 3.75  | Student's GPA. Lower = better.                   |
| `internships`     | `int`   | `0`          | 0 or 1      | Whether student completed an internship.         |
| `projects`        | `int`   | `0`          | 0 – 10      | Number of academic or personal projects.         |
| `skills_count`    | `int`   | `5`          | 1 – 15      | Total number of technical and soft skills.       |
| `extracurricular` | `int`   | `0`          | 0 or 1      | Whether student had extracurricular involvement. |

#### Returns: `PredictionResult`

See [PredictionResult](#class-predictionresult) below.

#### Raises

`ValueError` — if any parameter is outside its valid range.

---

### `predict_batch()`

```python
results = predictor.predict_batch(records)
```

| Parameter | Type         | Description                                                                |
| --------- | ------------ | -------------------------------------------------------------------------- |
| `records` | `list[dict]` | List of input dicts. Each must have a `cgpa` key; all others are optional. |

Returns a `list[dict]` — equivalent to calling `.predict(**r).to_dict()` for each record. If any record is invalid, a `ValueError` is raised and the entire batch is aborted.

```python
results = predictor.predict_batch([
    {"cgpa": 1.5, "internships": 1, "skills_count": 8},
    {"cgpa": 3.2, "internships": 0},
])
# results[0]["predictions"]["starting_salary"]["value"] → 52660.0
```

---

### `model_info()`

```python
info = predictor.model_info()
```

Returns a dict of model metadata and training metrics. Useful for exposing a `/info` or `/health` endpoint without hardcoding values.

```json
{
  "features": [
    "cgpa",
    "internships",
    "projects",
    "skills_count",
    "extracurricular"
  ],
  "cgpa_scale": "1.0 (best) → 3.75 (lowest passing). Values ≥ 4.0 are rejected.",
  "models": {
    "salary": {
      "type": "LinearRegression",
      "target": "starting_salary (PHP/month)",
      "r2": 0.9081,
      "mae": 2114.09,
      "rmse": 2772.18,
      "cv_r2_mean": 0.889,
      "cv_r2_std": 0.0147
    },
    "duration": {
      "type": "LinearRegression",
      "target": "job_search_duration_weeks",
      "r2": 0.8567,
      "mae": 1.65,
      "rmse": 2.11,
      "cv_r2_mean": 0.825,
      "cv_r2_std": 0.023
    }
  }
}
```

---

## Class: `PredictionResult`

Returned by `predict()`. All fields are directly accessible as attributes, or call `.to_dict()` to serialise.

### Attributes

| Attribute                    | Type    | Description                                           |
| ---------------------------- | ------- | ----------------------------------------------------- |
| `cgpa`                       | `float` | Input CGPA echoed back                                |
| `internships`                | `int`   | Input echoed back                                     |
| `projects`                   | `int`   | Input echoed back                                     |
| `skills_count`               | `int`   | Input echoed back                                     |
| `extracurricular`            | `int`   | Input echoed back                                     |
| `predicted_salary_php`       | `float` | Predicted starting salary in PHP/month                |
| `predicted_job_search_weeks` | `float` | Predicted job search length in weeks                  |
| `salary_lower`               | `float` | Lower bound of salary confidence interval (−1 RMSE)   |
| `salary_upper`               | `float` | Upper bound of salary confidence interval (+1 RMSE)   |
| `duration_lower`             | `float` | Lower bound of duration confidence interval (−1 RMSE) |
| `duration_upper`             | `float` | Upper bound of duration confidence interval (+1 RMSE) |
| `salary_band`                | `str`   | `"Low"` / `"Mid"` / `"High"`                          |
| `search_outlook`             | `str`   | `"Short"` / `"Moderate"` / `"Long"`                   |

### `salary_band` thresholds

| Band     | Salary Range              |
| -------- | ------------------------- |
| `"Low"`  | < ₱30,000 / month         |
| `"Mid"`  | ₱30,000 – ₱44,999 / month |
| `"High"` | ≥ ₱45,000 / month         |

### `search_outlook` thresholds

| Outlook      | Duration Range |
| ------------ | -------------- |
| `"Short"`    | ≤ 6 weeks      |
| `"Moderate"` | 7 – 14 weeks   |
| `"Long"`     | > 14 weeks     |

---

### `to_dict()`

Serialises the result to a plain Python dict. Safe to pass directly to `jsonify()`, `json.dumps()`, or a Pydantic response model.

```json
{
  "input": {
    "cgpa": 2.0,
    "internships": 1,
    "projects": 2,
    "skills_count": 7,
    "extracurricular": 0
  },
  "predictions": {
    "starting_salary": {
      "value": 48023.83,
      "lower": 45251.65,
      "upper": 50796.01,
      "band": "High",
      "unit": "PHP/month"
    },
    "job_search_duration": {
      "value": 8.5,
      "lower": 6.4,
      "upper": 10.6,
      "outlook": "Moderate",
      "unit": "weeks"
    }
  }
}
```

---

## Integration Examples

### FastAPI

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from alumni_regression import AlumniPredictor

app = FastAPI()
predictor = AlumniPredictor()  # load at startup

class AlumniInput(BaseModel):
    cgpa: float = Field(..., ge=1.0, le=3.75)
    internships: int = Field(0, ge=0, le=1)
    projects: int = Field(0, ge=0, le=10)
    skills_count: int = Field(5, ge=1, le=15)
    extracurricular: int = Field(0, ge=0, le=1)

@app.post("/predict")
def predict(data: AlumniInput):
    try:
        result = predictor.predict(**data.model_dump())
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

### Flask

```python
from flask import Flask, request, jsonify
from alumni_regression import AlumniPredictor

app = Flask(__name__)
predictor = AlumniPredictor()

@app.post("/predict")
def predict():
    try:
        result = predictor.predict(**request.get_json())
        return jsonify(result.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
```

### Django (views.py)

```python
import json
from django.http import JsonResponse
from django.views import View
from alumni_regression import AlumniPredictor

predictor = AlumniPredictor()  # module-level, loaded once

class PredictView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            result = predictor.predict(**data)
            return JsonResponse(result.to_dict())
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=422)
```

---

## Custom Bundle Path

If your project layout places the `.pkl` file somewhere other than `models/` next to `alumni_regression.py`:

```python
from pathlib import Path
from alumni_regression import AlumniPredictor

predictor = AlumniPredictor(
    bundle_path=Path("/absolute/path/to/alumni_regression_bundle.pkl")
)
```

---

## Error Handling

All validation errors raise a plain Python `ValueError` with a descriptive message. Catch it at your route layer and return an appropriate HTTP response.

```python
try:
    result = predictor.predict(cgpa=5.0)
except ValueError as e:
    print(e)
    # cgpa must be 1.0–3.75 (received 5.0).
    # Values ≥ 4.0 indicate academic failure and are not accepted.
```

---

## Model Performance Summary

Both models were evaluated on a held-out 20% test set and validated with 5-fold cross-validation.

| Metric             | Starting Salary | Job Search Duration |
| ------------------ | --------------- | ------------------- |
| R² (test)          | **0.908**       | **0.857**           |
| MAE                | ₱2,114 / month  | 1.65 weeks          |
| RMSE               | ₱2,772 / month  | 2.11 weeks          |
| CV R² (mean ± std) | 0.889 ± 0.015   | 0.825 ± 0.023       |

Confidence intervals on each prediction are ±1 RMSE, reflecting the model's typical error on unseen data.

---

## Retraining

If the team collects real alumni data, the models can be retrained without touching any backend code:

```bash
python retrain_models.py --data path/to/real_alumni.csv
```

The new `.pkl` bundle is saved to `models/`. Restart your backend process to load the updated models. The `alumni_regression.py` interface remains identical.
