import { apiFetch } from "@/lib/api-client";
export * from "@/app/dashboard/_lib/jobs-api";

/**
 * Create a new job listing
 */
export async function createJob(jobData: any) {
    return await apiFetch("/jobs/", {
        method: "POST",
        body: jobData,
    });
}

/**
 * Update an existing job listing
 */
export async function updateJob(jobId: string | number, jobData: any) {
    return await apiFetch(`/jobs/${jobId}`, {
        method: "PATCH",
        body: jobData,
    });
}

/**
 * Delete a job listing
 */
export async function deleteJob(jobId: string | number) {
    return await apiFetch(`/jobs/${jobId}`, {
        method: "DELETE",
    });
}

/**
 * Toggle hide/unhide a local job listing (faculty only)
 */
export async function hideJob(jobId: string | number) {
    return await apiFetch(`/jobs/${jobId}/hide`, {
        method: "PATCH",
    });
}
