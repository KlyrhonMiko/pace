"use client";

import { Search, SlidersHorizontal, Shield, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FilterSection from "./FilterSection";

interface UserFiltersProps {
    searchQuery: string;
    handleSearch: (query: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    isLoading: boolean;
}

export default function UserFilters({
    searchQuery,
    handleSearch,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
}: UserFiltersProps) {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6">
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
                                Refine user records
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search name, email, ID..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20 shadow-sm"
                        />
                    </div>

                    {/* Role Filter */}
                    <FilterSection title="System Role" icon={<Shield className="h-4 w-4" />} count={filterType !== "all" ? 1 : undefined}>
                        <div className="space-y-2">
                            {[
                                { id: "all", label: "All Roles" },
                                { id: "ADMIN", label: "Admin" },
                                { id: "STAFF", label: "Faculty" },
                                { id: "EMPLOYER", label: "Employer" },
                                { id: "USER", label: "Alumni" },
                            ].map((role) => (
                                <label
                                    key={role.id}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <Checkbox
                                        checked={filterType === role.id}
                                        onCheckedChange={() => setFilterType(role.id)}
                                        className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                    />
                                    <span className="text-sm text-slate-700 font-medium">
                                        {role.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Status Filter */}
                    <FilterSection title="Account Status" icon={<Activity className="h-4 w-4" />} count={filterStatus !== "all" ? 1 : undefined}>
                        <div className="space-y-2">
                            {[
                                { id: "all", label: "All Status" },
                                { id: "active", label: "Active" },
                                { id: "inactive", label: "Inactive" },
                            ].map((status) => (
                                <label
                                    key={status.id}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <Checkbox
                                        checked={filterStatus === status.id}
                                        onCheckedChange={() => setFilterStatus(status.id)}
                                        className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                    />
                                    <span className="text-sm text-slate-700 font-medium">
                                        {status.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                </div>
            </div>
        </div>
    );
}
