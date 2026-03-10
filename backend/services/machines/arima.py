"""
arima_forecast.py
=================
Backend ARIMA(1,1,1) alumni employment forecaster.
No external ML libraries required — only numpy and scipy.

Usage
-----
    from arima_forecast import ArimaForecast

    # With synthetic data (default)
    model = ArimaForecast()
    result = model.forecast()

    # With real historical alumni data
    model = ArimaForecast(real_data=[312, 345, 378, 401, 420])
    result = model.forecast()

    # Override any default parameter
    model = ArimaForecast(base_employment=800, forecast_steps=5)
    result = model.forecast()

Return value of forecast()
--------------------------
    {
        "data_source": "synthetic" | "real",
        "observations": int,
        "model": {"phi": float, "theta": float, "sigma": float},
        "diagnostics": {"ljung_box_q": float, "ljung_box_p": float, "residuals_ok": bool},
        "forecasts": [
            {"year": int, "point": int, "lower_ci": int, "upper_ci": int, "yoy_change": int},
            ...
        ]
    }
"""

import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm, chi2


class ArimaForecast:
    """
    ARIMA(1,1,1) alumni employment forecaster.

    Parameters
    ----------
    real_data         : list[int] | None
        Year-by-year employed alumni counts. When None, synthetic data is used.
    base_employment   : int
        Baseline count for synthetic data generation (ignored when real_data is set).
    n_synthetic_years : int
        Number of synthetic history years to generate.
    ar_phi            : float
        Initial / fallback AR(1) coefficient (0 < phi < 1).
    ma_theta          : float
        Initial / fallback MA(1) coefficient (0 < theta < 1).
    sigma             : float
        Noise std-dev for synthetic data generation.
    seed              : int
        Random seed for reproducibility.
    forecast_steps    : int
        Number of years ahead to forecast.
    start_year        : int
        First year label for synthetic history.
    ci_level          : float
        Confidence interval level (default 0.95 → 95%).
    """

    def __init__(
        self,
        real_data: list | None = None,
        base_employment: int = 500,
        n_synthetic_years: int = 20,
        ar_phi: float = 0.60,
        ma_theta: float = 0.30,
        sigma: float = 18.0,
        seed: int = 42,
        forecast_steps: int = 3,
        start_year: int = 2004,
        ci_level: float = 0.95,
    ):
        self.real_data = real_data
        self.base_employment = base_employment
        self.n_synthetic_years = n_synthetic_years
        self.ar_phi = ar_phi
        self.ma_theta = ma_theta
        self.sigma = sigma
        self.seed = seed
        self.forecast_steps = forecast_steps
        self.start_year = start_year
        self.ci_level = ci_level
        self._rng = np.random.default_rng(seed)

    # ── Public entry point ────────────────────────────────────────────────────

    def forecast(self) -> dict:
        """
        Run the full ARIMA(1,1,1) pipeline and return forecast results.

        Returns
        -------
        dict with keys: data_source, observations, model, diagnostics, forecasts
        """
        series, data_source = self._prepare_series()
        n_obs = len(series)
        last_year = self.start_year + n_obs - 1

        phi, theta = self._fit(series)
        residuals, sigma_hat = self._residuals(series, phi, theta)
        q_stat, p_value = self._ljung_box(residuals)
        raw_forecasts = self._project(series, phi, theta, sigma_hat)

        forecast_years = range(
            last_year + 1, last_year + 1 + self.forecast_steps)
        prev_point = int(series[-1])

        forecasts = []
        for yr, f in zip(forecast_years, raw_forecasts):
            point = f["point"]
            forecasts.append({
                "year": yr,
                "point": point,
                "lower_ci": f["lower"],
                "upper_ci": f["upper"],
                "yoy_change": point - prev_point,
            })
            prev_point = point

        return {
            "data_source": data_source,
            "observations": n_obs,
            "model": {
                "phi": round(phi, 6),
                "theta": round(theta, 6),
                "sigma": round(float(sigma_hat), 6),
            },
            "diagnostics": {
                "ljung_box_q": round(float(q_stat), 4),
                "ljung_box_p": round(float(p_value), 4),
                "residuals_ok": bool(p_value > 0.05),
            },
            "forecasts": forecasts,
        }

    # ── Private helpers ───────────────────────────────────────────────────────

    def _prepare_series(self) -> tuple[np.ndarray, str]:
        """Return (series_array, data_source_label)."""
        if self.real_data is not None:
            return np.array(self.real_data, dtype=int), "real"
        return self._generate_synthetic(), "synthetic"

    def _generate_synthetic(self) -> np.ndarray:
        """Simulate an ARIMA(1,1,1) process centred on base_employment."""
        n = self.n_synthetic_years
        noise = self._rng.normal(0, self.sigma, n + 1)
        diff = np.zeros(n + 1)

        for t in range(1, n + 1):
            diff[t] = (self.ar_phi * diff[t - 1]
                       + noise[t]
                       + self.ma_theta * noise[t - 1])

        series = np.empty(n, dtype=float)
        series[0] = self.base_employment
        for t in range(1, n):
            series[t] = series[t - 1] + diff[t]

        return np.round(series).astype(int)

    def _fit(self, series: np.ndarray) -> tuple[float, float]:
        """
        Estimate phi and theta via Conditional Sum of Squares (Nelder-Mead).
        Falls back to constructor defaults if optimisation fails.
        """
        d = np.diff(series).astype(float)
        n = len(d)

        def css(params):
            phi, theta = params
            if abs(phi) >= 1 or abs(theta) >= 1:
                return 1e10
            resid = np.zeros(n)
            eps = np.zeros(n)
            for t in range(n):
                prev_d = d[t - 1] if t > 0 else 0.0
                prev_eps = eps[t - 1] if t > 0 else 0.0
                resid[t] = d[t] - phi * prev_d - theta * prev_eps
                eps[t] = resid[t]
            return float(np.sum(resid ** 2))

        result = minimize(
            css,
            [self.ar_phi, self.ma_theta],
            method="Nelder-Mead",
            options={"xatol": 1e-6, "fatol": 1e-6, "maxiter": 5000},
        )
        phi_hat, theta_hat = result.x if result.success else (
            self.ar_phi, self.ma_theta)
        return float(phi_hat), float(theta_hat)

    def _residuals(self, series: np.ndarray, phi: float, theta: float) -> tuple[np.ndarray, float]:
        """Compute model residuals on the differenced series and estimate sigma."""
        d = np.diff(series).astype(float)
        n = len(d)
        resid = np.zeros(n)
        eps = np.zeros(n)

        for t in range(n):
            prev_d = d[t - 1] if t > 0 else 0.0
            prev_eps = eps[t - 1] if t > 0 else 0.0
            resid[t] = d[t] - phi * prev_d - theta * prev_eps
            eps[t] = resid[t]

        sigma_hat = np.std(resid, ddof=2)
        return resid, sigma_hat

    def _ljung_box(self, resid: np.ndarray, lags: int = 5) -> tuple[float, float]:
        """
        Ljung-Box Q statistic for residual white-noise test.
        Automatically reduces lag count when there are too few residuals.
        Returns (nan, nan) if the series is too short to test.
        """
        n = len(resid)
        lags = min(lags, n // 2 - 1)   # need at least 2 points per lag
        if lags < 1:
            return float("nan"), float("nan")
        ac = np.array([
            np.corrcoef(resid[:-k], resid[k:])[0, 1]
            for k in range(1, lags + 1)
        ])
        q = n * (n + 2) * np.sum(ac ** 2 / (n - np.arange(1, lags + 1)))
        p = 1 - chi2.cdf(q, df=lags)
        return float(q), float(p)

    def _project(self, series: np.ndarray, phi: float, theta: float,
                 sigma_hat: float) -> list[dict]:
        """Compute h-step-ahead point forecasts and confidence intervals."""
        z = norm.ppf(1 - (1 - self.ci_level) / 2)
        d = np.diff(series).astype(float)
        last_d = d[-1]
        last_eps = last_d - phi * (d[-2] if len(d) > 1 else 0.0)

        results = []
        prev_level = float(series[-1])
        prev_d = last_d
        prev_eps = last_eps

        for h in range(1, self.forecast_steps + 1):
            d_h = phi * prev_d + theta * prev_eps
            point = round(prev_level + d_h)
            ci_half = round(z * sigma_hat * np.sqrt(h))
            results.append({
                "point": point,
                "lower": point - ci_half,
                "upper": point + ci_half,
            })
            prev_level = float(point)
            prev_eps = 0.0   # expected future shocks = 0
            prev_d = d_h

        return results
