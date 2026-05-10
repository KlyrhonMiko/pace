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
    Video,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export type ApplicationStatus = "Pending" | "Reviewed" | "Interview" | "Accepted" | "Rejected";

interface Application {
    application_ref_id: string;
    job_listing_id: string;
    job_title: string;
    company: string;
    status: ApplicationStatus;
    applied_at: string;
    logo?: string;
    interview_date?: string | null;
    interview_link?: string | null;
    job_deleted?: boolean;
}

interface ApplicationListProps {
    applications: Application[];
    isLoading: boolean;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalApplications: number;
    itemsPerPage: number;
    onViewDetails?: (id: string, jobDeleted?: boolean) => void;
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
    Interview: {
        label: "Interviewing",
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200/60",
        icon: Calendar,
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

    const getLogoGradient = (logo: string) => {
        const charCode = logo.charCodeAt(0);
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
                            <>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${(i - 1) * 80}ms`, animationFillMode: 'both' }}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-xl flex-shrink-0 skeleton-shimmer" style={{
                                                    background: 'linear-gradient(135deg, hsl(160 40% 92%) 0%, hsl(150 30% 88%) 100%)'
                                                }}>
                                                    <div className="skeleton-shimmer h-full w-full rounded-xl" />
                                                </div>
                                                <div className="min-w-0 space-y-1.5">
                                                    <Skeleton className="h-[13px] w-36 rounded-md" />
                                                    <Skeleton className="h-[11px] w-24 rounded" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5">
                                                <Skeleton className="h-3.5 w-3.5 rounded" />
                                                <Skeleton className="h-[12px] w-28 rounded" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="h-[22px] w-24 rounded-full" />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </>
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
                                const interviewDate = app.interview_date ? new Date(app.interview_date) : null;
                                const isInterviewPast = interviewDate ? interviewDate.getTime() < Date.now() : false;
                                const showInterview = !!interviewDate && app.status !== "Rejected" && app.status !== "Accepted";
                                const isDeleted = app.job_deleted === true;

                                return (
                                    <tr
                                        key={app.application_ref_id}
                                        className={`group transition-all duration-200 align-middle ${isDeleted ? "bg-slate-50 text-slate-400" : "hover:bg-slate-50/50 cursor-pointer"}`}
                                        onClick={() => {
                                            if (!isDeleted) {
                                                onViewDetails?.(app.job_listing_id, app.job_deleted);
                                            }
                                        }}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${(app.logo && (app.logo.startsWith('http') || app.logo.startsWith('/'))) ? 'bg-gray-50' : `bg-gradient-to-br ${isDeleted ? "from-slate-300 to-slate-400" : getLogoGradient(app.logo || app.job_title)}`} ${isDeleted ? "text-slate-100 ring-slate-200" : "text-white ring-emerald-200"} text-sm font-bold shadow-sm transition-transform duration-300 overflow-hidden flex ${isDeleted ? "" : "group-hover:scale-105 group-hover:shadow-md"}` }>
                                                    {app.logo ? (
                                                        <img src={app.logo} alt={app.company} className={`h-full w-full object-contain ${isDeleted ? "opacity-50 grayscale" : ""}`} />
                                                    ) : (
                                                        (app.logo || app.job_title).charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold text-sm line-clamp-1 transition-colors ${isDeleted ? "text-slate-500" : "text-slate-900 group-hover:text-emerald-900"}`}>
                                                        {app.job_title}
                                                    </h4>
                                                    {isDeleted && (
                                                        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                            <CircleSlash className="h-3 w-3" strokeWidth={2.5} />
                                                            Deleted by employer
                                                        </div>
                                                    )}
                                                    {showInterview && interviewDate ? (
                                                        <div className={`flex items-center gap-1.5 text-[11px] mt-1 ${isDeleted ? "text-slate-400" : "font-semibold text-emerald-700"}`}>
                                                            <Calendar className="h-3 w-3" strokeWidth={2.5} />
                                                            <span>Interview {format(interviewDate, "MMM d")}</span>
                                                            <span className={isDeleted ? "text-slate-300" : "text-emerald-300"}>·</span>
                                                            <Clock className="h-3 w-3" strokeWidth={2.5} />
                                                            <span className="tabular-nums">{format(interviewDate, "h:mm a")}</span>
                                                        </div>
                                                    ) : interviewDate && isInterviewPast ? (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>Interviewed {format(interviewDate, "MMM d")}</span>
                                                            <span className="text-slate-300">·</span>
                                                            <span className="tabular-nums">{format(interviewDate, "h:mm a")}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Applied {formatDate(app.applied_at)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`flex items-center gap-1.5 text-sm font-medium ${isDeleted ? "text-slate-500" : "text-slate-700"}`}>
                                                <Building2 className={`h-3.5 w-3.5 ${isDeleted ? "text-slate-300" : "text-slate-400"}`} />
                                                {app.company}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border w-fit ${config.bg} ${config.text} ${config.border}`}>
                                                <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right align-middle">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-8 w-8 rounded-lg transition-opacity ${isDeleted ? "text-slate-300 cursor-not-allowed opacity-100" : "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer opacity-0 group-hover:opacity-100"}`}
                                                    title={isDeleted ? "Job no longer available" : "View Details"}
                                                    disabled={isDeleted}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isDeleted) {
                                                            onViewDetails?.(app.job_listing_id, app.job_deleted);
                                                        }
                                                    }}
                                                >
                                                    <FileText size={14} />
                                                </Button>
                                                {showInterview && app.interview_link && !isDeleted && (
                                                    <a
                                                        href={app.interview_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95"
                                                        title="Join interview"
                                                    >
                                                        <Video className="h-3 w-3" strokeWidth={3} />
                                                        Join
                                                        <ArrowUpRight className="h-3 w-3" strokeWidth={3} />
                                                    </a>
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
        </div>
    );
}
