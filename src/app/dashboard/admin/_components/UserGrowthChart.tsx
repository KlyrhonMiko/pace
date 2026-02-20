"use client";

export default function UserGrowthChart() {
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
    const data = [68, 82, 95, 110, 128, 145, 156];
    const maxVal = 175;
    const minVal = 45;

    // Chart dimensions
    const svgW = 500;
    const svgH = 200;
    const pad = { l: 0, r: 0, t: 20, b: 5 };
    const cw = svgW - pad.l - pad.r;
    const ch = svgH - pad.t - pad.b;

    const points = data.map((v, i) => ({
        x: pad.l + (i / (data.length - 1)) * cw,
        y: pad.t + ch - ((v - minVal) / (maxVal - minVal)) * ch,
    }));

    // Smooth cubic bezier path (catmull-rom interpolation)
    const tension = 0.25;
    let linePath = `M${points[0].x},${points[0].y}`;
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
    const areaPath = `${linePath} L${lastPt.x},${pad.t + ch} L${firstPt.x},${pad.t + ch} Z`;

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-100/30 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-1 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Registration Trend</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">New users over 7 months</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full ring-1 ring-emerald-100">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                        <span className="text-[11px] font-bold tracking-tight">+21.8%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">vs previous period</p>
                </div>
            </div>

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
                            key={m}
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
                        { label: "Total", value: "784", icon: "users" },
                        { label: "Avg/Month", value: "112", icon: "avg" },
                        { label: "Peak", value: "156", icon: "peak" },
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
        </div>
    );
}
