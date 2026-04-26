"use client";

import { Fragment } from "react";
import {
    Edit2,
    Trash2,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    User,
    Briefcase,
    RefreshCw,
    GraduationCap,
    TrendingUp,
    MapPin,
    DollarSign,
    Award,
    Loader2
} from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Alumni } from "./useAlumniManagement";

// ─── Utility: Deterministic Avatar Color ──────────────────────────────────────
const getAvatarColor = (name: string) => {
    const colors = [
        "from-blue-100 to-blue-200 text-blue-700",
        "from-emerald-100 to-emerald-200 text-emerald-700",
        "from-violet-100 to-violet-200 text-violet-700",
        "from-amber-100 to-amber-200 text-amber-700",
        "from-pink-100 to-pink-200 text-pink-700",
        "from-indigo-100 to-indigo-200 text-indigo-700",
        "from-rose-100 to-rose-200 text-rose-700",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
};

// ─── Employment Status Badge ──────────────────────────────────────────────────

function EmploymentStatusBadge({ status }: { status: string | null }) {
    const config: Record<string, { bg: string; text: string; dot: string }> = {
        Employed: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
        Interviewing: { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
        Searching: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
        "Not Looking": { bg: "bg-slate-50 text-slate-600 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
    };
    const c = config[status ?? "Searching"] ?? { bg: "bg-slate-50 text-slate-600 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${c.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {status ?? "Unknown"}
        </span>
    );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-md">
            <span className="text-[13px] font-medium text-slate-500">{label}</span>
            <span className="text-[13px] font-semibold text-slate-900 text-right max-w-[60%] truncate">
                {value ?? <span className="text-slate-300 font-normal">Not specified</span>}
            </span>
        </div>
    );
}

interface AlumniListProps {
    alumni: Alumni[];
    isLoading: boolean;
    error: string | null;
    expandedRows: Set<string>;
    toggleExpand: (alumniId: string) => void;
    openEditModal: (targetAlumni: Alumni) => void;
    handleDeleteClick: (alumniId: string) => void;
    fetchAlumni: () => void;
}

export default function AlumniList({
    alumni,
    isLoading,
    error,
    expandedRows,
    toggleExpand,
    openEditModal,
    handleDeleteClick,
    fetchAlumni,
}: AlumniListProps) {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 flex flex-col h-full">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <GraduationCap className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            Alumni Directory
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage and track records ({alumni.length})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchAlumni}
                        className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-white bg-slate-50 border-slate-200/80 transition-all rounded-xl shadow-sm hover:shadow"
                        disabled={isLoading}
                        title="Refresh data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-5 py-3 w-12 font-medium text-xs text-slate-400"></th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Alumni Details</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading directory...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center">
                                            <AlertTriangle className="h-7 w-7 text-rose-500" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">Failed to load data</p>
                                        <p className="text-sm text-slate-500 max-w-sm">{error}</p>
                                        <Button
                                            variant="outline"
                                            onClick={fetchAlumni}
                                            className="mt-2 rounded-lg text-xs h-8 font-bold text-slate-600 border-slate-200"
                                        >
                                            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ) : alumni.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                            <User className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500">No alumni records found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            alumni.map((record) => {
                                const isExpanded = expandedRows.has(record.alumni_id);
                                const hasStudent = record.student !== null;
                                const avatarColor = getAvatarColor(record.first_name + record.last_name);

                                return (
                                    <Fragment key={record.alumni_id}>
                                        <tr className={`group transition-all duration-200 hover:bg-slate-50/50 ${isExpanded ? "bg-slate-50/50" : ""}`}>
                                            <td className="px-5 py-4">
                                                {hasStudent ? (
                                                    <button
                                                        onClick={() => toggleExpand(record.alumni_id)}
                                                        className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-200 text-slate-700 shadow-inner' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                                                    >
                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </button>
                                                ) : (
                                                    <div className="p-1.5 opacity-30">
                                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} font-bold text-sm shadow-sm ring-1 ring-black/5`}>
                                                        {record.first_name[0]}{record.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                            {record.last_name}, {record.first_name}
                                                        </h4>
                                                        {hasStudent ? (
                                                            <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                                                                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                                                {record.student!.course} <span className="opacity-50">•</span> Class of {record.student!.year_graduated}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                No Academic Data
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200/80 shadow-sm px-2.5 py-1 rounded-md">
                                                    {record.student?.student_id || record.alumni_id}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(record)}
                                                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg hover:shadow-sm"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(record.alumni_id)}
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg hover:shadow-sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && hasStudent && (
                                            <tr className="bg-slate-50/50 border-b border-slate-200/60 shadow-inner">
                                                <td colSpan={4} className="p-0 border-none">
                                                    <div className="px-6 py-6 pl-[4.5rem] relative overflow-hidden">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-4xl">

                                                            {/* Employment Section */}
                                                            <div>
                                                                <h4 className="flex items-center gap-2.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                                                                    <div className="p-1 rounded-md bg-blue-100/80 text-blue-600">
                                                                        <Briefcase className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    Employment Overview
                                                                </h4>
                                                                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4">
                                                                    <DetailRow label="Current Status" value={<EmploymentStatusBadge status={record.employment_status} />} />
                                                                    <DetailRow label="Sector / Industry" value={record.employment_sector} />
                                                                    <DetailRow label="Est. Salary" value={record.salary_package !== null ? `₱${record.salary_package.toLocaleString()}` : null} />
                                                                    <DetailRow label="Offers Received" value={record.offers_received} />
                                                                </div>
                                                            </div>

                                                            {/* Academic Section */}
                                                            <div>
                                                                <h4 className="flex items-center gap-2.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                                                                    <div className="p-1 rounded-md bg-indigo-100/80 text-indigo-600">
                                                                        <GraduationCap className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    Academic Standing
                                                                </h4>
                                                                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4">
                                                                    <DetailRow label="Student ID Number" value={record.student!.student_id} />
                                                                    <DetailRow label="General Weighted Avg" value={record.student!.gwa.toFixed(2)} />
                                                                    <DetailRow label="Proficiency Grade" value={record.student!.avg_prof_grade?.toFixed(2) ?? null} />
                                                                    <DetailRow label="Practicum (OJT) Grade" value={record.student!.ojt_grade} />
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}</Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

