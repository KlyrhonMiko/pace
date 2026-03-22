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
    referrals_sent: number;
}

export interface AlumniStats {
    job_applications: number;
    registered_events: number;
    upcoming_interviews: number;
    profile_completeness: number;
}

export interface Activity {
    id: string;
    name: string;
    date: string;
    type: "create" | "update" | "delete" | "action";
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
 * Fetches recent activity for the alumni dashboard.
 */
export async function fetchAlumniActivity(limit: number = 5): Promise<Activity[]> {
    try {
        const json = await apiFetch<any>(`/dashboard/alumni/activity?limit=${limit}`);
        if (json.success && json.data) {
            return json.data as Activity[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch alumni activity:", error);
        return [];
    }
}