"use client";

import { DollarSign } from "lucide-react";
import { SalaryPrediction as SalaryPredictionType } from "../_lib/api";

// ── Band config ─────────────────────────────────────────────────

const bandConfig = {
    High: {
        label: "High",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200/60",
        gradient: { from: "#059669", to: "#0d9488" },
    },
    Mid: {
        label: "Mid-Range",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200/60",
        gradient: { from: "#d97706", to: "#f59e0b" },
    },
    Low: {
        label: "Below Average",
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200/60",
        gradient: { from: "#dc2626", to: "#f87171" },
    },
};

// ── Helpers ─────────────────────────────────────────────────────

function formatPHP(value: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPHPShort(value: number): string {
    if (value >= 1000) {
        return `₱${(value / 1000).toFixed(1)}k`;
    }
    return formatPHP(value);
}

// ── Component ───────────────────────────────────────────────────

export default function SalaryPredictionCard({
    data,
}: {
    data: SalaryPredictionType;
}) {
    const band = bandConfig[data.band];
    const range = data.upper - data.lower;
    const positionPct = ((data.value - data.lower) / range) * 100;

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-full flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${band.gradient.from}, ${band.gradient.to})`,
                                boxShadow: `0 4px 14px ${band.gradient.from}33`,
                            }}
                        >
                            <DollarSign className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Predicted Salary
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Estimated starting monthly income
                            </p>
                        </div>
                    </div>
                    <span
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${band.bg} ${band.color} ${band.border}`}
                    >
                        {band.label}
                    </span>
                </div>

                {/* Main value */}
                <div className="flex flex-col items-center mb-8">
                    <span className="text-4xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {formatPHP(data.value)}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                        per month
                    </span>
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
                                    background: `linear-gradient(90deg, ${band.gradient.from}20, ${band.gradient.from}40, ${band.gradient.from}20)`,
                                }}
                            />
                        </div>
                        {/* Predicted value marker */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-all duration-1000 ease-out"
                            style={{
                                left: `clamp(8px, ${positionPct}%, calc(100% - 8px))`,
                                transform: "translate(-50%, -50%)",
                                background: band.gradient.from,
                            }}
                        />
                    </div>

                    {/* Range labels */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 tabular-nums">
                            {formatPHPShort(data.lower)}
                        </span>
                        <span className="font-semibold text-gray-700 tabular-nums">
                            {formatPHP(data.value)}
                        </span>
                        <span className="text-gray-500 tabular-nums">
                            {formatPHPShort(data.upper)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
