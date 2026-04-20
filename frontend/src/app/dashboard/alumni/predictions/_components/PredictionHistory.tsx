"use client";

import { History, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { RegressionPrediction } from "../_lib/api";

// ── Helpers ─────────────────────────────────────────────────────

function formatPHP(value: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

const bandColors: Record<string, string> = {
    High: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    Mid: "text-amber-700 bg-amber-50 border-amber-200/60",
    Low: "text-red-600 bg-red-50 border-red-200/60",
};

const outlookColors: Record<string, string> = {
    Short: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    Moderate: "text-amber-700 bg-amber-50 border-amber-200/60",
    Long: "text-red-600 bg-red-50 border-red-200/60",
};

// ── Component ───────────────────────────────────────────────────

export default function PredictionHistory({
    predictions,
}: {
    predictions: RegressionPrediction[];
}) {
    if (!predictions || predictions.length === 0) {
        return null;
    }

    // Skip the first (latest) one since it's already shown above
    const pastPredictions = predictions.slice(1);

    if (pastPredictions.length === 0) {
        return null;
    }

    return (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                            <History className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Prediction History
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Your previous career predictions
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 px-2.5 py-1 bg-gray-50 rounded-full">
                        {pastPredictions.length} past
                    </span>
                </div>

                {/* Prediction list */}
                <div className="space-y-3">
                    {pastPredictions.map((pred) => (
                        <div
                            key={pred.id}
                            className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100/60 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                        >
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs text-gray-400">
                                        {timeAgo(pred.created_at)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Salary */}
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                            {formatPHP(pred.predicted_salary)}
                                        </span>
                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bandColors[pred.salary_band] || bandColors.Mid
                                                }`}
                                        >
                                            {pred.salary_band}
                                        </span>
                                    </div>

                                    <span className="text-gray-300">·</span>

                                    {/* Duration */}
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700 tabular-nums">
                                            {pred.predicted_duration_weeks.toFixed(1)}w
                                        </span>
                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${outlookColors[pred.search_outlook] || outlookColors.Moderate
                                                }`}
                                        >
                                            {pred.search_outlook}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
