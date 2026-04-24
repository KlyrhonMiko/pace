"use client";

import {
    Users,
    Mail,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Loader2,
    Briefcase,
    Calendar,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Application {
    id: number;
    applicant: string;
    job: string;
    status: string;
    date: string;
    email: string;
    matchScore: number;
}

interface EmployerApplicationListProps {
    applications: Application[];
    isLoading: boolean;
    totalApplications: number;
}

export default function EmployerApplicationList({
    applications,
    isLoading,
    totalApplications,
}: EmployerApplicationListProps) {
    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "new":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "review":
                return "bg-amber-50 text-amber-800 border-amber-200";
            case "interviewing":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "rejected":
                return "bg-rose-50 text-rose-700 border-rose-200";
            default:
                return "bg-gray-50 text-gray-600 border-gray-200";
        }
    };

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 flex flex-col h-fit">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                        <Users className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            {isLoading ? "Fetching..." : `Candidate Pipeline`}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {totalApplications} total applications under review
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Role</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Match Score</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                                        <p className="text-sm font-medium text-slate-500">Loading applications...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : applications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            <Users className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900">No applications found</p>
                                            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                                Adjust your filters or wait for new candidates to apply to your postings.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id} className="group transition-all duration-200 hover:bg-slate-50/50 cursor-pointer">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex justify-center items-center font-bold text-emerald-800 text-xs shadow-sm ring-1 ring-emerald-200 transition-transform duration-300 group-hover:scale-105">
                                                {app.applicant.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-900 transition-colors">
                                                    {app.applicant}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[11px] text-slate-400 truncate">{app.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                                {app.job}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                Applied {app.date}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${app.matchScore >= 80 ? 'bg-emerald-500' : app.matchScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${app.matchScore}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600">{app.matchScore}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-fit ${getStatusStyle(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg hover:shadow-sm"
                                                title="Contact Candidate"
                                            >
                                                <Mail size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg hover:shadow-sm"
                                                title="Approve"
                                            >
                                                <CheckCircle size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg hover:shadow-sm"
                                                title="Reject"
                                            >
                                                <XCircle size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                                title="More Options"
                                            >
                                                <MoreHorizontal size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
