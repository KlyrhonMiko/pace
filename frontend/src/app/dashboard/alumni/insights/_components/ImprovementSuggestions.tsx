"use client";

import { ImprovementSuggestion } from "../../_lib/api";
import { TrendingUp } from "lucide-react";

function formatFeatureName(feature: string): string {
    return feature
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getImportanceInfo(importance: number) {
    if (importance >= 0.15) {
        return { label: "High", color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200/60", dot: "bg-red-500" };
    }
    if (importance >= 0.08) {
        return { label: "Medium", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200/60", dot: "bg-amber-500" };
    }
    return { label: "Low", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200/60", dot: "bg-blue-500" };
}

function getBarColor(current: number) {
    if (current >= 75) return { from: "#059669", to: "#14b8a6" };
    if (current >= 50) return { from: "#f59e0b", to: "#fbbf24" };
    return { from: "#ef4444", to: "#f87171" };
}

export default function ImprovementSuggestions({
    suggestions,
}: {
    suggestions: ImprovementSuggestion[];
}) {
    // Sort by importance descending
    const sorted = [...suggestions].sort((a, b) => b.importance - a.importance);

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-full flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                            <TrendingUp className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Improvement Areas
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Focus areas for maximum growth
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 ring-1 ring-amber-200/80">
                        {sorted.length} areas
                    </span>
                </div>

                {/* Suggestions List */}
                <div className="space-y-3 flex-1">
                    {sorted.map((suggestion) => {
                        const importance = getImportanceInfo(suggestion.importance);
                        const barColor = getBarColor(suggestion.current);

                        return (
                            <div
                                key={suggestion.feature}
                                className="p-4 rounded-xl bg-gray-50/60 border border-gray-100/60 hover:bg-gray-50 hover:border-gray-200/60 transition-all duration-200 group"
                            >
                                {/* Header row: Feature Name + Importance Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${importance.dot} flex-shrink-0`} />
                                        <span className="text-sm font-medium text-gray-800">
                                            {formatFeatureName(suggestion.feature)}
                                        </span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${importance.bg} ${importance.color} ${importance.ring}`}
                                    >
                                        {importance.label} Impact
                                    </span>
                                </div>

                                {/* Progress Bar with target marker */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-gray-200/60 rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${Math.min(suggestion.current, 100)}%`,
                                                background: `linear-gradient(90deg, ${barColor.from}, ${barColor.to})`,
                                            }}
                                        />
                                        {/* Target marker at 75% */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-gray-300/60 rounded-full"
                                            style={{ left: "75%" }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[3rem] text-right">
                                        {suggestion.current.toFixed(0)}
                                    </span>
                                </div>

                                {/* Metrics row */}
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[11px] text-gray-400">
                                        Importance: <span className="font-medium text-gray-500">{(suggestion.importance * 100).toFixed(1)}%</span>
                                    </span>
                                    <span className="text-[11px] text-gray-400">
                                        Target: <span className="font-medium text-gray-500">75</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {sorted.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-400">No improvement suggestions available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
