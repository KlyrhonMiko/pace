/**
 * API client for Employability Prediction endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Response types ─────────────────────────────────────────────

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
 * Fetch the latest prediction for an alumni by their UUID.
 */
export async function getLatestPrediction(
    alumniCode: string
): Promise<EmployabilityResult | null> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/predict/employability/alumni/${alumniCode}?limit=1`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

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

/**
 * Fetch a demo prediction using a sample payload.
 */
export async function fetchDemoPrediction(): Promise<EmployabilityResult | null> {
    const demoPayload = {
        cgpa: 1.5,
        average_prof_grade: 92.5,
        average_elec_grade: 88.0,
        ojt_grade: 95.0,
        leadership_pos: "Yes",
        act_member_pos: "Yes",
        soft_skills_ave: 85.0,
        hard_skills_ave: 88.0,
        degree: "BSIT",
        year_graduated: new Date().getFullYear(),
        python_programming_skills: 85.0,
        java_programming_skills: 80.0,
        database_management_skills: 90.0,
        web_development_skills: 88.0,
        networking_skills: 75.0,
        cloud_computing_skills: 70.0,
        software_engineering_skills: 85.0,
        data_structures_algorithms: 82.0,
        machine_learning_skills: 0.0,
        system_design_skills: 80.0,
        cybersecurity_skills: 0.0,
        artificial_intelligence_skills: 0.0,
        programming_logic_skills: 88.0,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/predict/employability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(demoPayload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        if (json.success && json.data) {
            // Note: POST returns the new prediction in json.data as an object (not an array like GET)
            return {
                prediction_id: json.data.prediction_id,
                realistic_assessment: json.data.realistic_assessment,
                improvement_roadmap: json.data.improvement_roadmap,
                cgpa: json.data.cgpa,
                top_factors: json.data.top_factors,
                improvement_suggestions: json.data.improvement_suggestions,
                skill_breakdown: json.data.skill_breakdown,
            };
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch demo employability prediction:", error);
        return null;
    }
}
