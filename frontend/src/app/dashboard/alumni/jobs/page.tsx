"use client";

import { toast } from "sonner";
import { useState, useMemo, useEffect, useCallback } from "react";

import JobFilters from "./_components/JobFilters";
import JobList from "./_components/JobList";
import PageHeader from "@/components/dashboard/PageHeader";
import { jobTypes, experienceLevels, workTypes } from "./_components/constants";
import { searchJobs, JoobleJob } from "./_lib/api";
import { useDebounce } from "../../../../hooks/use-debounce";

// Unified job type that works with both static and API data
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
    source?: string;
}

// Convert Jooble API job to unified format
function convertApiJob(job: JoobleJob, index: number): UnifiedJob {
    // Parse salary from string (e.g., "₱20,000 - ₱30,000" or "Competitive")
    let salaryNum = 0; // Default salary for filtering (0 means unknown/negotiable)
    let salaryDisplay = "Undisclosed";

    const salaryStr = job.salary || job.raw_salary;
    if (salaryStr) {
        salaryDisplay = salaryStr; // Use original string for display
        const match = salaryStr.match(/[\d,]+/);
        if (match) {
            salaryNum = Math.round(parseInt(match[0].replace(/,/g, "")) / 1000);
        }
    }

    // Clean up snippet
    let snippet = job.snippet || job.description || "";
    // Remove leading ellipsis, whitespace, and non-word characters (except starting tags if any)
    snippet = snippet.replace(/^(\s*\.\.\.\s*)+/, "").trim();
    // Capitalize first letter if it explains the start
    if (snippet && snippet.length > 0) {
        snippet = snippet.charAt(0).toUpperCase() + snippet.slice(1);
    }

    // Use API values if available, otherwise fallback to defaults
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
        postedDate: job.updated ? new Date(job.updated) : new Date(),
        logo: (job.logo && (job.logo.startsWith('http') || job.logo.startsWith('/'))) ? job.logo : job.company.charAt(0).toUpperCase(),
        experienceLevel: experienceLevel,
        workType: workType,
        link: job.link,
        snippet: snippet,
        source: job.source || (job.link ? "External" : "Internal"),
    };
}

export default function JobListingsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [locationSearch, setLocationSearch] = useState("");
    const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
    const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
    const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500]);
    const [tempSalaryRange, setTempSalaryRange] = useState<[number, number]>([0, 500]);
    const [hasSalary, setHasSalary] = useState(false);
    const [localOnly, setLocalOnly] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const JOBS_PER_PAGE = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const debouncedLocationSearch = useDebounce(locationSearch, 500);

    // API state
    const [apiJobs, setApiJobs] = useState<UnifiedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null); // Removed error state

    const [totalApiJobs, setTotalApiJobs] = useState(0);
    // Removed facets state as they are no longer displayed in the UI

    // Removed fetchFilterCounts as facets are now returned by the main searchJobs call

    // Fetch jobs from API
    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        // setError(null);

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
                local_only: localOnly,
            });

            if (result.error) {
                // setError(result.error);
                toast.error(result.error);
                setApiJobs([]);
                setTotalApiJobs(0);
            } else {
                const converted = result.jobs.map((job, index) => convertApiJob(job, index));
                setApiJobs(converted);
                setTotalApiJobs(result.totalCount);
            }
        } catch {
            // setError("Failed to fetch jobs from API");
            toast.error("Failed to fetch jobs from API");
            setApiJobs([]);
            setTotalApiJobs(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchQuery, debouncedLocationSearch, selectedTypes, selectedWorkTypes, selectedExperience, currentPage, JOBS_PER_PAGE, hasSalary, localOnly]);

    // Fetch jobs on mount and when search/location/page changes
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Fetch filter counts removed - facets now handled in fetchJobs

    // Debounce salary range updates to prevent layout shift while dragging
    useEffect(() => {
        const timer = setTimeout(() => {
            setSalaryRange(tempSalaryRange);
        }, 300);
        return () => clearTimeout(timer);
    }, [tempSalaryRange]);



    // Use API jobs directly
    const jobData = apiJobs;
    const totalJobCount = totalApiJobs;

    // Filter and sort jobs (client-side filtering for salary range)
    const filteredJobs = useMemo(() => {
        const isDefaultSalary = salaryRange[0] === 0 && salaryRange[1] === 500;

        // Server-side filters: keywords, location, job_type, work_type, experience_level
        // Client-side filters: salary range only
        const filtered = jobData.filter((job) => {
            const matchesSalary = isDefaultSalary || job.salary === 0 || (job.salary >= salaryRange[0] && job.salary <= salaryRange[1]);
            return matchesSalary;
        });

        return filtered;
    }, [jobData, salaryRange]);

    // Removed getFilterCounts as counts are no longer displayed

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedTypes([]);
        setLocationSearch("");
        setSelectedExperience([]);
        setSelectedWorkTypes([]);
        setSalaryRange([0, 500]);
        setTempSalaryRange([0, 500]);
        setHasSalary(false);
        setLocalOnly(false);
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, selectedTypes, debouncedLocationSearch, selectedExperience, selectedWorkTypes, salaryRange, hasSalary, localOnly]);



    return (
        <div className="relative">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-blue-100 opacity-30 blur-3xl" />
                <div className="absolute bottom-20 right-1/4 h-48 w-48 rounded-full bg-violet-100 opacity-30 blur-3xl" />
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <PageHeader
                    title="Job Listings"
                    description="Discover opportunities that match your skills and career goals"
                    currentPage="Job Listings"
                />
            </div>





            {/* 2-Column Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Job Listings */}
                <div className="lg:col-span-2">
                    <JobList
                        filteredJobs={filteredJobs}
                        totalJobs={totalJobCount}
                        totalPages={Math.ceil(totalApiJobs / JOBS_PER_PAGE)}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}

                        JOBS_PER_PAGE={JOBS_PER_PAGE}
                        clearFilters={clearFilters}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right Column: Search & Filters */}
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
                        tempSalaryRange={tempSalaryRange}
                        setTempSalaryRange={setTempSalaryRange}
                        hasSalary={hasSalary}
                        setHasSalary={setHasSalary}
                        localOnly={localOnly}
                        setLocalOnly={setLocalOnly}
                    />
                </div>
            </div>
        </div>
    );
}
