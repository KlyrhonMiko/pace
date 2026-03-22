import { apiFetch } from "@/lib/api-client";

export interface AlumniProfile {
    alumni_id: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    gender: string;
    age: number;
    birthdate: string | null;
    consent_for_survey_ml: boolean;
    user_id: string;
    username: string;
    email: string;
    student_id: string | null;
    year_graduated: string | null;
    gwa: string | null;
    avg_prof_grade: string | null;
    avg_elec_grade: string | null;
    ojt_grade: string | null;
    leadership_pos: string | null;
    act_member_pos: string | null;
    course_id: string | null;
    course_name: string | null;
    profile_completeness: number;
    created_at: string;
    updated_at: string;
}

/**
 * Fetch the current authenticated alumni's full profile.
 */
export async function getMyProfile(token?: string): Promise<AlumniProfile | null> {
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await apiFetch<any>("/alumni/me", {
            headers
        });

        if (response.success && response.data) {
            return response.data as AlumniProfile;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch alumni profile:", error);
        return null;
    }
}
