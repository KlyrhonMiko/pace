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

export interface CareerTrackResult {
    prediction: string;
    probability: number;
    all_probabilities: Record<string, number>;
    input_data: {
        skills: string;
        internship_duration: number;
        gwa: number;
    };
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
    alumniId?: string
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
        if (!latestPrediction && alumniId) {
            try {
                await apiFetch(`/predict/employability/${alumniId}`, {
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

export type Degree = "BSIT" | "BSCS" | "BSA" | "BSBA-Entrepreneurship" | "BSBA-Marketing" | "BSEd-Filipino" | "BSEd-English";

export interface EmployabilityInputPayload {
    cgpa: number;
    average_prof_grade: number;
    average_elec_grade: number;
    ojt_grade: number;
    leadership_pos: "Yes" | "No";
    act_member_pos: "Yes" | "No";
    soft_skills_ave: number;
    hard_skills_ave: number;
    degree: string;
    year_graduated: number;
    [key: string]: any; // For dynamic program-specific skills
}

/**
 * Trigger a new employability prediction.
 */
export async function runPrediction(
    payload: EmployabilityInputPayload,
    alumniId?: string
): Promise<EmployabilityResult | null> {
    try {
        const targetAlumniId = alumniId;

        if (!targetAlumniId) {
            throw new Error("Alumni profile ID not found. Please ensure your profile is loaded.");
        }

        const json = await apiFetch<any>(`/predict/employability/${targetAlumniId}`, {
            method: "POST",
            body: payload,
        });

        if (json.success && json.data) {
            const data = json.data;
            return {
                prediction_id: data.prediction_id,
                realistic_assessment: data.realistic_assessment,
                improvement_roadmap: data.improvement_roadmap,
                cgpa: data.cgpa || payload.cgpa,
                top_factors: data.top_factors || [],
                improvement_suggestions: data.improvement_suggestions || [],
                skill_breakdown: data.skill_breakdown || data.improvement_suggestions || [],
            } as EmployabilityResult;
        }

        return null;
    } catch (error) {
        console.error("Failed to run employability prediction:", error);
        return null;
    }
}

/**
 * Trigger a new career track prediction.
 */
export async function triggerCareerTrackPrediction(
    alumniId: string,
    token?: string
): Promise<CareerTrackResult | null> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const json = await apiFetch<any>(`/predict/career-track/${alumniId}`, {
            method: "POST",
            headers,
            cache: "no-store",
        });

        if (json.success && json.data) {
            return json.data as CareerTrackResult;
        }

        return null;
    } catch (error) {
        console.error("Failed to run career track prediction:", error);
        return null;
    }
}

/**
 * Fetch career track history for the current alumni.
 */
export async function getMyCareerTrackPredictions(
    token?: string,
    limit: number = 10
): Promise<any[]> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const json = await apiFetch<any>(`/predict/career-track/me?limit=${limit}`, {
            headers,
            cache: "no-store",
        });

        if (json.success && json.data) {
            return json.data;
        }

        return [];
    } catch (error) {
        console.error("Failed to fetch career track history:", error);
        return [];
    }
}

export interface PredictionHistoryItem {
    id: string;
    created_at: string;
    realistic_prediction: string;
    realistic_probability: number;
    improvement_prediction: string;
    improvement_probability: number;
    input_data: any;
}

/**
 * Fetch the prediction history for the current alumni.
 */
export async function getPredictionHistory(limit: number = 10): Promise<PredictionHistoryItem[]> {
    try {
        const json = await apiFetch<any>(`/predict/employability/me?limit=${limit}`, {
            method: "GET",
            cache: "no-store",
        });

        if (json.success && json.data) {
            return json.data as PredictionHistoryItem[];
        }

        return [];
    } catch (error) {
        console.error("Failed to fetch prediction history:", error);
        return [];
    }
}


// ── Alumni Skills ─────────────────────────────────────────────────────────────

export interface AlumniSkillsRecord {
    soft_skills_ave: number | null;
    hard_skills_ave: number | null;
    program_skills: Record<string, number> | null;
    program_skills_average: number | null;
    updated_at: string | null;
}

interface SkillsPayload {
    soft_skills_ave?: number;
    hard_skills_ave?: number;
    program_skills?: Record<string, number>;
}

export async function getMySkills(alumniId: string): Promise<AlumniSkillsRecord | null> {
    try {
        const json = await apiFetch<any>(`/alumni-skills/${alumniId}`, { cache: "no-store" });
        if (json.success && json.data) {
            return {
                soft_skills_ave: json.data.soft_skills_ave ?? null,
                hard_skills_ave: json.data.hard_skills_ave ?? null,
                program_skills: json.data.program_skills ?? null,
                program_skills_average: json.data.program_skills_average ?? null,
                updated_at: json.data.updated_at ?? null,
            };
        }
        return null;
    } catch { return null; }
}

export async function createMySkills(alumniId: string, payload: SkillsPayload): Promise<boolean> {
    try {
        const json = await apiFetch<any>("/alumni-skills", { method: "POST", body: { alumni_id: alumniId, ...payload } });
        return json.success === true;
    } catch { return false; }
}

export async function updateMySkills(alumniId: string, payload: SkillsPayload): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/alumni-skills/${alumniId}`, { method: "PATCH", body: payload });
        return json.success === true;
    } catch { return false; }
}
