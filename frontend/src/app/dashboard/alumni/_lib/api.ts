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
    skill_breakdown: ImprovementSuggestion[];
}

/**
 * Normalizes a value for UI display.
 * Specifically handles academic grades (GWA style 1.0 - 5.0) by mapping them to 0-100.
 */
export function normalizeValue(value: number, featureName: string): number {
    const name = featureName.toLowerCase();
    const invertedKeywords = ["cgpa", "gwa", "prof grade", "elec grade", "academic"];
    
    // Heuristic: If it's an academic field and value is in 1.0-5.0 range
    if (invertedKeywords.some(k => name.includes(k)) && value >= 1.0 && value <= 5.0) {
        // Map 1.0 (Best) -> 100, 5.0 (Worst) -> 0
        return Math.max(0, Math.min(100, ((5.0 - value) / 4.0) * 100));
    }
    
    return value;
}

// ── API functions ──────────────────────────────────────────────

/**
 * Fetch the latest prediction for the current alumni.
 */
export async function getLatestPrediction(
    token?: string,
    alumniCode?: string
): Promise<EmployabilityResult | null> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const fetchLatest = async () => {
            const json = await apiFetch<any>("/predict/employability/me?limit=1", {
                headers: requestHeaders,
                cache: "no-store",
            });

            if (json.success && json.data && json.data.length > 0) {
                const latest = json.data[0];
                
                // Ensure we have a prediction_result object
                const result = latest.prediction_result || {};
                
                return {
                    prediction_id: latest.id,
                    realistic_assessment: result.realistic_assessment || {
                        prediction: latest.realistic_prediction || "Not Employable",
                        probability: latest.realistic_probability || 0,
                        confidence: latest.realistic_probability || 0
                    },
                    improvement_roadmap: result.improvement_roadmap || {
                        prediction: latest.improvement_prediction || "Not Employable",
                        probability: latest.improvement_probability || 0,
                        confidence: latest.improvement_probability || 0
                    },
                    cgpa: result.cgpa ?? result.CGPA ?? "N/A",
                    top_factors: result.top_factors || [],
                    improvement_suggestions: result.improvement_suggestions || [],
                    skill_breakdown: result.skill_breakdown || result.improvement_suggestions || [],
                } as EmployabilityResult;
            }

            return null;
        };

        let latestPrediction = await fetchLatest();

        // If there is no stored prediction yet, attempt to generate one for this exact alumni user.
        if (!latestPrediction && alumniCode) {
            try {
                await apiFetch(`/predict/employability/${alumniCode}`, {
                    method: "POST",
                    headers: requestHeaders,
                    cache: "no-store",
                });
                latestPrediction = await fetchLatest();
            } catch {
                // Keep null and let the UI show the no-data state if prerequisites are missing.
            }
        }

        return latestPrediction;
    } catch (error) {
        console.error("Failed to fetch employability prediction:", error);
        return null;
    }
}


