"use client";

import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";

const segments = [
    { label: "Employed", desc: "Successfully placed", value: 50, color: "#10b981", pct: 78.1 },
    { label: "Interviewing", desc: "In progress", value: 8, color: "#3b82f6", pct: 12.5 },
    { label: "Searching", desc: "Actively looking", value: 6, color: "#f59e0b", pct: 9.4 },
];

const miniStats = [
    { label: "Avg. Offers", value: "2.4", trend: "+0.3", up: true },
    { label: "Avg. Package", value: "8.2L", trend: "+12%", up: true },
    { label: "Top Sector", value: "IT", trend: "Same", up: null },
];

export default function PlacementOverview() {
    const total = 64;
    const placed = 50;
    const placedPct = Math.round((placed / total) * 100);
    const radius = 46;
    const strokeWidth = 11;
    const circumference = 2 * Math.PI * radius;
    let cumulativeOffset = 0;

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-100/20 hover:border-gray-200/80 overflow-hidden flex flex-col h-full">

            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Batch 2025 Placement</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">{total} total advisees</p>
                    </div>
                </div>

            </div>

            {/* Chart + Legend */}
            <div className="px-5 flex-1 flex flex-col">
                <div className="flex items-center gap-6 flex-1">
                    {/* Donut Chart */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-[140px] h-[140px]" viewBox="0 0 120 120">
                            <circle
                                cx="60" cy="60" r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                stroke="#f1f5f9"
                            />
                            <circle
                                cx="60" cy="60" r={radius - strokeWidth / 2 - 3}
                                fill="none"
                                strokeWidth="0.5"
                                stroke="#e2e8f0"
                                strokeDasharray="2 3"
                                opacity="0.5"
                            />
                            <circle
                                cx="60" cy="60" r={radius + strokeWidth / 2 + 3}
                                fill="none"
                                strokeWidth="0.5"
                                stroke="#e2e8f0"
                                strokeDasharray="2 3"
                                opacity="0.5"
                            />
                            <g style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}>
                                {segments.map((seg) => {
                                    const dash = (seg.pct / 100) * circumference;
                                    const gap = circumference - dash;
                                    const offset = cumulativeOffset;
                                    cumulativeOffset += dash;
                                    return (
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
                                })}
                            </g>
                        </svg>

                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Placed</span>
                            <span className="text-[22px] font-extrabold text-gray-900 leading-tight -mt-0.5">
                                {placedPct}%
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">{placed}/{total}</span>
                        </div>
                    </div>

                    {/* Legend with progress bars */}
                    <div className="flex-1 space-y-3">
                        {segments.map((seg) => (
                            <div key={seg.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full ring-2 ring-offset-1"
                                            style={{
                                                backgroundColor: seg.color,
                                                // @ts-expect-error ring color via style
                                                "--tw-ring-color": `${seg.color}30`,
                                            }}
                                        />
                                        <div>
                                            <span className="text-[11px] font-medium text-gray-700">{seg.label}</span>
                                            <p className="text-[9px] text-gray-400 leading-tight">{seg.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                                            {seg.value}
                                        </span>
                                        <span className="text-[9px] text-gray-400 tabular-nums">
                                            ({Math.round(seg.pct)}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
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

                {/* Divider */}
                <div className="border-t border-dashed border-gray-100 my-3" />

                {/* Mini Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                    {miniStats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-gray-50/70 rounded-xl px-3 py-2.5 text-center ring-1 ring-gray-100/50"
                        >
                            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{stat.label}</p>
                            <p className="text-sm font-bold text-gray-900 tabular-nums">{stat.value}</p>
                            {stat.up !== null ? (
                                <div className={`flex items-center justify-center gap-0.5 mt-0.5 ${stat.up ? "text-emerald-700" : "text-red-500"}`}>
                                    {stat.up ? (
                                        <TrendingUp className="w-2.5 h-2.5" />
                                    ) : (
                                        <TrendingDown className="w-2.5 h-2.5" />
                                    )}
                                    <span className="text-[9px] font-semibold">{stat.trend}</span>
                                </div>
                            ) : (
                                <p className="text-[9px] text-gray-400 font-medium mt-0.5">{stat.trend}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>


        </div>
    );
}
