"use client";

import { Search, SlidersHorizontal, User, GraduationCap, Loader2 } from "lucide-react";
import { Input } from "../../../../../components/ui/input";
import { Button } from "../../../../../components/ui/button";
import FilterSection from "./FilterSection";
import { Checkbox } from "../../../../../components/ui/checkbox";

interface AlumniFiltersProps {
    searchQuery: string;
    handleSearch: (query: string) => void;
    filterGender: string;
    setFilterGender: (gender: string) => void;
    filterCourse: string;
    setFilterCourse: (course: string) => void;
    availableCourses: string[];
    isLoading: boolean;
    fetchAlumni: () => void;
}

export default function AlumniFilters({
    searchQuery,
    handleSearch,
    filterGender,
    setFilterGender,
    filterCourse,
    setFilterCourse,
    availableCourses,
    isLoading,
    fetchAlumni,
}: AlumniFiltersProps) {
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
                                Refine alumni records
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search name or Student ID..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                        />
                    </div>

                    {/* Gender Filter */}
                    <FilterSection title="Gender" icon={<User className="h-4 w-4" />} count={filterGender !== "all" ? 1 : undefined}>
                        <div className="space-y-2">
                            {["all", "MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"].map((gender) => (
                                <label
                                    key={gender}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <Checkbox
                                        checked={filterGender === gender}
                                        onCheckedChange={() => setFilterGender(gender)}
                                        className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                    />
                                    <span className="text-sm text-slate-700">
                                        {gender === "all" ? "All Genders" : gender.charAt(0) + gender.slice(1).toLowerCase().replace(/_/g, ' ')}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Course Filter */}
                    <FilterSection title="Course" icon={<GraduationCap className="h-4 w-4" />} count={filterCourse !== "all" ? 1 : undefined}>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            <label
                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                            >
                                <Checkbox
                                    checked={filterCourse === "all"}
                                    onCheckedChange={() => setFilterCourse("all")}
                                    className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                />
                                <span className="text-sm text-slate-700">All Courses</span>
                            </label>
                            {availableCourses.map((course) => (
                                <label
                                    key={course}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <Checkbox
                                        checked={filterCourse === course}
                                        onCheckedChange={() => setFilterCourse(course)}
                                        className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                    />
                                    <span className="text-sm text-slate-700">{course}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                </div>
            </div>
        </div>
    );
}
