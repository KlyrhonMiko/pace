# Employability Predictor — Developer Documentation

A dual-model Random Forest system that predicts student employability and surfaces actionable skill gaps. Built for use as a Python class inside a Flask or FastAPI backend.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Quick Start](#quick-start)
- [Input Format](#input-format)
- [Output Format](#output-format)
- [Usage Patterns](#usage-patterns)
- [Interpreting Results](#interpreting-results)
- [FastAPI Integration](#fastapi-integration)
- [Flask Integration](#flask-integration)
- [Error Handling](#error-handling)
- [Model Details](#model-details)
- [Disclaimer](#disclaimer)

---

## Overview

The predictor runs two models simultaneously for every student and returns both results together.

| Model                              | Purpose                                            | Includes CGPA | Accuracy |
| ---------------------------------- | -------------------------------------------------- | ------------- | -------- |
| **Model 1** — Realistic Assessment | Shows the student's current employability standing | ✅ Yes        | ~100%    |
| **Model 2** — Improvement Roadmap  | Surfaces skills the student can actually improve   | ❌ No         | ~59%     |

Running both gives students a complete picture: where they stand today, and what they can do about it.

---

## How It Works

```
Student submits data
        │
        ▼
┌───────────────────────────────────────────────┐
│            EmployabilityPredictor             │
│                                               │
│  Model 1 (with CGPA)  →  Realistic score      │
│  Model 2 (no CGPA)    →  Skills-based score   │
│                        +  Improvement tips    │
└───────────────────────────────────────────────┘
        │
        ▼
  Single result dict returned to caller
```

**Why two models?**

CGPA alone accounts for ~62% of Model 1's decision weight, making it an honest but non-actionable predictor — students can't change past grades. Model 2 strips CGPA out entirely and focuses on factors the student controls: skills, OJT performance, grades, and leadership. Showing both lets the frontend tell a complete story.

---

## Project Structure

```
backend/
└── services/
    └── machines/
        ├── employability_predictor.py   ← The class (this file)
        └── random_pickles/
            ├── model1_realistic.pkl     ← Trained RF model (with CGPA)
            ├── model1_info.pkl          ← Feature metadata for Model 1
            ├── model2_improvement.pkl   ← Trained RF model (no CGPA)
            └── model2_info.pkl          ← Feature metadata for Model 2
```

> **All four `.pkl` files are required.** The class will raise a clear `FileNotFoundError` if any are missing.

---

## Dependencies

```
scikit-learn
pandas
```

---

## Quick Start

```python
from backend.services.machines.employability_predictor import EmployabilityPredictor

predictor = EmployabilityPredictor()

student = {
    "CGPA": 2.5,
    "Average Prof Grade": 85.0,
    "Average Elec Grade": 88.0,
    "OJT Grade": 90.0,
    "Leadership POS": "Yes",
    "Act Member POS": "No",
    "Soft Skills Ave": 80.0,
    "Hard Skills Ave": 82.0,
    "Degree": "BSIT",
    "Year Graduated": 2024,
    "Python Programming Skills": 65.0,
    "Database Management Skills": 90.0,
}

result = predictor.predict(student)
print(result)
```

---

## Input Format

Pass a plain Python `dict`. All keys are **case-sensitive** and must match exactly.

### Required Fields — All Students

```json
{
  "CGPA": 2.5,
  "Average Prof Grade": 85.0,
  "Average Elec Grade": 88.0,
  "OJT Grade": 90.0,
  "Leadership POS": "Yes",
  "Act Member POS": "No",
  "Soft Skills Ave": 80.0,
  "Hard Skills Ave": 82.0,
  "Degree": "BSIT",
  "Year Graduated": 2024
}
```

| Field                | Type    | Values / Range                                |
| -------------------- | ------- | --------------------------------------------- |
| `CGPA`               | `float` | 1.0 (best) → 5.0 (worst). **Inverted scale.** |
| `Average Prof Grade` | `float` | 0 – 100                                       |
| `Average Elec Grade` | `float` | 0 – 100                                       |
| `OJT Grade`          | `float` | 0 – 100                                       |
| `Leadership POS`     | `str`   | `"Yes"` or `"No"`                             |
| `Act Member POS`     | `str`   | `"Yes"` or `"No"`                             |
| `Soft Skills Ave`    | `float` | 0 – 100                                       |
| `Hard Skills Ave`    | `float` | 0 – 100                                       |
| `Degree`             | `str`   | See accepted values below                     |
| `Year Graduated`     | `int`   | e.g. `2024`                                   |

**Accepted `Degree` values:**

```
"BSIT"  "BSCS"  "BSA"  "BSBA-Entrepreneurship"  "BSBA-Marketing"  "BSEd-Filipino"  "BSEd-English"
```

> ⚠️ **CGPA scale note:** This system uses an inverted grading scale where `1.0` is the highest grade and values above `2.5` indicate below-average academic performance. Do not convert or normalize this value before passing it in.

---

### Program-Specific Fields — Optional

Only supply fields relevant to the student's program. Any field not provided defaults to `0` (not applicable), which is the correct behaviour for cross-program compatibility.

```json
{
  "BSIT / BSCS": {
    "Python Programming Skills": 85.0,
    "Java Programming Skills": 80.0,
    "Database Management Skills": 90.0,
    "Web Development Skills": 75.0,
    "Networking Skills": 70.0,
    "Cloud Computing Skills": 65.0,
    "Software Engineering Skills": 80.0,
    "Data Structures & Algorithms": 88.0,
    "Machine Learning Skills": 72.0,
    "System Design Skills": 78.0,
    "Cybersecurity Skills": 68.0,
    "Artificial Intelligence Skills": 74.0,
    "Programming Logic Skills": 85.0
  },

  "BSA / BSBA": {
    "Financial Accounting Skills": 85.0,
    "Budgeting & Analysis Skills": 80.0,
    "Marketing Skills": 88.0,
    "Auditing Skills": 82.0,
    "Financial Management Skills": 79.0,
    "Taxation Skills": 77.0,
    "Strategic Planning Skills": 83.0,
    "Risk Management Skills": 75.0,
    "Innovation & Business Planning Skills": 80.0,
    "Consumer Behavior Analysis": 72.0,
    "Sales Management Skills": 76.0,
    "Leadership & Decision-Making Skills": 85.0
  },

  "BSEd": {
    "Teaching Skills": 90.0,
    "Classroom Management Skills": 85.0,
    "Curriculum Development Skills": 82.0,
    "Educational Technology Skills": 78.0,
    "English Communication & Writing Skills": 88.0,
    "Filipino Communication & Writing Skills": 86.0
  }
}
```

---

## Output Format

`predict()` always returns a single `dict`:

```python
{
    "realistic_assessment": {
        "prediction":  "Employable",   # or "Not Employable"
        "probability": 72.50,          # float, 0–100. Likelihood of being employable.
        "confidence":  72.50           # float, 0–100. How certain the model is.
    },
    "improvement_roadmap": {
        "prediction":  "Employable",
        "probability": 54.30,
        "confidence":  54.30
    },
    "cgpa": 2.5,                       # Echoed back from input, or "N/A" if not provided.
    "top_factors": [                   # Top 5 controllable features by importance (Model 2).
        "Average Prof Grade",
        "Average Elec Grade",
        "OJT Grade",
        "Hard Skills Ave",
        "Soft Skills Ave"
    ],
    "improvement_suggestions": [       # Skill fields in top_factors with a score below 80.
        {
            "feature":    "Hard Skills Ave",
            "current":    65.0,
            "importance": 0.0676       # Model 2 feature importance weight (0–1).
        }
    ]
}
```

> `improvement_suggestions` is only populated for features whose name contains `"Skills"` and whose current value is below `80`. It can be an empty list if the student scores well on all top factors.

---

## Usage Patterns

### Pattern 1 — Long-running server (recommended for APIs)

Instantiate once at startup. The models stay in memory and are reused for every request.

```python
# startup.py or app.py
from backend.services.machines.employability_predictor import EmployabilityPredictor

predictor = EmployabilityPredictor()   # loads all 4 pkl files once
```

---

### Pattern 2 — Short-lived script or batch job

Use the context manager so models are automatically unloaded when done.

```python
from backend.services.machines.employability_predictor import EmployabilityPredictor

with EmployabilityPredictor() as predictor:
    for student in students:
        result = predictor.predict(student)
        process(result)
# models are released from memory here automatically
```

---

### Pattern 3 — Custom pickle directory

If your `.pkl` files live somewhere other than the default `random_pickles/` folder next to the class file:

```python
predictor = EmployabilityPredictor(pickle_dir="/absolute/path/to/pickles")
```

---

### Pattern 4 — Manual memory control

```python
predictor = EmployabilityPredictor()

result = predictor.predict(student_data)

predictor.unload()       # free memory when idle
# ... later ...
predictor.reload()       # reload models before next use
print(predictor.is_loaded)   # True / False
```

---

## Interpreting Results

### Reading the gap between models

The difference between `realistic_assessment.probability` and `improvement_roadmap.probability` tells you what role CGPA is playing.

| Scenario                       | What it means                                                       | Suggested message to student                                                      |
| ------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Model 1 >> Model 2 (gap > 25%) | CGPA is inflating the score — skills are weaker than grades suggest | "Your grades are strong, but build your practical skills to match."               |
| Model 2 >> Model 1 (gap > 25%) | Skills are stronger than the CGPA-weighted outlook suggests         | "Your skills can compensate for your CGPA — build your portfolio and experience." |
| Gap < 15%                      | Balanced profile — CGPA and skills are aligned                      | "Well-rounded profile. Keep developing all areas."                                |

### Probability vs. Confidence

Both values are identical in this implementation because the model returns a single probability for each class. `confidence` reflects how decisive the prediction is: a value close to 50 means the model is uncertain; a value close to 100 means it's very sure.

---

## FastAPI Integration

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.services.machines.employability_predictor import EmployabilityPredictor

app = FastAPI()

# Load once at startup — shared across all requests
predictor = EmployabilityPredictor()


class StudentData(BaseModel):
    CGPA: float
    average_prof_grade: float
    average_elec_grade: float
    ojt_grade: float
    leadership_pos: str
    act_member_pos: str
    soft_skills_ave: float
    hard_skills_ave: float
    degree: str
    year_graduated: int
    # Add optional program-specific fields here with defaults
    python_programming_skills: float = 0.0
    java_programming_skills: float = 0.0
    # ... etc.


@app.post("/predict")
def predict(student: StudentData):
    # Map Pydantic model back to the dict keys the predictor expects
    student_dict = {
        "CGPA": student.CGPA,
        "Average Prof Grade": student.average_prof_grade,
        "Average Elec Grade": student.average_elec_grade,
        "OJT Grade": student.ojt_grade,
        "Leadership POS": student.leadership_pos,
        "Act Member POS": student.act_member_pos,
        "Soft Skills Ave": student.soft_skills_ave,
        "Hard Skills Ave": student.hard_skills_ave,
        "Degree": student.degree,
        "Year Graduated": student.year_graduated,
        "Python Programming Skills": student.python_programming_skills,
        "Java Programming Skills": student.java_programming_skills,
    }

    try:
        result = predictor.predict(student_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Error Handling

| Exception           | When it's raised                                      | How to handle                                                           |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `FileNotFoundError` | A `.pkl` file is missing from `random_pickles/`       | Verify all 4 files exist at the expected path                           |
| `RuntimeError`      | `predict()` called after `unload()`                   | Call `predictor.reload()` first, or check `predictor.is_loaded`         |
| `KeyError`          | `feature_columns` mismatch between training and input | Ensure preprocessing matches training exactly — don't rename input keys |

---

## Model Details

| Property            | Value                                                 |
| ------------------- | ----------------------------------------------------- |
| Algorithm           | Random Forest Classifier                              |
| Training data       | 500 labeled students across 7 degree programs         |
| Target variable     | `Employability` — `"Employable"` / `"Not Employable"` |
| Class balance       | 69% Employable, 31% Not Employable                    |
| Class weight        | `"balanced"` (handles imbalance automatically)        |
| `n_estimators`      | 100                                                   |
| `max_depth`         | 8                                                     |
| `min_samples_split` | 20                                                    |
| `min_samples_leaf`  | 10                                                    |
| Train/test split    | 80% / 20%, stratified                                 |

### Feature importance — top 5 (Model 1, with CGPA)

| Rank | Feature            | Importance |
| ---- | ------------------ | ---------- |
| 1    | CGPA               | 61.6%      |
| 2    | Average Prof Grade | 4.0%       |
| 3    | Average Elec Grade | 3.4%       |
| 4    | Soft Skills Ave    | 2.8%       |
| 5    | Hard Skills Ave    | 2.7%       |

### Feature importance — top 5 (Model 2, no CGPA)

| Rank | Feature            | Importance |
| ---- | ------------------ | ---------- |
| 1    | Average Prof Grade | 12.0%      |
| 2    | Average Elec Grade | 11.5%      |
| 3    | OJT Grade          | 8.0%       |
| 4    | Hard Skills Ave    | 6.8%       |
| 5    | Soft Skills Ave    | 6.3%       |

---

## Disclaimer

> This tool generates predictions based on historical student data. Results are probabilistic estimates, not guarantees. Actual employability depends on many factors outside this model's scope, including job market conditions, interview performance, networking, and individual circumstances. Use these scores as guidance for improvement — not as a definitive career verdict.

---

_Last updated: 2025 — dataset: 500 students, 7 programs, scikit-learn RandomForestClassifier_
