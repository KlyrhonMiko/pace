import { apiFetch } from "@/lib/api-client";
import { ResumeData } from "@/components/resumes/AtsResumeTemplate";

export interface AlumniProfile {
    alumni_code?: string;
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
            headers,
            cache: "no-store",
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

/**
 * Save or update the current user's resume data.
 */
export async function saveResume(data: ResumeData): Promise<boolean> {
    try {
        const response = await apiFetch<any>("/alumni/resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { resume_data: data },
        });
        return response.success;
    } catch (error) {
        console.error("Failed to save resume:", error);
        return false;
    }
}

/**
 * Fetch the current user's saved resume data.
 */
export async function getSavedResume(): Promise<ResumeData | null> {
    try {
        const response = await apiFetch<any>("/alumni/resume", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (response.success && response.data?.resume_data) {
            return response.data.resume_data as ResumeData;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch saved resume:", error);
        return null;
    }
}
/**
 * Update the current authenticated alumni's personal profile information.
 */
export async function updateMyProfile(alumniId: string, data: Partial<AlumniProfile>): Promise<boolean> {
    try {
        const response = await apiFetch<any>(`/alumni/${alumniId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: data,
        });
        return response.success;
    } catch (error) {
        console.error(`Failed to update alumni profile ${alumniId}:`, error);
        return false;
    }
}

/**
 * Update the current authenticated user's account information (e.g., email).
 */
export async function updateMyAccount(userId: string, data: { email: string }): Promise<boolean> {
    try {
        const response = await apiFetch<any>(`/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: data,
        });
        return response.success;
    } catch (error) {
        console.error(`Failed to update user account ${userId}:`, error);
        return false;
    }
}
