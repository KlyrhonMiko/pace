"use client";

import { Search, SlidersHorizontal, Briefcase, Target, Clock, CheckCircle, XCircle, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FilterSection from "./FilterSection";

interface ApplicationFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedJobs: string[];
    setSelectedJobs: (jobs: string[]) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (statuses: string[]) => void;
    jobList?: string[];
}

export default function ApplicationFilters({
    searchQuery,
    setSearchQuery,
    selectedJobs,
    setSelectedJobs,
    selectedStatuses,
    setSelectedStatuses,
    jobList = [],
}: ApplicationFiltersProps) {
    const toggleJob = (job: string) => {
        if (selectedJobs.includes(job)) {
            setSelectedJobs(selectedJobs.filter((j) => j !== job));
        } else {
            setSelectedJobs([...selectedJobs, job]);
        }
    };

    const toggleStatus = (status: string) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    const statusOptions = [
        { label: "Pending", icon: <Clock className="h-4 w-4 text-blue-500" /> },
        { label: "Interview", icon: <Target className="h-4 w-4 text-indigo-500" /> },
        { label: "Accepted", icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
        { label: "Rejected", icon: <XCircle className="h-4 w-4 text-rose-500" /> },
    ];

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6 pb-3">
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
                                Refine candidate search
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                        <Input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                        />
                    </div>

                    <FilterSection
                        title="Job Posting"
                        icon={<Briefcase className="h-4 w-4" />}
                        count={selectedJobs.length || undefined}
                    >
                        <div className="space-y-2">
                            {jobList.length === 0 ? (
                                <p className="text-xs text-slate-400 py-2 px-1 italic">No job postings found</p>
                            ) : jobList.map((job) => (
                                <label
                                    key={job}
                                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedJobs.includes(job)}
                                            onCheckedChange={() => toggleJob(job)}
                                            className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                        />
                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-700">{job}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    <FilterSection
                        title="Application Status"
                        icon={<Target className="h-4 w-4" />}
                        count={selectedStatuses.length || undefined}
                    >
                        <div className="space-y-1">
                            {statusOptions.map((status) => (
                                <label
                                    key={status.label}
                                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedStatuses.includes(status.label)}
                                            onCheckedChange={() => toggleStatus(status.label)}
                                            className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                                        />
                                        {status.icon}
                                        <span className="text-sm text-slate-700">{status.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                </div>
            </div>
        </div>
    );
}
