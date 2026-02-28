"use client";

import { ImprovementSuggestion } from "../../_lib/api";
import { BarChart3 } from "lucide-react";

function formatFeatureName(feature: string): string {
    return feature
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getScoreColor(value: number): {
    bg: string;
    fill: string;
    text: string;
    badge: string;
    badgeText: string;
} {
    if (value >= 75)
        return {
            bg: "bg-emerald-50",
            fill: "from-emerald-500 to-teal-400",
            text: "text-emerald-700",
            badge: "bg-emerald-50 ring-emerald-200/60",
            badgeText: "text-emerald-700",
        };
    if (value >= 50)
        return {
            bg: "bg-amber-50",
            fill: "from-amber-500 to-yellow-400",
            text: "text-amber-700",
            badge: "bg-amber-50 ring-amber-200/60",
            badgeText: "text-amber-700",
        };
    return {
        bg: "bg-red-50",
        fill: "from-red-500 to-rose-400",
        text: "text-red-600",
        badge: "bg-red-50 ring-red-200/60",
        badgeText: "text-red-600",
    };
}

export default function SkillBreakdown({
    suggestions,
}: {
    suggestions: ImprovementSuggestion[];
}) {
    const sorted = [...suggestions]
        .sort((a, b) => b.current - a.current)
        .slice(0, 10);

    const maxValue = Math.max(...sorted.map((s) => s.current), 100);

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-full flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                            <BarChart3 className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Skill Breakdown
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Current skill levels at a glance
                            </p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-2">
                        {[
                            { label: "75+", color: "bg-emerald-500" },
                            { label: "50–74", color: "bg-amber-500" },
                            { label: "<50", color: "bg-red-500" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 ring-1 ring-gray-100/80"
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${item.color}`}
                                />
                                <span className="text-[10px] font-medium text-gray-500">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skills List */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                    {sorted.map((suggestion, index) => {
                        const pct = (suggestion.current / maxValue) * 100;
                        const colors = getScoreColor(suggestion.current);

                        return (
                            <div
                                key={suggestion.feature}
                                className="group relative flex flex-col gap-1.5 py-1.5 px-3 rounded-xl transition-all duration-200 hover:bg-gray-50/80"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Rank */}
                                        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-50/80 border border-gray-100 flex-shrink-0 group-hover:bg-white transition-colors duration-200">
                                            <span className="text-[10px] font-bold text-gray-500 tabular-nums tracking-wide">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                        </div>

                                        {/* Skill Name */}
                                        <span className="text-sm font-semibold text-gray-700 truncate pr-2">
                                            {formatFeatureName(suggestion.feature)}
                                        </span>
                                    </div>

                                    {/* Score Badge */}
                                    <div className={`flex items-center justify-center px-1.5 py-0.5 rounded-md ring-1 shadow-sm ${colors.badge} flex-shrink-0`}>
                                        <span className={`text-[11px] font-bold tabular-nums ${colors.badgeText}`}>
                                            {suggestion.current.toFixed(0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Bar Track */}
                                <div className="ml-9 mr-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${colors.fill} transition-all duration-1000 ease-out`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {sorted.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                            <BarChart3 className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            No skill data available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
