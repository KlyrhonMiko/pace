/**
 * API client for job search using the Jooble API through our backend
 */
import { apiFetch } from "@/lib/api-client";

const API_BASE_URL = "http://localhost:8000";

export interface JoobleJob {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    snippet: string;
    link: string;
    source: string;
    updated: string;
    // Backend DB fields (aliases)
    job_type?: string;
    description?: string;
    raw_salary?: string;
    work_type?: string;
    experience_level?: string;
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
}

/**
 * Search for jobs using the Jooble API through the backend
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

    try {
        const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) {
            requestHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const data = await apiFetch<JobSearchResponse>(
            `/jobs/search?${searchParams.toString()}`,
            {
                method: "GET",
                headers: requestHeaders,
            }
        );
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

        return await apiFetch<JoobleJob[]>(`/jobs/recommended?limit=${limit}`, {
            headers: requestHeaders
        });
    } catch (error) {
        console.error("Failed to fetch recommended jobs:", error);
        return [];
    }
}
