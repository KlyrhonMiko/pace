"use client";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserGrowthChartProps {
    data?: { month: string; count: number }[];
    isLoading?: boolean;
}

export default function UserGrowthChart({ data: trendData = [], isLoading }: UserGrowthChartProps) {
    const isValidData = trendData && trendData.length > 0 && !trendData.some(d => typeof d.count !== 'number' || isNaN(d.count));
    const months = isValidData ? trendData.map(d => d.month) : [];
    const data = isValidData ? trendData.map(d => d.count) : [];
    
    // Chart dimensions
    const svgW = 500;
    const svgH = 200;
    const pad = { l: 0, r: 0, t: 20, b: 5 };
    const cw = svgW - pad.l - pad.r;
    const ch = svgH - pad.t - pad.b;

    let points: {x: number, y: number}[] = [];
    let linePath = "";
    let areaPath = "";

    if (isValidData) {
        const maxVal = Math.max(...data, 10);
        const minVal = Math.min(...data, 0);

        points = data.map((v, i) => ({
            x: pad.l + (i / (data.length - 1)) * cw,
            y: pad.t + ch - ((v - minVal) / (maxVal - minVal)) * ch,
        }));

        // Smooth cubic bezier path (catmull-rom interpolation)
        const tension = 0.25;
        linePath = `M${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];
            const cp1x = p1.x + (p2.x - p0.x) * tension;
            const cp1y = p1.y + (p2.y - p0.y) * tension;
            const cp2x = p2.x - (p3.x - p1.x) * tension;
            const cp2y = p2.y - (p3.y - p1.y) * tension;
            linePath += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }

        const lastPt = points[points.length - 1];
        const firstPt = points[0];
        areaPath = `${linePath} L${lastPt.x},${pad.t + ch} L${firstPt.x},${pad.t + ch} Z`;
    }

    if (isLoading) {
        return (
            <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden flex flex-col h-[320px]">
                <div className="px-6 pt-5 pb-1 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
                        <div className="space-y-1.5">
                            <div className="h-3 w-32 rounded skeleton-shimmer" />
                            <div className="h-2 w-24 rounded skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="w-16 h-6 rounded-full skeleton-shimmer" />
                </div>
                <div className="px-6 pb-6 pt-2 flex-1 flex flex-col gap-4 mt-2">
                    <div className="flex-1 rounded-xl skeleton-shimmer" />
                    <div className="h-16 rounded-xl skeleton-shimmer" />
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-100/30 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-1 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25">
                        <TrendingUp className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Registration Trend</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">New users over 7 months</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full ring-1 ring-emerald-100">
                        <ArrowUpRight className="w-3 h-3" strokeWidth={3} />
                        <span className="text-[11px] font-bold tracking-tight">+21.8%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">vs previous period</p>
                </div>
            </div>

            {!trendData || trendData.length === 0 || trendData.some(d => typeof d.count !== 'number' || isNaN(d.count)) ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 pb-6">
                    No trend data available
                </div>
            ) : (
                <>
                    {/* Chart Area */}
            <div className="px-4 pt-1 flex-1 relative">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-44">
                    <defs>
                        <linearGradient id="growthAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                            <stop offset="50%" stopColor="#10b981" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="growthLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6ee7b7" />
                            <stop offset="35%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <filter id="growthLineGlow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Horizontal grid lines */}
                    {[0.25, 0.5, 0.75].map((pct) => (
                        <line
                            key={pct}
                            x1={pad.l}
                            y1={pad.t + ch * pct}
                            x2={svgW}
                            y2={pad.t + ch * pct}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="6 6"
                            opacity="0.5"
                        />
                    ))}

                    {/* Gradient fill area */}
                    <path d={areaPath} fill="url(#growthAreaFill)" />

                    {/* Glow shadow under line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.08"
                        filter="url(#growthLineGlow)"
                    />

                    {/* Main line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="url(#growthLineGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((p, i) => (
                        <g key={i}>
                            {i === points.length - 1 ? (
                                <>
                                    {/* Pulsing ring on latest point */}
                                    <circle cx={p.x} cy={p.y} r="10" fill="#10b981" opacity="0.12">
                                        <animate attributeName="r" values="8;15;8" dur="2.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.15;0.03;0.15" dur="2.5s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx={p.x} cy={p.y} r="5.5" fill="#059669" stroke="white" strokeWidth="2.5" />
                                    {/* Dark tooltip */}
                                    <rect x={p.x - 22} y={p.y - 33} width="44" height="22" rx="7" fill="#1e293b" />
                                    <polygon points={`${p.x - 5},${p.y - 11} ${p.x + 5},${p.y - 11} ${p.x},${p.y - 5}`} fill="#1e293b" />
                                    <text x={p.x} y={p.y - 18.5} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
                                        {data[i]}
                                    </text>
                                </>
                            ) : (
                                <>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        fill="white"
                                        stroke="#10b981"
                                        strokeWidth="2"
                                        className="opacity-40 group-hover:opacity-100 transition-opacity duration-300"
                                    />
                                </>
                            )}
                        </g>
                    ))}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between px-1 -mt-1">
                    {months.map((m, i) => (
                        <span
                            key={i}
                            className={`text-[10px] font-medium transition-colors duration-300 ${i === months.length - 1
                                ? "text-emerald-800 font-semibold"
                                : "text-gray-300 group-hover:text-gray-400"
                                }`}
                        >
                            {m}
                        </span>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 pb-5 pt-4 mt-auto">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Total", value: data.reduce((a, b) => a + b, 0).toLocaleString(), icon: "users" },
                        { label: "Avg/Month", value: Math.round(data.reduce((a, b) => a + b, 0) / data.length).toLocaleString(), icon: "avg" },
                        { label: "Peak", value: Math.max(...data).toLocaleString(), icon: "peak" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="text-center bg-gradient-to-b from-gray-50/80 to-gray-50/40 rounded-xl py-3 px-2 ring-1 ring-gray-100/60"
                        >
                            <p className="text-lg font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
            </>
            )}
        </div>
    );
}
