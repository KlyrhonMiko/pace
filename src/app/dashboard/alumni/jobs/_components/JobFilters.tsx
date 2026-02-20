"use client";

import { Search, MapPin, Briefcase, Home, RefreshCw, Building2, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import FilterSection from "./FilterSection";
import { jobTypes, experienceLevels, workTypes } from "./constants";

interface JobFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    locationSearch: string;
    setLocationSearch: (query: string) => void;
    selectedTypes: string[];
    setSelectedTypes: (types: string[]) => void;
    selectedWorkTypes: string[];
    setSelectedWorkTypes: (types: string[]) => void;
    selectedExperience: string[];
    setSelectedExperience: (levels: string[]) => void;
    tempSalaryRange: [number, number];
    setTempSalaryRange: (range: [number, number]) => void;

    hasSalary: boolean;
    setHasSalary: (has: boolean) => void;
    getFilterCounts: (type: string, option: string) => number;
}

export default function JobFilters({
    searchQuery,
    setSearchQuery,
    locationSearch,
    setLocationSearch,
    selectedTypes,
    setSelectedTypes,
    selectedWorkTypes,
    setSelectedWorkTypes,
    selectedExperience,
    setSelectedExperience,
    tempSalaryRange,
    setTempSalaryRange,

    hasSalary,
    setHasSalary,
    getFilterCounts,
}: JobFiltersProps) {

    const toggleFilter = (filterArray: string[], setFilter: (val: string[]) => void, value: string) => {
        if (filterArray.includes(value)) {
            setFilter(filterArray.filter((item) => item !== value));
        } else {
            setFilter([...filterArray, value]);
        }
    };

    return (
        <div className="relative rounded-2xl bg-white border border-slate-400/50 p-6 shadow-lg shadow-slate-300/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Texture */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.012]"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 5px,
                                    rgba(0,0,0,0.03) 5px,
                                    rgba(0,0,0,0.03) 6px
                                )`,
                }}
            />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                </div>

                <div className="space-y-1">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                        />
                    </div>

                    {/* Location */}
                    <FilterSection title="Location" count={locationSearch ? 1 : undefined}>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="City, state, or zip code"
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                            />

                        </div>
                    </FilterSection>

                    {/* Job Type */}
                    <FilterSection title="Job Type" count={selectedTypes.length || undefined}>
                        <div className="space-y-2">
                            {jobTypes.map((type) => {
                                const count = getFilterCounts("type", type);
                                return (
                                    <label
                                        key={type}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedTypes.includes(type)}
                                                onCheckedChange={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                                                className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                            />
                                            <Briefcase className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-700">{type}</span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400">({count})</span>
                                    </label>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {/* Work Type */}
                    <FilterSection title="Work Type" count={selectedWorkTypes.length || undefined}>
                        <div className="space-y-2">
                            {workTypes.map((workType) => {
                                const count = getFilterCounts("workType", workType);
                                const IconComponent = workType === "Remote" ? Home : workType === "Hybrid" ? RefreshCw : Building2;
                                return (
                                    <label
                                        key={workType}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedWorkTypes.includes(workType)}
                                                onCheckedChange={() => toggleFilter(selectedWorkTypes, setSelectedWorkTypes, workType)}
                                                className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                            />
                                            <IconComponent className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-700">{workType}</span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400">({count})</span>
                                    </label>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {/* Experience Level */}
                    <FilterSection title="Experience Level" count={selectedExperience.length || undefined}>
                        <div className="space-y-2">
                            {experienceLevels.map((level) => {
                                const count = getFilterCounts("experience", level);
                                return (
                                    <label
                                        key={level}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedExperience.includes(level)}
                                                onCheckedChange={() => toggleFilter(selectedExperience, setSelectedExperience, level)}
                                                className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                            />
                                            <GraduationCap className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-700">{level}</span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400">({count})</span>
                                    </label>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {/* Salary Range */}
                    <FilterSection title="Salary Range">
                        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <Checkbox
                                id="hasSalary"
                                checked={hasSalary}
                                onCheckedChange={(checked) => setHasSalary(checked as boolean)}
                                className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                            />
                            <label
                                htmlFor="hasSalary"
                                className="text-sm text-slate-700 cursor-pointer select-none font-medium"
                            >
                                With Salary Info
                            </label>
                        </div>
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 mb-1">Min Salary</span>
                                    <span className="font-semibold text-slate-900">₱{tempSalaryRange[0]}k</span>
                                </div>
                                <div className="flex-1 mx-3 border-t border-slate-200" />
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-slate-500 mb-1">Max Salary</span>
                                    <span className="font-semibold text-slate-900">₱{tempSalaryRange[1]}k</span>
                                </div>
                            </div>
                            <Slider
                                value={tempSalaryRange}
                                onValueChange={(value) => setTempSalaryRange(value as [number, number])}
                                min={0}
                                max={500}
                                step={5}
                                className="[&_[data-slot=slider-track]]:bg-slate-200 [&_[data-slot=slider-range]]:bg-emerald-700 [&_[data-slot=slider-thumb]]:border-emerald-700 [&_[data-slot=slider-thumb]]:hover:ring-emerald-200"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>₱0k</span>
                                <span>₱500k+</span>
                            </div>
                        </div>
                    </FilterSection>
                </div>
            </div>
        </div>
    );
}
