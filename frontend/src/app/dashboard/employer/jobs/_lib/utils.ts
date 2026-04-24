import { UnifiedJob } from "./types";

export function convertApiJob(job: any, index: number): UnifiedJob {
    let salaryNum = 0;
    let salaryDisplay = "Undisclosed";

    const salaryStr = job.salary || job.raw_salary;
    if (salaryStr) {
        salaryDisplay = salaryStr;
        const match = salaryStr.match(/[\d,]+/);
        if (match) {
            salaryNum = Math.round(parseInt(match[0].replace(/,/g, "")) / 1000);
        }
    } else if (job.salary_min) {
        salaryDisplay = `₱${job.salary_min.toLocaleString()}${job.salary_max ? ` - ₱${job.salary_max.toLocaleString()}` : "+"}`;
        salaryNum = Math.round(job.salary_min / 1000);
    }

    let snippet = job.snippet || job.description || "";
    snippet = snippet.replace(/^(\s*\.\.\.\s*)+/, "").trim();
    if (snippet && snippet.length > 0) {
        snippet = snippet.charAt(0).toUpperCase() + snippet.slice(1);
    }

    const workType = job.work_type || (job.location?.toLowerCase().includes("remote") ? "Remote" : "On-site");
    const experienceLevel = job.experience_level || "Not specified";

    return {
        id: job.id || `api-${index}`,
        title: job.title,
        company: job.company,
        location: job.location || "Philippines",
        salary: salaryNum,
        salaryDisplay: salaryDisplay,
        type: job.type || job.job_type || "Full-time",
        postedDate: job.updated || job.posted_at ? new Date(job.updated || job.posted_at) : new Date(),
        logo: job.logo || job.company?.charAt(0).toUpperCase() || "EP",
        experienceLevel: experienceLevel,
        workType: workType,
        link: job.link || job.source_url,
        snippet: snippet,
        description: job.description,
        isActive: job.is_active !== false,
        dbId: job.db_id,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
    };
}
