"use client";

import Link from "next/link";
import { Compass, ArrowRight, ShieldCheck } from "lucide-react";
import { CareerTrackResult } from "../_lib/api";
import { getTrackMeta } from "../career-track/_lib/track-meta";

// ── Confidence ring (SVG) ───────────────────────────────────────

function ConfidenceRing({
    value,
    accent,
    size = 132,
    stroke = 10,
}: {
    value: number;
    accent: string;
    size?: number;
    stroke?: number;
}) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, value));
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id={`ring-${accent.replace("#", "")}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--muted)"
                    strokeWidth={stroke}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#ring-${accent.replace("#", "")})`}
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-3xl font-black tabular-nums leading-none"
                    style={{ color: accent }}
                >
                    {clamped.toFixed(0)}
                    <span className="text-base font-bold">%</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">
                    Confidence
                </span>
            </div>
        </div>
    );
}

// ── Empty State ─────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="relative rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
            <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                    <Compass className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">No Track Prediction Yet</h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Add skills to your profile to unlock your AI-powered career path analysis.
                    </p>
                </div>
                <Link
                    href="/dashboard/alumni/profile"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors duration-200"
                >
                    Update Profile Skills
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
            </div>
        </div>
    );
}

// ── Hero Card ───────────────────────────────────────────────────

export default function CareerTrackCard({ data }: { data: CareerTrackResult | null }) {
    if (!data) return <EmptyState />;

    const predicted = data.prediction;
    const meta = getTrackMeta(predicted);
    const Icon = meta.icon;
    const OutlookIcon = meta.outlookIcon;

    // Determine confidence label
    const conf = data.probability;
    const confLabel = conf >= 70 ? "Strong match" : conf >= 50 ? "Likely match" : "Possible match";

    // Build short tagline e.g. "Top candidate among 4 evaluated tracks"
    const totalTracks = Object.keys(data.all_probabilities).length;
    const sorted = Object.entries(data.all_probabilities).sort(([, a], [, b]) => b - a);
    const runnerUp = sorted[1];
    const lead = runnerUp ? Math.max(0, conf - runnerUp[1]) : 0;

    return (
        <div className="relative rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
            {/* Decorative background gradient blob */}
            <div
                className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-[0.10] blur-3xl"
                style={{ background: `linear-gradient(135deg, ${meta.gradient.from}, ${meta.gradient.to})` }}
            />
            <div
                className="pointer-events-none absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full opacity-[0.06] blur-3xl"
                style={{ background: `linear-gradient(135deg, ${meta.gradient.from}, ${meta.gradient.to})` }}
            />

            <div className="relative p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                    {/* Left: Identity + Description */}
                    <div className="flex-1 min-w-0">
                        {/* Eyebrow */}


                        {/* Title row */}
                        <div className="flex items-start gap-4">
                            <div
                                className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${meta.gradient.from}, ${meta.gradient.to})`,
                                    boxShadow: `0 10px 28px ${meta.accent}33`,
                                }}
                            >
                                <Icon className="h-7 w-7" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-[28px] font-black text-foreground leading-tight tracking-tight">
                                    {predicted}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                    {meta.description}
                                </p>
                            </div>
                        </div>

                        {/* Info chips */}
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${meta.softBg} ${meta.softText} ${meta.softBorder}`}
                            >
                                <OutlookIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                {meta.outlook}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                                {confLabel}
                            </span>

                            {runnerUp && lead > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border bg-card text-muted-foreground">
                                    +{lead.toFixed(1)}% lead
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Confidence ring */}
                    <div className="flex-shrink-0 flex items-center justify-center lg:justify-end">
                        <ConfidenceRing value={conf} accent={meta.accent} />
                    </div>
                </div>
            </div>
        </div>
    );
}
