/**
 * API client for ARIMA Employment Forecast endpoints
 */

import { apiFetch } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────

export interface ForecastPoint {
    year: number;
    point: number;
    lower_ci: number;
    upper_ci: number;
    yoy_change: number;
}

export interface ForecastModel {
    phi: number;
    theta: number;
    sigma: number;
}

export interface ForecastDiagnostics {
    ljung_box_q: number;
    ljung_box_p: number;
    residuals_ok: boolean;
}

export interface ForecastData {
    data_source: "synthetic" | "real";
    observations: number;
    model: ForecastModel;
    diagnostics: ForecastDiagnostics;
    forecasts: ForecastPoint[];
}

export interface ForecastRecord {
    id: string;
    requested_by: string | null;
    forecast_data: ForecastData;
    data_source: string;
    observations_count: number;
    forecast_steps: number;
    created_at: string;
}

// ── API functions ──────────────────────────────────────────────

/**
 * Fetch the most recent ARIMA forecast result.
 */
export async function getLatestForecast(
    token?: string
): Promise<ForecastRecord | null> {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const json = await apiFetch<any>("/predict/forecast/latest", {
            headers,
        });

        if (json.success && json.data) {
            return json.data as ForecastRecord;
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch latest forecast:", error);
        return null;
    }
}

/**
 * Fetch forecast history.
 */
export async function getForecastHistory(
    limit: number = 10,
    token?: string
): Promise<ForecastRecord[]> {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const json = await apiFetch<any>(
            `/predict/forecast/history?limit=${limit}`,
            { headers }
        );

        if (json.success && json.data) {
            return json.data as ForecastRecord[];
        }

        return [];
    } catch (error) {
        console.error("Failed to fetch forecast history:", error);
        return [];
    }
}

/**
 * Run a new ARIMA forecast.
 */
export async function runNewForecast(
    forecastSteps: number = 3,
    token?: string
): Promise<ForecastRecord | null> {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const json = await apiFetch<any>(
            `/predict/forecast?forecast_steps=${forecastSteps}`,
            {
                method: "POST",
                headers,
            }
        );

        if (json.success && json.data) {
            return json.data as ForecastRecord;
        }

        return null;
    } catch (error) {
        console.error("Failed to run forecast:", error);
        throw error;
    }
}
