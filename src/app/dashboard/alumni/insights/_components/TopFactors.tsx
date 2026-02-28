"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

const rankColors = [
    { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200/60", dot: "from-emerald-500 to-teal-400", barBg: "bg-emerald-100" },
    { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200/60", dot: "from-blue-500 to-indigo-400", barBg: "bg-blue-100" },
    { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200/60", dot: "from-violet-500 to-purple-400", barBg: "bg-violet-100" },
    { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200/60", dot: "from-amber-500 to-orange-400", barBg: "bg-amber-100" },
    { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200/60", dot: "from-rose-500 to-pink-400", barBg: "bg-rose-100" },
];

function formatFactorName(factor: string): string {
    return factor
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TopFactors({ factors }: { factors: string[] }) {
    // Simulate decreasing importance weights for visual impact
    const weights = factors.map((_, i) => Math.max(100 - i * 15, 25));

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-full flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                            <BarChart3 className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Top Contributing Factors
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                What influences your score the most
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600 ring-1 ring-violet-200/80">
                        {factors.length} factors
                    </span>
                </div>

                {/* Factor List */}
                <div className="space-y-2.5 flex-1">
                    {factors.map((factor, index) => {
                        const color = rankColors[index % rankColors.length];
                        const weight = weights[index];
                        return (
                            <div
                                key={factor}
                                className={`flex items-center gap-3.5 p-3.5 rounded-xl ${color.bg} border border-transparent hover:border-gray-200/60 transition-all duration-200 group`}
                            >
                                {/* Rank Badge */}
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color.dot} text-white text-xs font-bold shadow-sm flex-shrink-0`}
                                >
                                    {index + 1}
                                </div>

                                {/* Factor Name + Importance Bar */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-800 block truncate">
                                        {formatFactorName(factor)}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className={`h-1.5 rounded-full ${color.barBg} flex-1 overflow-hidden`}>
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${color.dot} transition-all duration-700 ease-out`}
                                                style={{ width: `${weight}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-400 tabular-nums flex-shrink-0">
                                            {weight}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {factors.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-400">No factors data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
