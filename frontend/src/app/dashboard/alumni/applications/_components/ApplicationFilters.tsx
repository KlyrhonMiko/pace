"use client";

import { Search, Filter, X, CheckCircle2, Clock, Eye, XCircle, ChevronDown } from "lucide-react";
import { ApplicationStatus } from "./ApplicationCard";

interface ApplicationFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    onClearFilters: () => void;
    stats: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
    };
}

export default function ApplicationFilters({
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    onClearFilters,
    stats,
}: ApplicationFiltersProps) {
    const statuses = [
        { id: "All", label: "All Statuses", icon: Filter, color: "text-gray-400", bg: "bg-gray-50" },
        { id: "Pending", label: "Under Review", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
        { id: "Reviewed", label: "Reviewed", icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
        { id: "Accepted", label: "Accepted", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: "Rejected", label: "Rejected", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
    ];

    const hasActiveFilters = searchQuery !== "" || selectedStatus !== "All";

    return (
        <div className="space-y-6">
            {/* Search Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Search className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Search</h3>
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search job or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-3 pr-10 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
                    />
                    {searchQuery ? (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-emerald-400 transition-colors" />
                    )}
                </div>
            </div>

            {/* Status Filter Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <Filter className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Status</h3>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="space-y-1.5">
                    {statuses.map((status) => {
                        const isActive = selectedStatus === status.id;
                        const Icon = status.icon;

                        return (
                            <button
                                key={status.id}
                                onClick={() => setSelectedStatus(status.id)}
                                className={`
                                    group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all
                                    ${isActive
                                        ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                                `}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`
                                        flex h-7 w-7 items-center justify-center rounded-lg transition-colors
                                        ${isActive ? "bg-white/20 text-white" : `${status.bg} ${status.color} group-hover:bg-white`}
                                    `}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium">{status.label}</span>
                                </div>
                                {isActive && <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Application Tips / Helper Card */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Pro Tip</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                    Personalized resumes increase your chances of being reviewed by up to <strong>40%</strong>. Make sure your profile is 100% complete!
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-800 group cursor-pointer">
                    <span>Complete Profile</span>
                    <ChevronDown className="h-3 w-3 rotate-[-90deg] transition-transform group-hover:translate-x-1" strokeWidth={3} />
                </div>
            </div>
        </div>
    );
}
