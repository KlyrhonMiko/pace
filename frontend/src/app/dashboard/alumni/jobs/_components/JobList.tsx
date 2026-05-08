"use client";

import { useState } from "react";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import { Skeleton } from "../../../../../components/ui/skeleton";
import { Briefcase, Search, ChevronLeft, ChevronRight, Info, Sparkles } from "lucide-react";

interface Job {
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
    snippet?: string;
    requirements?: string;
    link?: string;
    description?: string;
    source?: string;
    matchPercentage?: number;
}

interface JobListProps {
    filteredJobs: Job[];
    totalJobs: number;
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;

    JOBS_PER_PAGE: number;
    clearFilters: () => void;

    isLoading?: boolean;
    sortByMatch?: boolean;
}

export default function JobList({
    filteredJobs,
    totalJobs,
    totalPages,
    currentPage,
    setCurrentPage,

    JOBS_PER_PAGE,
    clearFilters,
    isLoading = false,
    sortByMatch = false,
}: JobListProps) {
    const paginatedJobs = filteredJobs;
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-fit flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                            <Briefcase className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Available Positions
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Showing <strong className="text-gray-900">{filteredJobs.length}</strong> of {totalJobs} jobs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {sortByMatch && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600/20" />
                                <span className="text-xs font-bold text-indigo-700">Sorted by best match</span>
                            </div>
                        )}
                        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50/50 to-transparent border border-slate-100 shadow-sm">
                            <div className="w-1 h-3.5 bg-emerald-500 rounded-sm shadow-sm"></div>
                            <span className="text-xs font-medium text-slate-600">Platform jobs highlighted</span>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="relative z-10 flex flex-col gap-4 skeleton-stagger">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-gray-50/80 to-white p-5 shadow-sm">
                                {/* Logo Skeleton with shimmer */}
                                <div className="h-12 w-12 rounded-xl flex-shrink-0 skeleton-shimmer" style={{
                                    background: 'linear-gradient(135deg, hsl(220 40% 92%) 0%, hsl(230 30% 88%) 100%)'
                                }}>
                                    <div className="skeleton-shimmer h-full w-full rounded-xl" />
                                </div>

                                <div className="flex-1 min-w-0 space-y-3">
                                    {/* Title row + Badge */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <Skeleton className="h-[14px] w-3/5 rounded-md" />
                                            <Skeleton className="h-[11px] w-2/5 rounded-md" />
                                        </div>
                                        <Skeleton className="h-[22px] w-[72px] rounded-full flex-shrink-0" />
                                    </div>

                                    {/* Description lines */}
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-[10px] w-full rounded" />
                                        <Skeleton className="h-[10px] w-4/6 rounded" />
                                    </div>

                                    {/* Meta row — location + salary icons */}
                                    <div className="flex items-center gap-5 pt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <Skeleton className="h-3.5 w-3.5 rounded" />
                                            <Skeleton className="h-[10px] w-20 rounded" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Skeleton className="h-3.5 w-3.5 rounded" />
                                            <Skeleton className="h-[10px] w-16 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Job Cards List */
                    <div className="relative z-10 flex flex-col gap-4">
                        {paginatedJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                title={job.title}
                                company={job.company}
                                location={job.location}
                                salary={job.salaryDisplay}
                                type={job.type}
                                logo={job.logo}
                                description={job.snippet}
                                source={job.source}
                                matchPercentage={job.matchPercentage}
                                onClick={() => setSelectedJob(job)}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredJobs.length === 0 && (
                    <div className="relative z-10 py-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-8 w-8" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No jobs found</h3>
                        <p className="text-slate-500 mb-4">Try adjusting your search or filter criteria</p>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="relative z-10 mt-8 flex items-center justify-center gap-2">
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium transition-all duration-200 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                            Prev
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                // Show first, last, current, and adjacent pages
                                const showPage =
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1;
                                const showEllipsis =
                                    (page === 2 && currentPage > 3) ||
                                    (page === totalPages - 1 && currentPage < totalPages - 2);

                                if (!showPage && !showEllipsis) return null;

                                if (showEllipsis && !showPage) {
                                    return (
                                        <span key={page} className="px-2 text-slate-400">
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[40px] h-10 rounded-lg font-medium transition-all duration-200 ${currentPage === page
                                            ? "bg-emerald-700 text-white shadow-md shadow-emerald-200"
                                            : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium transition-all duration-200 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:hover:bg-slate-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" strokeWidth={2} />
                        </button>
                    </div>
                )}

                {/* Showing X of Y jobs indicator */}
                {!isLoading && filteredJobs.length > 0 && (
                    <div className="relative z-10 mt-4 text-center text-sm text-slate-500">
                        Showing {(currentPage - 1) * JOBS_PER_PAGE + 1}-{Math.min((currentPage - 1) * JOBS_PER_PAGE + filteredJobs.length, totalJobs)} of {totalJobs} jobs
                    </div>
                )}
                {/* Job Detail Modal */}
                {selectedJob && (
                    <JobDetailModal
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                    />
                )}
            </div>
        </div>
    );
}
