/**
 * API client for Employability Prediction endpoints
 */

function getApiBaseUrl(): string {
    if (typeof window === "undefined") {
        return process.env.INTERNAL_API_URL || process.env.API_BASE_URL || "http://localhost:8000";
    }

    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

import { apiFetch } from "@/lib/api-client";

export interface RealisticAssessment {
    prediction: "Employable" | "Not Employable";
    probability: number;
    confidence: number;
}

export interface ImprovementRoadmap {
    prediction: "Employable" | "Not Employable";
    probability: number;
    confidence: number;
}

export interface ImprovementSuggestion {
    feature: string;
    current: number;
    importance: number;
}

export interface EmployabilityResult {
    prediction_id: string;
    realistic_assessment: RealisticAssessment;
    improvement_roadmap: ImprovementRoadmap;
    cgpa: number | "N/A";
    top_factors: string[];
    improvement_suggestions: ImprovementSuggestion[];
    skill_breakdown: ImprovementSuggestion[]; // Uses the same structure: feature, current, importance
}

// ── API functions ──────────────────────────────────────────────

/**
 * Fetch the latest prediction for the current alumni.
 */
export async function getLatestPrediction(
    token?: string
): Promise<EmployabilityResult | null> {
    try {
        const API_BASE_URL = getApiBaseUrl();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const json = await apiFetch<any>("/predict/employability/me?limit=1", {
            headers: requestHeaders
        });

        if (json.success && json.data && json.data.length > 0) {
            const latest = json.data[0];
            return {
                prediction_id: latest.id,
                ...latest.prediction_result,
                // Fallback to empty array if older DB record doesn't have it
                skill_breakdown: latest.prediction_result.skill_breakdown || latest.prediction_result.improvement_suggestions || [],
            };
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch employability prediction:", error);
        return null;
    }
}


