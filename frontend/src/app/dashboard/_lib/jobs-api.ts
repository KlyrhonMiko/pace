/**
 * Shared API client for job search
 */
import { apiFetch } from "@/lib/api-client";

export interface JoobleJob {
    id: string | number;
    db_id?: string | number;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    snippet: string;
    link: string;
    source: string;
    updated: string;
    logo?: string;
    // Backend DB fields (aliases)
    job_type?: string;
    description?: string;
    raw_salary?: string;
    work_type?: string;
    experience_level?: string;
    requirements?: string;
    posted_at?: string;
}

export interface JobSearchResponse {
    jobs: JoobleJob[];
    totalCount: number;
    facets?: {
        jobTypes: Record<string, number>;
        workTypes: Record<string, number>;
        experienceLevels: Record<string, number>;
    };
    error?: string;
}

export interface JobSearchParams {
    keywords?: string;
    location?: string;
    page?: number;
    limit?: number;
    salary?: number;
    job_type?: string;
    work_type?: string;
    experience_level?: string;
    has_salary?: boolean;
    include_inactive?: boolean;
    local_only?: boolean;
}

/**
 * Search for jobs through the backend
 */
export async function searchJobs(params: JobSearchParams = {}, token?: string): Promise<JobSearchResponse> {
    const searchParams = new URLSearchParams();

    if (params.keywords) searchParams.set("keywords", params.keywords);
    if (params.location) searchParams.set("location", params.location);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.salary) searchParams.set("salary", params.salary.toString());
    if (params.job_type) searchParams.set("job_type", params.job_type);
    if (params.work_type) searchParams.set("work_type", params.work_type);
    if (params.experience_level) searchParams.set("experience_level", params.experience_level);
    if (params.has_salary) searchParams.set("has_salary", "true");
    if (params.include_inactive) searchParams.set("include_inactive", "true");
    if (params.local_only) searchParams.set("local_only", "true");

    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await apiFetch<{ success: boolean; data: JobSearchResponse } | JobSearchResponse>(
            `/jobs/search?${searchParams.toString()}`,
            {
                method: "GET",
                headers: requestHeaders,
            }
        );
        // Backend wraps response in StandardResponse { success, code, message, data }
        const data = "data" in response && "success" in response
            ? (response as { data: JobSearchResponse }).data
            : response as JobSearchResponse;
        return data;
    } catch (error) {
        console.error("Failed to fetch jobs:", error);
        return {
            jobs: [],
            totalCount: 0,
            error: error instanceof Error ? error.message : "Failed to fetch jobs",
        };
    }
}

/**
 * Get recommended jobs
 */
export async function getRecommendedJobs(limit: number = 3, token?: string): Promise<JoobleJob[]> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await apiFetch<any>(`/jobs/recommended?limit=${limit}`, {
            headers: requestHeaders
        });

        // Handle both StandardResponse { success, data } and raw JoobleJob[]
        const data = response && typeof response === 'object' && 'data' in response && 'success' in response
            ? response.data
            : response;

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to fetch recommended jobs:", error);
        return [];
    }
}

/**
 * Get semantically matched jobs for a specific alumni ID
 */
export async function getMatchedJobs(alumniId: string, token?: string): Promise<any[]> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await apiFetch<any>(`/jobs/match/${alumniId}`, {
            headers: requestHeaders,
            cache: "no-store",
        });

        if (response && typeof response === "object" && "success" in response && response.success) {
            return response.data || [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch matched jobs:", error);
        return [];
    }
}

/**
 * Apply for a job
 */
export async function applyToJob(jobListingId: number | string, token?: string, resumeFile?: File): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = {};
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        let body: any = undefined;
        if (resumeFile) {
            const formData = new FormData();
            formData.append("resume", resumeFile);
            body = formData;
        } else {
            requestHeaders["Content-Type"] = "application/json";
        }

        const response = await apiFetch<any>(`/jobs/${jobListingId}/apply`, {
            method: "POST",
            headers: requestHeaders,
            body: body
        });

        return {
            success: true,
            message: response.message || "Successfully applied for the job",
            data: response.data
        };
    } catch (error) {
        console.error("Failed to apply for job:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to apply for job"
        };
    }
}

/**
 * Get current user's job applications
 */
export async function getMyApplications(token?: string): Promise<any[]> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await apiFetch<any>(`/jobs/my-applications`, {
            headers: requestHeaders
        });

        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch applications:", error);
        return [];
    }
}

/**
 * Get a specific job listing by ID
 */
export async function getJobListing(jobListingId: string | number, token?: string): Promise<JoobleJob | null> {
    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await apiFetch<any>(`/jobs/${jobListingId}`, {
            headers: requestHeaders
        });

        // Depending on how backend wraps it
        return response.data || response;
    } catch (error) {
        console.error(`Failed to fetch job listing ${jobListingId}:`, error);
        return null;
    }
}
