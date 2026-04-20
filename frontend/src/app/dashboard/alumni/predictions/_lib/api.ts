/**
 * API client for Linear Regression prediction endpoints
 */

import { apiFetch } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────

export interface SalaryPrediction {
    value: number;
    lower: number;
    upper: number;
    band: "Low" | "Mid" | "High";
    unit: string;
}

export interface DurationPrediction {
    value: number;
    lower: number;
    upper: number;
    outlook: "Short" | "Moderate" | "Long";
    unit: string;
}

export interface RegressionInput {
    cgpa: number;
    internships: number;
    projects: number;
    skills_count: number;
    extracurricular: number;
}

export interface RegressionPredictionResult {
    input: RegressionInput;
    predictions: {
        starting_salary: SalaryPrediction;
        job_search_duration: DurationPrediction;
    };
}

export interface RegressionPrediction {
    id: string;
    alumni_code: string;
    input_data: RegressionInput;
    prediction_result: RegressionPredictionResult;
    predicted_salary: number;
    predicted_duration_weeks: number;
    salary_band: string;
    search_outlook: string;
    created_at: string;
}

// ── API functions ──────────────────────────────────────────────

/**
 * Fetch regression predictions for the current alumni.
 */
export async function getMyRegressionPredictions(
    token?: string,
    limit: number = 10
): Promise<RegressionPrediction[]> {
    try {
        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            requestHeaders["Authorization"] = `Bearer ${token}`;
        }

        const json = await apiFetch<any>(
            `/predict/regression/me?limit=${limit}`,
            { headers: requestHeaders }
        );

        if (json.success && json.data) {
            return json.data;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch regression predictions:", error);
        return [];
    }
}

/**
 * Trigger a new regression prediction for the current alumni.
 */
export async function triggerRegressionPrediction(
    alumniCode: string
): Promise<RegressionPredictionResult | null> {
    try {
        const json = await apiFetch<any>(
            `/predict/regression/${alumniCode}`,
            { method: "POST" }
        );

        if (json.success && json.data) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error("Failed to trigger regression prediction:", error);
        return null;
    }
}
