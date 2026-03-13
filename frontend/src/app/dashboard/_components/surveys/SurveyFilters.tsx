"use client";

import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { SURVEY_STATUSES } from "../../_lib/surveys";

interface SurveyFiltersProps {
    statusCounts: Record<string, number>;
    selectedStatus: string | null;
    setSelectedStatus: (status: string | null) => void;
    showAnonymousOnly: boolean;
    setShowAnonymousOnly: (show: boolean) => void;
    onClearFilters: () => void;
}

export default function SurveyFilters({
    statusCounts,
    selectedStatus,
    setSelectedStatus,
    showAnonymousOnly,
    setShowAnonymousOnly,
    onClearFilters,
}: SurveyFiltersProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        status: true,
        settings: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 sticky top-24 h-fit">
            <div className="p-6">
                {/* Header with Icon */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                            <Filter className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Filters
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Refine your surveys
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {/* Status Filter */}
                    <div className="border-b border-slate-200 last:border-b-0">
                        <button
                            onClick={() => toggleSection("status")}
                            className="flex items-center justify-between w-full py-4 text-left hover:bg-slate-50/50 transition-colors rounded-lg px-1"
                        >
                            <span className="text-sm font-semibold text-slate-800">Survey Status</span>
                            <ChevronDown
                                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSections.status ? "rotate-180" : ""}`}
                            />
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ${expandedSections.status ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0"
                                }`}
                        >
                            <div className="px-1 space-y-2">
                                {SURVEY_STATUSES.map((status) => (
                                    <label key={status} className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedStatus === status}
                                                onChange={(e) =>
                                                    setSelectedStatus(e.target.checked ? status : null)
                                                }
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-800 transition-all accent-emerald-800 cursor-pointer"
                                            />
                                            <span className="text-sm text-slate-700 font-medium">
                                                {status}
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400">
                                            ({statusCounts[status] || 0})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Settings Filter */}
                    <div className="border-b border-slate-200 last:border-b-0">
                        <button
                            onClick={() => toggleSection("settings")}
                            className="flex items-center justify-between w-full py-4 text-left hover:bg-slate-50/50 transition-colors rounded-lg px-1"
                        >
                            <span className="text-sm font-semibold text-slate-800">Settings</span>
                            <ChevronDown
                                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedSections.settings ? "rotate-180" : ""}`}
                            />
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ${expandedSections.settings ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0"
                                }`}
                        >
                            <div className="px-1 space-y-2">
                                <label className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={showAnonymousOnly}
                                            onChange={(e) => setShowAnonymousOnly(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-800 transition-all accent-emerald-800 cursor-pointer"
                                        />
                                        <span className="text-sm text-slate-700 font-medium">
                                            Anonymous Only
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClearFilters}
                        className="w-full text-center text-sm font-semibold text-emerald-800 hover:text-emerald-700 hover:bg-emerald-50 py-2.5 rounded-lg transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
