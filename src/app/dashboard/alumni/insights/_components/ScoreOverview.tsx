"use client";

import { EmployabilityResult } from "../../_lib/api";
import { BarChart3 } from "lucide-react";

// ── Score Ring ───────────────────────────────────────────────────

function ScoreRing({
    value,
    size = 140,
    strokeWidth = 10,
    gradientId,
    from,
    to,
    trackColor = "#f1f5f9",
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
    gradientId: string;
    from: string;
    to: string;
    trackColor?: string;
}) {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className="-rotate-90"
            viewBox={`0 0 ${size} ${size}`}
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                </linearGradient>
            </defs>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={trackColor}
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
            />
        </svg>
    );
}

// ── Metric Bar ──────────────────────────────────────────────────

function MetricBar({
    label,
    value,
    prediction,
    confidence,
    from,
    to,
    dotColor,
}: {
    label: string;
    value: number;
    prediction: string;
    confidence: number;
    from: string;
    to: string;
    dotColor: string;
}) {
    return (
        <div className="space-y-2 p-4 rounded-xl bg-gray-50/80 border border-gray-100/60">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: dotColor }}
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {value.toFixed(1)}%
                </span>
            </div>
            <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                        width: `${value}%`,
                        background: `linear-gradient(90deg, ${from}, ${to})`,
                    }}
                />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                    Prediction:{" "}
                    <span className={`font-semibold ${prediction === "Employable" ? "text-emerald-600" : "text-red-500"}`}>
                        {prediction}
                    </span>
                </span>
                <span>
                    Confidence: <span className="font-semibold text-gray-700">{confidence.toFixed(1)}%</span>
                </span>
            </div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────

export default function ScoreOverview({ data }: { data: EmployabilityResult }) {
    const realisticPct = data.realistic_assessment.probability;
    const improvementPct = data.improvement_roadmap.probability;
    const avgScore = Math.round((realisticPct + improvementPct) / 2);

    const scoreInfo =
        avgScore >= 70
            ? { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200/60" }
            : avgScore >= 40
                ? { label: "Moderate", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200/60" }
                : { label: "Needs Work", color: "text-red-500", bg: "bg-red-50", border: "border-red-200/60" };

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-full flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <BarChart3 className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Score Overview
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Overall employability assessment
                            </p>
                        </div>
                    </div>
                    {data.cgpa !== "N/A" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 ring-1 ring-gray-100/80">
                            <span className="text-xs text-gray-500 font-medium">CGPA</span>
                            <span className="text-sm font-bold text-gray-900 tabular-nums">{data.cgpa}</span>
                        </div>
                    )}
                </div>

                {/* Score Circle + Label */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                        <ScoreRing
                            value={avgScore}
                            size={150}
                            strokeWidth={11}
                            gradientId="insightsScoreGrad"
                            from="#059669"
                            to="#0d9488"
                            trackColor="#f1f5f9"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900 leading-none tabular-nums tracking-tight">
                                {avgScore}%
                            </span>
                            <span
                                className={`text-[10px] font-semibold mt-2 px-2.5 py-0.5 rounded-full ${scoreInfo.bg} ${scoreInfo.color} ${scoreInfo.border} border`}
                            >
                                {scoreInfo.label}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        Combined assessment score
                    </p>
                </div>

                {/* Metric Bars */}
                <div className="space-y-3 mt-auto">
                    <MetricBar
                        label="Realistic Assessment"
                        value={realisticPct}
                        prediction={data.realistic_assessment.prediction}
                        confidence={data.realistic_assessment.confidence}
                        from="#059669"
                        to="#14b8a6"
                        dotColor="#059669"
                    />
                    <MetricBar
                        label="Improvement Potential"
                        value={improvementPct}
                        prediction={data.improvement_roadmap.prediction}
                        confidence={data.improvement_roadmap.confidence}
                        from="#6366f1"
                        to="#a78bfa"
                        dotColor="#6366f1"
                    />
                </div>
            </div>
        </div>
    );
}
