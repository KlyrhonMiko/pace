"use client";

import { useEffect, useState } from "react";
import { History, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { getPredictionHistory, PredictionHistoryItem } from "../../_lib/api";

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(iso));
}

function ResultBadge({ prediction }: { prediction: string }) {
    const isEmployable = prediction === "Employable";
    return (
        <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${
                isEmployable
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
                    : "bg-red-50 text-red-600 ring-red-200/80"
            }`}
        >
            {isEmployable ? (
                <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />
            ) : (
                <TrendingDown className="h-2.5 w-2.5" strokeWidth={2.5} />
            )}
            {prediction}
        </span>
    );
}

interface PredictionHistoryProps {
    /** Pass a trigger value that bumps to force a re-fetch after a new prediction */
    refreshKey?: number;
}

export default function PredictionHistory({ refreshKey = 0 }: PredictionHistoryProps) {
    const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getPredictionHistory(8)
            .then(setHistory)
            .finally(() => setLoading(false));
    }, [refreshKey]);

    if (loading) {
        return (
            <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" strokeWidth={2} />
                </div>
            </div>
        );
    }

    if (history.length === 0) return null;

    return (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <History className="h-4 w-4 text-gray-500" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Prediction History</h3>
                    <p className="text-xs text-gray-400">Your past analyses</p>
                </div>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                    {history.length} records
                </span>
            </div>

            <div className="divide-y divide-gray-50">
                {history.map((item, idx) => {
                    const avgProb = Math.round(
                        (item.realistic_probability + item.improvement_probability) / 2
                    );
                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
                        >
                            {/* Index */}
                            <span className="flex-shrink-0 text-xs font-bold text-gray-300 tabular-nums w-4 text-right">
                                {idx + 1}
                            </span>

                            {/* Date */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {formatDate(item.created_at)}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {item.input_data?.Degree as string ?? "—"}
                                </p>
                            </div>

                            {/* Score */}
                            <div className="text-right flex-shrink-0">
                                <span className="text-sm font-bold text-gray-800 tabular-nums">
                                    {avgProb}%
                                </span>
                                <p className="text-[10px] text-gray-400">avg</p>
                            </div>

                            {/* Badge */}
                            <div className="flex-shrink-0">
                                <ResultBadge prediction={item.realistic_prediction} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
