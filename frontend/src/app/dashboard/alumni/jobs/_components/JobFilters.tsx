"use client";

import { Search, MapPin, Briefcase, Home, RefreshCw, Building2, GraduationCap, SlidersHorizontal, Sparkles } from "lucide-react";
import { Input } from "../../../../../components/ui/input";
import { Checkbox } from "../../../../../components/ui/checkbox";
import { Slider } from "../../../../../components/ui/slider";
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
    localOnly: boolean;
    setLocalOnly: (local: boolean) => void;
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
    localOnly,
    setLocalOnly,
}: JobFiltersProps) {

    const toggleFilter = (filterArray: string[], setFilter: (val: string[]) => void, value: string) => {
        if (filterArray.includes(value)) {
            setFilter(filterArray.filter((item) => item !== value));
        } else {
            setFilter([...filterArray, value]);
        }
    };

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
                                Refine your job search
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
                            {jobTypes.map((type) => (
                                <label
                                    key={type}
                                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
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
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Work Type */}
                    <FilterSection title="Work Type" count={selectedWorkTypes.length || undefined}>
                        <div className="space-y-2">
                            {workTypes.map((workType) => {
                                const IconComponent = workType === "Remote" ? Home : workType === "Hybrid" ? RefreshCw : Building2;
                                return (
                                    <label
                                        key={workType}
                                        className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
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
                                    </label>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {/* Experience Level */}
                    <FilterSection title="Experience Level" count={selectedExperience.length || undefined}>
                        <div className="space-y-2">
                            {experienceLevels.map((level) => (
                                <label
                                    key={level}
                                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
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
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Preferences / Special Filters */}
                    <FilterSection title="Preferences">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <Checkbox
                                    id="localOnly"
                                    checked={localOnly}
                                    onCheckedChange={(checked) => setLocalOnly(checked as boolean)}
                                    className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                />
                                <label
                                    htmlFor="localOnly"
                                    className="text-sm text-slate-700 cursor-pointer select-none font-medium"
                                >
                                    Platform Jobs Only
                                </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
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
                        </div>
                    </FilterSection>

                    {/* Salary Range */}
                    <FilterSection title="Salary Range">
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
