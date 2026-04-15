"use client";

import { toast } from "sonner";
import { useState, useMemo, useEffect, useCallback } from "react";

import JobFilters from "../../alumni/jobs/_components/JobFilters"; // Reuse filters
import AdminJobList from "./_components/AdminJobList";
import PageHeader from "@/components/dashboard/PageHeader";
import { searchJobs } from "../../faculty/jobs/_lib/api"; // Reuse API
import { useDebounce } from "../../../../hooks/use-debounce";

// Unified job type
interface UnifiedJob {
    id: number | string;
    title: string;
    company: string;
    location: string;
    salary: number;
    salaryDisplay: string;
    type: string;
    postedDate: Date;
    logo: string;
    experienceLevel: string;
    workType: string;
    link?: string;
    snippet?: string;
    description?: string;
    isActive: boolean;
    dbId?: number;
}

function convertApiJob(job: any, index: number): UnifiedJob {
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
        logo: job.company.charAt(0).toUpperCase(),
        experienceLevel: experienceLevel,
        workType: workType,
        link: job.link || job.source_url,
        snippet: snippet,
        description: job.description,
        isActive: job.is_active !== false,
        dbId: job.db_id,
    };
}

export default function AdminJobBoardPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [locationSearch, setLocationSearch] = useState("");
    const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
    const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
    const [hasSalary, setHasSalary] = useState(false);
    const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500]);
    const [tempSalaryRange, setTempSalaryRange] = useState<[number, number]>([0, 500]);

    const [currentPage, setCurrentPage] = useState(1);
    const JOBS_PER_PAGE = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const debouncedLocationSearch = useDebounce(locationSearch, 500);

    const [apiJobs, setApiJobs] = useState<UnifiedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalApiJobs, setTotalApiJobs] = useState(0);

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await searchJobs({
                keywords: debouncedSearchQuery || undefined,
                location: debouncedLocationSearch || "Philippines",
                job_type: selectedTypes.length > 0 ? selectedTypes[0] : undefined,
                work_type: selectedWorkTypes.length > 0 ? selectedWorkTypes[0] : undefined,
                experience_level: selectedExperience.length > 0 ? selectedExperience[0] : undefined,
                page: currentPage,
                limit: JOBS_PER_PAGE,
                has_salary: hasSalary,
                include_inactive: true,
            });

            if (result.error) {
                toast.error(result.error);
                setApiJobs([]);
                setTotalApiJobs(0);
            } else {
                const converted = result.jobs.map((job: any, index: number) => convertApiJob(job, index));
                setApiJobs(converted);
                setTotalApiJobs(result.totalCount);
            }
        } catch {
            toast.error("Failed to fetch jobs");
            setApiJobs([]);
            setTotalApiJobs(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchQuery, debouncedLocationSearch, selectedTypes, selectedWorkTypes, selectedExperience, currentPage, hasSalary]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Debounce salary range updates to prevent layout shift while dragging
    useEffect(() => {
        const timer = setTimeout(() => {
            setSalaryRange(tempSalaryRange);
        }, 300);
        return () => clearTimeout(timer);
    }, [tempSalaryRange]);

    // Client-side filtering for salary range
    const filteredJobs = useMemo(() => {
        const isDefaultSalary = salaryRange[0] === 0 && salaryRange[1] === 500;
        return apiJobs.filter((job) => {
            const matchesSalary = isDefaultSalary || job.salary === 0 || (job.salary >= salaryRange[0] && job.salary <= salaryRange[1]);
            return matchesSalary;
        });
    }, [apiJobs, salaryRange]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedTypes([]);
        setLocationSearch("");
        setSelectedExperience([]);
        setSelectedWorkTypes([]);
        setSalaryRange([0, 500]);
        setTempSalaryRange([0, 500]);
        setHasSalary(false);
        setCurrentPage(1);
    };

    return (
        <div className="relative">
            {/* Page Header */}
            <div className="mb-6">
                <PageHeader
                    title="Platform Job Management"
                    description="As an administrator, you can manage all job postings across the platform."
                    currentPage="Job Management"
                    dashboardHref="/dashboard/admin"
                    dashboardName="Admin Dashboard"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AdminJobList
                        filteredJobs={filteredJobs}
                        totalJobs={totalApiJobs}
                        totalPages={Math.ceil(totalApiJobs / JOBS_PER_PAGE)}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        JOBS_PER_PAGE={JOBS_PER_PAGE}
                        clearFilters={clearFilters}
                        isLoading={isLoading}
                    />
                </div>

                <div className="lg:col-span-1">
                    <JobFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        locationSearch={locationSearch}
                        setLocationSearch={setLocationSearch}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                        selectedWorkTypes={selectedWorkTypes}
                        setSelectedWorkTypes={setSelectedWorkTypes}
                        selectedExperience={selectedExperience}
                        setSelectedExperience={setSelectedExperience}
                        hasSalary={hasSalary}
                        setHasSalary={setHasSalary}
                        tempSalaryRange={tempSalaryRange}
                        setTempSalaryRange={setTempSalaryRange}
                    />
                </div>
            </div>
        </div>
    );
}
