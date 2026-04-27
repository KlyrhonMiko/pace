"use client";

import { Search, Filter, X, CheckCircle2, Clock, Eye, XCircle, SlidersHorizontal } from "lucide-react";
import { ApplicationStatus } from "./ApplicationList";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FilterSection from "../../jobs/_components/FilterSection";

interface ApplicationFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    onClearFilters?: () => void;
}

export default function ApplicationFilters({
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
}: ApplicationFiltersProps) {
    const statuses = [
        { id: "All", label: "All Statuses", icon: Filter },
        { id: "Pending", label: "Under Review", icon: Clock },
        { id: "Reviewed", label: "Reviewed", icon: Eye },
        { id: "Accepted", label: "Accepted", icon: CheckCircle2 },
        { id: "Rejected", label: "Rejected", icon: XCircle },
    ];

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-fit">
            <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Filters
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Refine your applications
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search applications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20 shadow-none border"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <FilterSection
                        title="Status"
                        count={selectedStatus !== "All" ? 1 : undefined}
                    >
                        <div className="space-y-1">
                            {statuses.map((status) => {
                                const isActive = selectedStatus === status.id;
                                const Icon = status.icon;

                                return (
                                    <label
                                        key={status.id}
                                        className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 group/row"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={isActive}
                                                onCheckedChange={() => setSelectedStatus(status.id)}
                                                className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                            />
                                            <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400 group-hover/row:text-slate-600"}`} />
                                            <span className={`text-sm transition-colors ${isActive ? "text-emerald-900 font-semibold" : "text-slate-700 font-medium"}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </FilterSection>
                </div>
            </div>
        </div>
    );
}
