"use client";

import { apiFetch } from "../../../lib/api-client";

export interface AdminStats {
    total_users: number;
    verified_alumni: number;
    active_jobs: number;
    upcoming_events: number;
}

export interface FacultyStats {
    alumni_advised: number;
    events_organized: number;
    placement_rate: number;
    active_jobs: number;
    avg_offers: number;
    avg_package: number;
    top_sector: string;
    placement_distribution: {
        employed: number;
        interviewing: number;
        searching: number;
    };
}

export interface AlumniProgressItem {
    name: string;
    course: string;
    status: string;
    company: string | null;
    initials: string;
}

export interface FacultyActivity {
    id: string;
    description: string;
    type: string;
    created_at: string;
}

export interface MentoringSessionItem {
    id: string;
    title: string;
    student: string;
    time: string;
    location: string;
    status: string;
}

export interface AlumniStats {
    job_applications: number;
    registered_events: number;
    upcoming_interviews: number;
    profile_completeness: number;
}

export interface Activity {
    activity_id: string;
    activity_type: string;
    description: string;
    activity_metadata?: any;
    created_at: string;
}

/**
 * Fetches statistics for the admin dashboard.
 */
export async function fetchAdminStats(): Promise<AdminStats | null> {
    try {
        const json = await apiFetch<any>("/dashboard/admin/stats");
        if (json.success && json.data) {
            return json.data as AdminStats;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return null;
    }
}

/**
 * Fetches statistics for the faculty dashboard.
 */
export async function fetchFacultyStats(): Promise<FacultyStats | null> {
    try {
        const json = await apiFetch<any>("/dashboard/faculty/stats");
        if (json.success && json.data) {
            return json.data as FacultyStats;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch faculty stats:", error);
        return null;
    }
}
/**
 * Fetches statistics for the alumni dashboard.
 */
export async function fetchAlumniStats(): Promise<AlumniStats | null> {
    try {
        const json = await apiFetch<any>("/dashboard/alumni/stats");
        if (json.success && json.data) {
            return json.data as AlumniStats;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch alumni stats:", error);
        return null;
    }
}

/**
 * Fetches recent alumni progress for the faculty dashboard.
 */
export async function fetchFacultyAlumniProgress(): Promise<AlumniProgressItem[]> {
    try {
        const json = await apiFetch<any>("/dashboard/faculty/progress");
        if (json.success && json.data) {
            return json.data as AlumniProgressItem[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch faculty alumni progress:", error);
        return [];
    }
}

/**
 * Fetches general alumni activity for the faculty dashboard.
 */
export async function fetchFacultyActivity(limit: number = 5): Promise<FacultyActivity[]> {
    try {
        const json = await apiFetch<any>(`/dashboard/faculty/activity?limit=${limit}`);
        if (json.success && json.data) {
            return json.data as FacultyActivity[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch faculty activity:", error);
        return [];
    }
}

/**
 * Fetches upcoming mentoring sessions for the faculty dashboard.
 */
export async function fetchFacultySessions(): Promise<MentoringSessionItem[]> {
    try {
        const json = await apiFetch<any>("/dashboard/faculty/sessions");
        if (json.success && json.data) {
            return json.data as MentoringSessionItem[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch faculty sessions:", error);
        return [];
    }
}

/**
 * Fetches recent activity for the alumni dashboard.
 */
export async function fetchAlumniActivity(limit: number = 5): Promise<Activity[]> {
    try {
        const json = await apiFetch<any>(`/alumni/activity/me?limit=${limit}`);
        if (json.success && json.data) {
            return json.data as Activity[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch alumni activity:", error);
        return [];
    }
}

/**
 * Fetches recent activity for the employer dashboard.
 */
export async function fetchEmployerActivity(limit: number = 5): Promise<Activity[]> {
    try {
        const json = await apiFetch<any>(`/employers/activity/me?limit=${limit}`);
        if (json.success && json.data) {
            return json.data as Activity[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch employer activity:", error);
        return [];
    }
}