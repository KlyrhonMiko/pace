"use client";

import { useState } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Loader2, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminJobCard from "./AdminJobCard";
import AdminJobDetailModal from "./AdminJobDetailModal";

interface AdminJobListProps {
    filteredJobs: any[];
    totalJobs: number;
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    JOBS_PER_PAGE: number;
    clearFilters: () => void;
    isLoading: boolean;
    onPostJob?: () => void;
}

export default function AdminJobList({
    filteredJobs,
    totalJobs,
    totalPages,
    currentPage,
    setCurrentPage,
    JOBS_PER_PAGE,
    clearFilters,
    isLoading,
    onPostJob,
}: AdminJobListProps) {
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    return (
        <div className="space-y-4">
            {/* List Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {isLoading ? "Searching..." : `Platform Job Postings (${totalJobs})`}
                    </h2>
                    <p className="text-xs text-gray-500">Showing page {currentPage} of {totalPages || 1}</p>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-3 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
                        <Loader2 className="h-8 w-8 text-emerald-700 animate-spin" />
                        <p className="text-sm font-medium text-gray-600">Fetching jobs...</p>
                    </div>
                ) : filteredJobs.length > 0 ? (
                    <>
                        {filteredJobs.map((job) => (
                            <AdminJobCard
                                key={job.id}
                                job={job}
                                isLocal={!job.link || job.id.toString().startsWith("local") || (typeof job.id === "number")}
                                onClick={() => setSelectedJob(job)}
                            />
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    className="rounded-xl h-9 w-9 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                                >
                                    <ChevronLeft size={18} />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum = currentPage;
                                        if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        if (pageNum <= 0 || pageNum > totalPages) return null;

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="icon"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`rounded-xl h-9 w-9 text-xs font-bold leading-none ${currentPage === pageNum
                                                    ? "bg-emerald-700 text-white shadow-md"
                                                    : "border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                                                    }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    className="rounded-xl h-9 w-9 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                                >
                                    <ChevronRight size={18} />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="h-16 w-16 mb-4 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                            <Briefcase size={32} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">No jobs found</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-[240px]">
                            Try adjusting your filters or search keywords to find more opportunities.
                        </p>
                        <Button
                            variant="link"
                            onClick={clearFilters}
                            className="mt-4 text-emerald-700 font-bold"
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>

            {selectedJob && (
                <AdminJobDetailModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                />
            )}
        </div>
    );
}
