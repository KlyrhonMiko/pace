"use client";

import { useState } from "react";
import {
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Info,
    MapPin,
    CircleDollarSign,
    RefreshCw,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import JobDetailModal from "./JobDetailModal";

interface JobListProps {
    filteredJobs: any[];
    totalJobs: number;
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    JOBS_PER_PAGE: number;
    clearFilters: () => void;
    isLoading: boolean;
}

export default function JobList({
    filteredJobs,
    totalJobs,
    totalPages,
    currentPage,
    setCurrentPage,
    JOBS_PER_PAGE,
    clearFilters,
    isLoading,
}: JobListProps) {
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    const getBadgeStyle = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'full-time':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
            case 'internship':
                return 'bg-blue-50 text-blue-700 border-blue-200/60';
            case 'part-time':
                return 'bg-amber-50 text-amber-700 border-amber-200/60';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200/60';
        }
    };

    const getLogoGradient = (logo: string) => {
        const charCode = logo?.charCodeAt(0) || 0;
        const gradients = [
            'from-violet-500 to-purple-600',
            'from-blue-500 to-cyan-600',
            'from-emerald-700 to-teal-600',
            'from-rose-500 to-pink-600',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-blue-600',
            'from-amber-500 to-orange-600',
        ];
        return gradients[charCode % gradients.length];
    };

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 flex flex-col h-fit">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <Briefcase className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            {isLoading ? "Searching..." : `Job Opportunities`}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Showing {totalJobs} results • Page {currentPage} of {totalPages || 1}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium whitespace-nowrap">
                        <Info size={12} />
                        Faculty posts are highlighted
                    </div>
                    {/* Placeholder for potential refresh button if needed, matching EventList style */}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Job Details</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type & Location</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Salary</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        <p className="text-sm font-semibold text-slate-500 animate-pulse">Fetching opportunities...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredJobs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                            <Briefcase className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500">No jobs found.</p>
                                        <Button
                                            variant="link"
                                            onClick={clearFilters}
                                            className="text-emerald-700 font-bold h-auto p-0"
                                        >
                                            Clear all filters
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredJobs.map((job) => {
                                const isLocal = Boolean(job.dbId) || !job.link || job.id.toString().startsWith("local");
                                return (
                                    <tr key={job.id} onClick={() => setSelectedJob(job)} className="group transition-all duration-200 hover:bg-slate-50/50 cursor-pointer">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getLogoGradient(job.logo)} text-white text-sm font-bold shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                                                    {job.logo}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{job.title}</h4>
                                                        {isLocal && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase whitespace-nowrap">
                                                                Local
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{job.company}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-fit ${getBadgeStyle(job.type)}`}>
                                                    {job.type}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 text-slate-400" strokeWidth={1.5} /> {job.location}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                                                <span>{job.salaryDisplay || "Undisclosed"}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg hover:shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedJob(job);
                                                    }}
                                                >
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                                {job.link && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg hover:shadow-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <a href={job.link} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer - similar to how it might fit in the card */}
            {totalPages > 1 && !isLoading && (
                <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(currentPage - 1);
                        }}
                        className="rounded-xl h-9 w-9 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 bg-white"
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentPage(pageNum);
                                    }}
                                    className={`rounded-xl h-9 w-9 text-xs font-bold leading-none ${currentPage === pageNum
                                        ? "bg-emerald-700 text-white shadow-md"
                                        : "border-slate-200 hover:border-emerald-300 hover:text-emerald-700 bg-white"
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
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(currentPage + 1);
                        }}
                        className="rounded-xl h-9 w-9 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 bg-white"
                    >
                        <ChevronRight size={18} />
                    </Button>
                </div>
            )}

            {selectedJob && (
                <JobDetailModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                />
            )}
        </div>
    );
}
