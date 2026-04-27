"use client";

import {
    Briefcase,
    Building2,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Search,
    CircleSlash,
    FileText,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type ApplicationStatus = "Pending" | "Reviewed" | "Accepted" | "Rejected";

interface Application {
    application_ref_id: string;
    job_listing_id: string;
    job_title: string;
    company: string;
    status: ApplicationStatus;
    applied_at: string;
    logo?: string;
}

interface ApplicationListProps {
    applications: Application[];
    isLoading: boolean;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalApplications: number;
    itemsPerPage: number;
    onViewDetails?: (id: string) => void;
    searchQuery: string;
}

const STATUS_CONFIG: Record<
    ApplicationStatus,
    {
        label: string;
        bg: string;
        text: string;
        border: string;
        icon: React.ElementType;
    }
> = {
    Pending: {
        label: "Under Review",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200/60",
        icon: Clock,
    },
    Reviewed: {
        label: "Reviewed",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200/60",
        icon: Eye,
    },
    Accepted: {
        label: "Accepted",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200/60",
        icon: CheckCircle2,
    },
    Rejected: {
        label: "Rejected",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200/60",
        icon: XCircle,
    },
};

export default function ApplicationList({
    applications,
    isLoading,
    totalApplications,
    onViewDetails,
    searchQuery,
}: ApplicationListProps) {

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "—";
        }
    };

    return (
        <div className="group/card rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-lg shadow-slate-200/30 hover:shadow-xl transition-all duration-300 flex flex-col h-fit">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                        <Briefcase className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            {isLoading ? "Fetching..." : "Active Applications"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Showing <strong className="text-slate-900">{applications.length}</strong> of {totalApplications} applications
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                                        <p className="text-sm font-medium text-slate-500">Loading applications...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : applications.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            {searchQuery ? <Search className="h-8 w-8 text-emerald-600" /> : <CircleSlash className="h-8 w-8 text-emerald-600" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900">
                                                {searchQuery ? "No matching applications" : "No applications yet"}
                                            </p>
                                            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                                {searchQuery
                                                    ? `We couldn't find any applications matching "${searchQuery}".`
                                                    : "Search for job listings and apply to start tracking your progress here!"}
                                            </p>
                                            {!searchQuery && (
                                                <div className="pt-2">
                                                    <Link
                                                        href="/dashboard/alumni/jobs"
                                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95"
                                                    >
                                                        Browse Jobs
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => {
                                const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
                                const StatusIcon = config.icon;

                                return (
                                    <tr
                                        key={app.application_ref_id}
                                        className="group transition-all duration-200 hover:bg-slate-50/50 cursor-pointer"
                                        onClick={() => onViewDetails?.(app.job_listing_id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex justify-center items-center font-bold text-emerald-800 text-xs shadow-sm ring-1 ring-emerald-200 transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                                                    {app.logo ? (
                                                        <img src={app.logo} alt={app.company} className="w-full h-full object-contain" />
                                                    ) : (
                                                        app.job_title.charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-900 transition-colors">
                                                        {app.job_title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Applied {formatDate(app.applied_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                {app.company}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${config.bg} ${config.text} ${config.border}`}>
                                                <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                                    title="View Details"
                                                    onClick={(e) => { e.stopPropagation(); onViewDetails?.(app.job_listing_id); }}
                                                >
                                                    <FileText size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
