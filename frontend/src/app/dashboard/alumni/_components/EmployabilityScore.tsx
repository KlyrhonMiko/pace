"use client";

import Link from "next/link";
import { Lightbulb, ArrowRight } from "lucide-react";
import { EmployabilityResult } from "../_lib/api";

// ── Helpers ─────────────────────────────────────────────────────

function ScoreRing({
    value,
    size = 88,
    strokeWidth = 7,
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

function MetricBar({
    label,
    value,
    from,
    to,
    dotColor,
}: {
    label: string;
    value: number;
    from: string;
    to: string;
    dotColor: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: dotColor }}
                    />
                    <span className="text-[13px] font-medium text-gray-600">{label}</span>
                </div>
                <span className="text-[13px] font-bold text-gray-900 tabular-nums">
                    {value.toFixed(1)}%
                </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                        width: `${value}%`,
                        background: `linear-gradient(90deg, ${from}, ${to})`,
                    }}
                />
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────

export default function EmployabilityScore({
    data,
}: {
    data: EmployabilityResult | null;
}) {
    if (!data) {
        return (
            <div className="relative rounded-2xl bg-white border border-gray-100/80 overflow-hidden h-full group transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
                <div className="p-5 flex flex-col justify-between h-[calc(100%-4px)]">
                    {/* ── Header (matches data card) ─────────────── */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 text-gray-400 shadow-sm ring-1 ring-gray-200/60">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 leading-none">
                                    Employability Score
                                </h2>
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                    AI-powered overview
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Empty State Body ───────────────────────── */}
                    <div className="flex flex-col xl:flex-row items-center gap-4 xl:gap-8 mt-4 h-full">
                        {/* Decorative empty ring */}
                        <div className="relative flex-shrink-0">
                            <ScoreRing
                                value={0}
                                size={92}
                                strokeWidth={8}
                                gradientId="empScoreGradEmpty"
                                from="#d1d5db"
                                to="#e5e7eb"
                                trackColor="#f3f4f6"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-gray-300 leading-none tabular-nums tracking-tight">
                                    —
                                </span>
                                <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                                    Pending
                                </span>
                            </div>
                        </div>

                        {/* Info + CTA */}
                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <h3 className="text-[13px] font-bold text-gray-900 tracking-tight">
                                    No Prediction Yet
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                    Complete your profile to unlock your AI-powered employability analysis.
                                </p>
                            </div>
                            <Link
                                href="/dashboard/alumni/insights"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[11px] font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200"
                            >
                                Get Started
                                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const realisticPct = data.realistic_assessment.probability;
    const improvementPct = data.improvement_roadmap.probability;
    const avgScore = Math.round((realisticPct + improvementPct) / 2);

    // Determine score color and label
    const scoreInfo =
        avgScore >= 70
            ? { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200/60" }
            : avgScore >= 40
                ? { label: "Moderate", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200/60" }
                : { label: "Needs Work", color: "text-red-500", bg: "bg-red-50", ring: "ring-red-200/60" };

    return (
        <div
            className="relative rounded-2xl bg-white border border-gray-100/80 overflow-hidden h-full w-full group transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5"
        >
            <div className="p-5 flex flex-col justify-between h-[calc(100%-4px)]">
                {/* ── Header ──────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 leading-none">
                                Employability Score
                            </h2>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                AI-powered overview
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        <Link
                            href="/dashboard/alumni/insights"
                            className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200"
                        >
                            View Details
                        </Link>
                    </div>
                </div>

                {/* ── Score Body ──────────────────────────────────── */}
                <div className="flex flex-col xl:flex-row items-center gap-4 xl:gap-8 mt-4">
                    {/* Main circular gauge */}
                    <div className="relative flex-shrink-0">
                        <ScoreRing
                            value={avgScore}
                            size={92}
                            strokeWidth={8}
                            gradientId="empScoreGrad"
                            from="#059669"
                            to="#0d9488"
                            trackColor="#ecfdf5"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-gray-900 leading-none tabular-nums tracking-tight">
                                {avgScore}%
                            </span>
                            <span
                                className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full ${scoreInfo.bg} ${scoreInfo.color}`}
                            >
                                {scoreInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Metric bars */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <MetricBar
                            label="Realistic Assessment"
                            value={realisticPct}
                            from="#059669"
                            to="#14b8a6"
                            dotColor="#059669"
                        />
                        <MetricBar
                            label="Improvement Potential"
                            value={improvementPct}
                            from="#6366f1"
                            to="#a78bfa"
                            dotColor="#6366f1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
