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
    Edit2,
    EyeOff,
    Eye,
    Trash2,
    PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminJobDetailModal from "../../../admin/jobs/_components/AdminJobDetailModal";
import { UnifiedJob } from "../_lib/types";

interface EmployerJobListProps {
    filteredJobs: UnifiedJob[];
    totalJobs: number;
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    clearFilters: () => void;
    isLoading: boolean;
    onEdit?: (job: UnifiedJob) => void;
    onToggleHide?: (job: UnifiedJob) => void;
    onDelete?: (job: UnifiedJob) => void;
    onAdd?: () => void;
}

export default function EmployerJobList({
    filteredJobs,
    totalJobs,
    totalPages,
    currentPage,
    setCurrentPage,
    clearFilters,
    isLoading,
    onEdit,
    onToggleHide,
    onDelete,
    onAdd,
}: EmployerJobListProps) {
    const [selectedJob, setSelectedJob] = useState<UnifiedJob | null>(null);

    const getBadgeStyle = (type: string) => {
        switch (type?.toLowerCase()) {
            case "full-time":
                return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
            case "internship":
                return "bg-teal-50 text-teal-700 border-teal-200/60";
            case "part-time":
                return "bg-amber-50 text-amber-700 border-amber-200/60";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200/60";
        }
    };

    const getLogoGradient = (logo: string) => {
        const charCode = logo?.charCodeAt(0) || 0;
        const gradients = [
            "from-emerald-600 to-emerald-400",
            "from-teal-600 to-teal-400",
            "from-emerald-800 to-emerald-600",
            "from-teal-800 to-teal-600",
        ];
        return gradients[charCode % gradients.length];
    };

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 flex flex-col h-fit">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                        <Briefcase className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            {isLoading ? "Fetching..." : `Your Job Postings`}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Showing {totalJobs} listings • Page {currentPage} of {totalPages || 1}
                        </p>
                    </div>
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
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                                        <p className="text-sm font-medium text-slate-500">Loading your opportunities...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredJobs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            <Briefcase className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900">No job listings found</p>
                                            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                                You haven't posted any jobs yet or your current filters aren't returning any results.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                            <Button
                                                onClick={onAdd}
                                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-emerald-700/20 transition-all"
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Post New Job
                                            </Button>
                                            <button
                                                onClick={clearFilters}
                                                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-4 py-2"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredJobs.map((job) => (
                                <tr
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="group transition-all duration-200 hover:bg-slate-50/50 cursor-pointer"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${job.logo?.startsWith("http") ? "" : getLogoGradient(job.logo)} text-white text-sm font-bold shadow-sm ring-1 ring-emerald-200 transition-transform duration-300 group-hover:scale-105 overflow-hidden`}
                                            >
                                                {job.logo?.startsWith("http") ? (
                                                    <img src={job.logo} alt="Company Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    job.logo
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                                                        {job.title}
                                                    </h4>
                                                    {!job.isActive && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate">{job.company}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-fit ${getBadgeStyle(
                                                    job.type
                                                )}`}
                                            >
                                                {job.type}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-slate-400" strokeWidth={1.5} />
                                                {job.location}
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
                                                className="h-8 w-8 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg hover:shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit?.(job);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <button
                                                className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg hover:shadow-sm transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleHide?.(job);
                                                }}
                                                title={job.isActive ? "Hide from Alumni" : "Show to Alumni"}
                                            >
                                                {job.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg hover:shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete?.(job);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <button
                                                className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg hover:shadow-sm transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedJob(job);
                                                }}
                                                title="View Full Details"
                                            >
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
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
                <AdminJobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}
        </div>
    );
}
