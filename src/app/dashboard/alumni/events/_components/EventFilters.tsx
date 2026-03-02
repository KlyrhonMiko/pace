"use client";

import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";

interface EventFiltersProps {
    eventTypes: { id: string; label: string; count: number }[];
    selectedType: string | null;
    setSelectedType: (type: string | null) => void;
    showRegisteredOnly: boolean;
    setShowRegisteredOnly: (show: boolean) => void;
    onClearFilters: () => void;
}

export default function EventFilters({
    eventTypes,
    selectedType,
    setSelectedType,
    showRegisteredOnly,
    setShowRegisteredOnly,
    onClearFilters,
}: EventFiltersProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        type: true,
        status: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="rounded-2xl bg-gradient-to-b from-white to-slate-50/50 border border-slate-200/80 p-6 shadow-lg shadow-slate-200/30 h-fit backdrop-blur-sm">
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/50">
                        <Filter className="h-5 w-5 text-emerald-800" strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
                </div>
                <button
                    onClick={onClearFilters}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-700 transition-all px-2.5 py-1.5 hover:bg-emerald-50/80 rounded-lg border border-emerald-200/0 hover:border-emerald-200/50"
                >
                    Reset
                </button>
            </div>

            {/* Event Type Filter */}
            <div className="mb-6 pb-6 border-b border-slate-200/60">
                <button
                    onClick={() => toggleSection("type")}
                    className="flex w-full items-center justify-between mb-3 hover:text-emerald-700 transition-all group"
                >
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">Event Type</h4>
                    <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.type ? "rotate-180" : ""}`}
                        strokeWidth={2}
                    />
                </button>

                {expandedSections.type && (
                    <div className="space-y-2.5">
                        {eventTypes.map((type) => (
                            <label key={type.id} className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-emerald-50/50 transition-all">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedType === type.label}
                                        onChange={(e) =>
                                            setSelectedType(e.target.checked ? type.label : null)
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-800 transition-all accent-emerald-800 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors flex-1 font-medium">
                                    {type.label}
                                </span>
                                <span className="text-xs text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full group-hover:bg-emerald-100/60 group-hover:text-emerald-700 transition-all font-semibold">
                                    {type.count}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Filter */}
            <div className="mb-0">
                <button
                    onClick={() => toggleSection("status")}
                    className="flex w-full items-center justify-between mb-3 hover:text-emerald-700 transition-all group"
                >
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">Status</h4>
                    <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.status ? "rotate-180" : ""}`}
                        strokeWidth={2}
                    />
                </button>

                {expandedSections.status && (
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-emerald-50/50 transition-all">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showRegisteredOnly}
                                    onChange={(e) => setShowRegisteredOnly(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-800 transition-all accent-emerald-800 cursor-pointer"
                                />
                            </div>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors flex-1 font-medium">
                                My Registrations
                            </span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
