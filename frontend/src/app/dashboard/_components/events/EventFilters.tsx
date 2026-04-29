"use client";

import { Search, SlidersHorizontal, Tag, Loader2 } from "lucide-react";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import FilterSection from "./FilterSection";
import { Checkbox } from "../../../../components/ui/checkbox";

interface EventFiltersProps {
    searchQuery: string;
    handleSearch: (query: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    availableTypeNames: string[];
    isLoading: boolean;
}

export default function EventFilters({
    searchQuery,
    handleSearch,
    filterType,
    setFilterType,
    availableTypeNames,
    isLoading,
}: EventFiltersProps) {
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
                                Event Filters
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Refine event visibility
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search event name..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20 rounded-xl"
                        />
                    </div>

                    {/* Event Type Filter */}
                    <FilterSection 
                        title="Event Type" 
                        icon={<Tag className="h-4 w-4" />} 
                        count={filterType !== "all" ? 1 : undefined}
                    >
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            <label
                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                            >
                                <Checkbox
                                    checked={filterType === "all"}
                                    onCheckedChange={() => setFilterType("all")}
                                    className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                />
                                <span className="text-sm text-slate-700">All Types</span>
                            </label>
                            {availableTypeNames.map((type) => (
                                <label
                                    key={type}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <Checkbox
                                        checked={filterType === type}
                                        onCheckedChange={() => setFilterType(type)}
                                        className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                    />
                                    <span className="text-sm text-slate-700">{type}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                </div>
            </div>
        </div>
    );
}
