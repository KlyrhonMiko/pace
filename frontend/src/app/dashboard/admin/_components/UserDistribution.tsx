"use client";
import React from "react";
import { PieChart, CheckCircle2 } from "lucide-react";

interface UserDistributionProps {
    distribution?: {
        label: string;
        value: number;
        percentage: number;
        color: string;
    }[];
    isLoading?: boolean;
}

const colorMap: Record<string, { hex: string; ring: string; bar: string }> = {
    emerald: { hex: "#10b981", ring: "ring-emerald-100", bar: "bg-emerald-100" },
    blue: { hex: "#3b82f6", ring: "ring-blue-100", bar: "bg-blue-100" },
    violet: { hex: "#8b5cf6", ring: "ring-violet-100", bar: "bg-violet-100" },
    amber: { hex: "#f59e0b", ring: "ring-amber-100", bar: "bg-amber-100" },
};

export default function UserDistribution({ distribution = [], isLoading }: UserDistributionProps) {
    const segments = (distribution || []).map(d => ({
        ...d,
        color: colorMap[d.color]?.hex || "#94a3b8",
        pct: d.percentage
    }));
    const total = (distribution || []).reduce((acc, curr) => acc + curr.value, 0);
    const radius = 46;
    const strokeWidth = 11;
    const circumference = 2 * Math.PI * radius;

    if (isLoading) {
        return (
            <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden flex flex-col h-[320px]">
                <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
                        <div className="space-y-1.5">
                            <div className="h-3 w-32 rounded skeleton-shimmer" />
                            <div className="h-2 w-24 rounded skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="w-16 h-6 rounded-full skeleton-shimmer" />
                </div>
                <div className="px-6 pb-6 pt-2 flex-1 flex flex-col gap-4">
                    <div className="flex items-center gap-8 flex-1">
                        <div className="w-[160px] h-[160px] rounded-full skeleton-shimmer flex-shrink-0" />
                        <div className="flex-1 space-y-4">
                            <div className="h-4 rounded skeleton-shimmer" />
                            <div className="h-4 rounded skeleton-shimmer" />
                            <div className="h-4 rounded skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="h-16 rounded-xl skeleton-shimmer mt-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-blue-100/20 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <PieChart className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">User Distribution</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Breakdown by role</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50/80 rounded-full px-3 py-1.5 ring-1 ring-gray-100/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-[11px] font-semibold text-gray-500">{total.toLocaleString()} users</span>
                </div>
            </div>

            {distribution.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 pb-6">
                    No distribution data
                </div>
            ) : (
                <>
            {/* Chart + Legend */}
            <div className="px-6 pb-2 flex-1">
                <div className="flex items-center gap-8">
                    {/* Donut Chart */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-[160px] h-[160px]" viewBox="0 0 120 120">
                            {/* Background track ring */}
                            <circle
                                cx="60" cy="60" r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                stroke="#f1f5f9"
                            />
                            {/* Inner subtle ring */}
                            <circle
                                cx="60" cy="60" r={radius - strokeWidth / 2 - 3}
                                fill="none"
                                strokeWidth="0.5"
                                stroke="#e2e8f0"
                                strokeDasharray="2 3"
                                opacity="0.5"
                            />
                            {/* Outer subtle ring */}
                            <circle
                                cx="60" cy="60" r={radius + strokeWidth / 2 + 3}
                                fill="none"
                                strokeWidth="0.5"
                                stroke="#e2e8f0"
                                strokeDasharray="2 3"
                                opacity="0.5"
                            />
                            {/* Segments */}
                            <g style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}>
                                {segments.reduce<{ elements: React.ReactNode[], currentOffset: number }>(
                                    (acc, seg) => {
                                        const dash = (seg.pct / 100) * circumference;
                                        const gap = circumference - dash;
                                        const offset = acc.currentOffset;
                                        acc.elements.push(
                                            <circle
                                                key={seg.label}
                                                cx="60" cy="60" r={radius}
                                                fill="none"
                                                strokeWidth={strokeWidth}
                                                strokeLinecap="round"
                                                stroke={seg.color}
                                                strokeDasharray={`${dash - 3} ${gap + 3}`}
                                                strokeDashoffset={-offset}
                                                className="transition-all duration-700"
                                            />
                                        );
                                        acc.currentOffset += dash;
                                        return acc;
                                    },
                                    { elements: [], currentOffset: 0 }
                                ).elements}
                            </g>
                        </svg>

                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Total</span>
                            <span className="text-[22px] font-extrabold text-gray-900 leading-tight -mt-0.5">
                                {total.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">users</span>
                        </div>
                    </div>

                    {/* Legend with progress bars */}
                    <div className="flex-1 space-y-4">
                        {segments.map((seg) => (
                            <div key={seg.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1"
                                            style={{
                                                backgroundColor: seg.color,
                                                // @ts-expect-error ring color via style
                                                "--tw-ring-color": `${seg.color}30`,
                                            }}
                                        />
                                        <span className="text-xs font-medium text-gray-600">{seg.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                                            {seg.value.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium tabular-nums w-[38px] text-right">
                                            {seg.pct}%
                                        </span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${seg.pct}%`,
                                            background: `linear-gradient(90deg, ${seg.color}90, ${seg.color})`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom summary strip */}
            <div className="px-6 pb-5 pt-3 mt-auto">
                {distribution.length > 0 && (() => {
                    const largest = [...distribution].sort((a, b) => b.value - a.value)[0];
                    return (
                        <div className="flex items-center justify-between bg-gradient-to-b from-gray-50/80 to-gray-50/40 rounded-xl py-3 px-4 ring-1 ring-gray-100/60">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-700">Largest group</p>
                                    <p className="text-[10px] text-gray-400">{largest.label} dominates at {largest.percentage}%</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-extrabold text-emerald-800">{largest.value.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">{largest.label.toLowerCase()}</p>
                            </div>
                        </div>
                    );
                })()}
            </div>
            </>
            )}
        </div>
    );
}
