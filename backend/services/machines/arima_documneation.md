# `ArimaForecast` — Documentation

> Backend ARIMA(1,1,1) alumni employment forecaster.
> No external ML libraries required — only `numpy` and `scipy`.

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Class Reference](#class-reference)
   - [Constructor Parameters](#constructor-parameters)
   - [Public Method: `forecast()`](#public-method-forecast)
   - [Return Schema](#return-schema)
   - [Private Methods](#private-methods)
6. [Usage Examples](#usage-examples)
7. [Transitioning from Synthetic to Real Data](#transitioning-from-synthetic-to-real-data)
8. [Model Internals](#model-internals)
9. [Diagnostics Guide](#diagnostics-guide)
10. [Limitations & Notes](#limitations--notes)

---

## Overview

`ArimaForecast` fits an **ARIMA(1,1,1)** model to a year-by-year time series of employed alumni and returns a multi-year employment forecast as plain Python data structures — suitable for direct consumption by a backend API or service layer.

When no real historical data is available, the class generates a **synthetic baseline** series that mirrors a flat/stable employment trend, allowing the model to be developed, tested, and deployed before real records are collected.

---

## Requirements

| Package | Version | Purpose                         |
| ------- | ------- | ------------------------------- |
| `numpy` | ≥ 1.24  | Array operations, RNG           |
| `scipy` | ≥ 1.10  | Optimisation, statistical tests |

No `statsmodels`, `pandas`, or plotting libraries are required.

---

## Installation

```bash
pip install numpy scipy
```

Place `arima_forecast.py` anywhere on your Python path and import directly.

---

## Quick Start

```python
from arima_forecast import ArimaForecast

# 1. Default usage — synthetic data, 3-year forecast
model = ArimaForecast()
result = model.forecast()

# 2. Plug in real data when available
model = ArimaForecast(real_data=[430, 445, 460, 452, 470, 483])
result = model.forecast()

# 3. Customise forecast horizon and baseline
model = ArimaForecast(base_employment=1200, forecast_steps=5)
result = model.forecast()
```

---

## Class Reference

### Constructor Parameters

```python
ArimaForecast(
    real_data         = None,
    base_employment   = 500,
    n_synthetic_years = 20,
    ar_phi            = 0.60,
    ma_theta          = 0.30,
    sigma             = 18.0,
    seed              = 42,
    forecast_steps    = 3,
    start_year        = 2004,
    ci_level          = 0.95,
)
```

| Parameter           | Type              | Default | Description                                                                                                                    |
| ------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `real_data`         | `list[int]\|None` | `None`  | Year-by-year employed alumni counts. When `None`, synthetic data is generated.                                                 |
| `base_employment`   | `int`             | `500`   | Approximate employment level used as the starting point for synthetic data. Ignored when `real_data` is provided.              |
| `n_synthetic_years` | `int`             | `20`    | Number of years of synthetic history to generate.                                                                              |
| `ar_phi`            | `float`           | `0.60`  | AR(1) coefficient — controls year-to-year persistence. Must satisfy `\|φ\| < 1`. Also used as the optimisation starting point. |
| `ma_theta`          | `float`           | `0.30`  | MA(1) coefficient — controls how prior shocks decay. Must satisfy `\|θ\| < 1`. Also used as the optimisation starting point.   |
| `sigma`             | `float`           | `18.0`  | Noise standard deviation for synthetic data generation. Higher values produce more volatile series.                            |
| `seed`              | `int`             | `42`    | Random seed for reproducibility of synthetic data.                                                                             |
| `forecast_steps`    | `int`             | `3`     | Number of years ahead to forecast.                                                                                             |
| `start_year`        | `int`             | `2004`  | Calendar year assigned to the first observation in the synthetic series. Adjust to match your institution's first record year. |
| `ci_level`          | `float`           | `0.95`  | Confidence interval level. `0.95` → 95% CI.                                                                                    |

---

### Public Method: `forecast()`

```python
result = model.forecast() -> dict
```

Executes the full pipeline in sequence:

1. Prepares or generates the time series
2. Fits ARIMA(1,1,1) coefficients via Conditional Sum of Squares
3. Computes residuals and estimates σ
4. Runs the Ljung-Box white-noise test on residuals
5. Projects h-step-ahead forecasts with confidence intervals
6. Returns all results as a plain `dict`

No side effects — safe to call multiple times.

---

### Return Schema

```json
{
  "data_source": "synthetic",
  "observations": 20,
  "model": {
    "phi": 0.302863,
    "theta": 0.598769,
    "sigma": 15.944255
  },
  "diagnostics": {
    "ljung_box_q": 0.7295,
    "ljung_box_p": 0.9813,
    "residuals_ok": true
  },
  "forecasts": [
    {
      "year": 2024,
      "point": 444,
      "lower_ci": 413,
      "upper_ci": 475,
      "yoy_change": 5
    },
    {
      "year": 2025,
      "point": 445,
      "lower_ci": 401,
      "upper_ci": 489,
      "yoy_change": 1
    },
    {
      "year": 2026,
      "point": 445,
      "lower_ci": 391,
      "upper_ci": 499,
      "yoy_change": 0
    }
  ]
}
```

#### Top-level fields

| Field          | Type  | Description                                 |
| -------------- | ----- | ------------------------------------------- |
| `data_source`  | `str` | `"synthetic"` or `"real"`                   |
| `observations` | `int` | Number of data points used to fit the model |

#### `model`

| Field   | Type    | Description                           |
| ------- | ------- | ------------------------------------- |
| `phi`   | `float` | Fitted AR(1) coefficient              |
| `theta` | `float` | Fitted MA(1) coefficient              |
| `sigma` | `float` | Estimated residual standard deviation |

#### `diagnostics`

| Field          | Type    | Description                                                |
| -------------- | ------- | ---------------------------------------------------------- |
| `ljung_box_q`  | `float` | Ljung-Box Q statistic (`nan` if series too short)          |
| `ljung_box_p`  | `float` | p-value for white-noise test (`nan` if series too short)   |
| `residuals_ok` | `bool`  | `true` if `p > 0.05` — residuals pass the white-noise test |

#### `forecasts` (per entry)

| Field        | Type  | Description                                           |
| ------------ | ----- | ----------------------------------------------------- |
| `year`       | `int` | Calendar year of the forecast                         |
| `point`      | `int` | Point forecast (expected employed alumni count)       |
| `lower_ci`   | `int` | Lower bound of the confidence interval                |
| `upper_ci`   | `int` | Upper bound of the confidence interval                |
| `yoy_change` | `int` | Change from the prior year (`point - previous_point`) |

---

### Private Methods

These methods are called internally by `forecast()` and are not intended to be called directly.

| Method                                    | Description                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `_prepare_series()`                       | Routes to real data or synthetic generation based on `real_data`                |
| `_generate_synthetic()`                   | Simulates an ARIMA(1,1,1) process centred on `base_employment`                  |
| `_fit(series)`                            | Estimates φ and θ via Conditional Sum of Squares using Nelder-Mead optimisation |
| `_residuals(series, phi, theta)`          | Computes in-sample residuals on the differenced series and estimates σ          |
| `_ljung_box(resid)`                       | Runs the Ljung-Box Q test; auto-reduces lag count for short series              |
| `_project(series, phi, theta, sigma_hat)` | Produces h-step-ahead forecasts with CI half-widths scaling as `z · σ · √h`     |

---

## Usage Examples

### Minimal — synthetic baseline

```python
from arima_forecast import ArimaForecast

result = ArimaForecast().forecast()
for f in result["forecasts"]:
    print(f["year"], f["point"])
# 2024  444
# 2025  445
# 2026  445
```

### With real alumni records

```python
from arima_forecast import ArimaForecast

# Each value = total alumni employed that year, oldest first
historical = [312, 328, 345, 360, 378, 391, 401, 420]

model  = ArimaForecast(real_data=historical, start_year=2016)
result = model.forecast()

print(result["data_source"])   # "real"
print(result["observations"])  # 8
print(result["forecasts"])
```

### Extended forecast horizon

```python
model  = ArimaForecast(forecast_steps=5, ci_level=0.90)
result = model.forecast()
# Returns 5 forecast years with 90% confidence intervals
```

### Higher-volatility environment

```python
# Increase sigma to simulate a less stable employment environment
model  = ArimaForecast(sigma=35.0, base_employment=800)
result = model.forecast()
```

### In a Flask/FastAPI route

```python
from arima_forecast import ArimaForecast

def get_employment_forecast(historical_data: list | None = None) -> dict:
    model = ArimaForecast(real_data=historical_data)
    return model.forecast()
```

---

## Transitioning from Synthetic to Real Data

The class is designed for a gradual data-collection lifecycle:

**Phase 1 — No data yet**

```python
model = ArimaForecast()   # real_data=None by default
```

The model runs on synthetic data. Results are illustrative but structurally correct.

**Phase 2 — Partial records available**

```python
model = ArimaForecast(real_data=[450, 463, 471])
```

Pass whatever years you have. The model fits on real data immediately. With fewer than ~8 observations, treat the Ljung-Box diagnostic with caution (`residuals_ok` may be unreliable).

**Phase 3 — Sufficient history**

```python
model = ArimaForecast(real_data=[430, 445, 460, 452, 470, 483, 491, 508, 522])
```

With 8+ observations, both coefficient estimation and diagnostics become meaningful. At this stage, consider tuning `ar_phi` and `ma_theta` initial values to match your data's ACF/PACF patterns.

> **No code changes are needed** between phases — only the `real_data` argument changes.

---

## Model Internals

### ARIMA(1,1,1) formulation

The model operates on the **first-differenced** series `dₜ = yₜ − yₜ₋₁`:

```
dₜ = φ·dₜ₋₁ + εₜ + θ·εₜ₋₁
```

where `εₜ ~ N(0, σ²)` is white noise.

Forecasts are then **integrated** (cumulative summed) back to the original scale.

### Coefficient estimation

Parameters are estimated by minimising the **Conditional Sum of Squares (CSS)**:

```
CSS(φ, θ) = Σ εₜ²
```

using the **Nelder-Mead** simplex algorithm via `scipy.optimize.minimize`. Stability constraints `|φ| < 1` and `|θ| < 1` are enforced. If optimisation fails to converge, the constructor's `ar_phi` and `ma_theta` defaults are used as fallback.

### Confidence intervals

CI half-width at horizon h is:

```
CI_h = z_{α/2} · σ̂ · √h
```

This reflects increasing uncertainty over longer horizons. For a 95% CI, `z = 1.96`.

---

## Diagnostics Guide

### Ljung-Box test

The Ljung-Box Q test checks whether model residuals are **white noise** (i.e., no remaining autocorrelation structure the model failed to capture).

| `ljung_box_p` | `residuals_ok` | Interpretation                                             |
| ------------- | -------------- | ---------------------------------------------------------- |
| > 0.05        | `true`         | Residuals are white noise — model fit is adequate          |
| ≤ 0.05        | `false`        | Residuals show autocorrelation — model may be misspecified |
| `nan`         | `false`        | Series too short to test (fewer than ~5 residuals)         |

When `residuals_ok` is `false` with real data, consider whether the employment series has a stronger trend or seasonal component that ARIMA(1,1,1) does not capture.

---

## Limitations & Notes

- **Short real data series** (< 8 years): Coefficient estimates will be noisy and the Ljung-Box test unreliable. Synthetic data or wider CI levels are recommended until more records are available.
- **Non-stationary trends**: ARIMA(1,1,1) assumes one round of differencing is sufficient to achieve stationarity. If alumni employment exhibits strong structural growth or decline, a higher `d` or a trend-aware model may be more appropriate.
- **No seasonality**: The model does not capture seasonal patterns. For annual data this is generally not an issue.
- **Integer rounding**: Point forecasts and CI bounds are rounded to integers, appropriate for headcount data.
- **Thread safety**: Each `ArimaForecast` instance holds its own RNG state. Instantiate a new object per request in concurrent environments.
