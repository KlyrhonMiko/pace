"use client";

import { Clock } from "lucide-react";
import { DurationPrediction } from "../_lib/api";

// ── Outlook config ──────────────────────────────────────────────

const outlookConfig = {
    Short: {
        label: "Quick Search",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200/60",
        gradient: { from: "#059669", to: "#0d9488" },
        description: "You're likely to land a job quickly!",
    },
    Moderate: {
        label: "Average Timeline",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200/60",
        gradient: { from: "#d97706", to: "#f59e0b" },
        description: "A typical job search timeline expected.",
    },
    Long: {
        label: "Extended Search",
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200/60",
        gradient: { from: "#dc2626", to: "#f87171" },
        description: "The search may take longer than average.",
    },
};

// ── Component ───────────────────────────────────────────────────

export default function JobSearchDuration({
    data,
}: {
    data: DurationPrediction;
}) {
    const outlook = outlookConfig[data.outlook];
    const range = data.upper - data.lower;
    const positionPct = ((data.value - data.lower) / range) * 100;

    // Visual: map weeks onto a 0–30 week scale for the timeline markers
    const markers = [0, 6, 14, 30];
    const markerLabels = ["0w", "6w", "14w", "30w"];

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-full flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${outlook.gradient.from}, ${outlook.gradient.to})`,
                                boxShadow: `0 4px 14px ${outlook.gradient.from}33`,
                            }}
                        >
                            <Clock className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Job Search Duration
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Estimated time to first employment
                            </p>
                        </div>
                    </div>
                    <span
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${outlook.bg} ${outlook.color} ${outlook.border}`}
                    >
                        {outlook.label}
                    </span>
                </div>

                {/* Main value */}
                <div className="flex flex-col items-center mb-4">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold text-gray-900 tracking-tight tabular-nums">
                            {data.value.toFixed(1)}
                        </span>
                        <span className="text-lg text-gray-500 font-medium">
                            weeks
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {outlook.description}
                    </p>
                </div>

                {/* Confidence interval range */}
                <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Confidence Range</span>
                        <span className="font-medium text-gray-700">
                            ±1 RMSE
                        </span>
                    </div>

                    {/* Range bar */}
                    <div className="relative">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: "100%",
                                    background: `linear-gradient(90deg, ${outlook.gradient.from}20, ${outlook.gradient.from}40, ${outlook.gradient.from}20)`,
                                }}
                            />
                        </div>
                        {/* Predicted value marker */}
                        <div
                            className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-all duration-1000 ease-out"
                            style={{
                                left: `clamp(8px, ${positionPct}%, calc(100% - 8px))`,
                                transform: "translate(-50%, -50%)",
                                background: outlook.gradient.from,
                            }}
                        />
                    </div>

                    {/* Range labels */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 tabular-nums">
                            {data.lower.toFixed(1)}w
                        </span>
                        <span className="font-semibold text-gray-700 tabular-nums">
                            {data.value.toFixed(1)} weeks
                        </span>
                        <span className="text-gray-500 tabular-nums">
                            {data.upper.toFixed(1)}w
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
