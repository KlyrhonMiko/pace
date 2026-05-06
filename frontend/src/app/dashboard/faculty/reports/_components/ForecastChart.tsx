"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import type { ForecastPoint } from "../_lib/api";

interface ForecastChartProps {
    forecasts: ForecastPoint[];
    dataSource: string;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload as ForecastPoint;
    if (!data) return null;

    return (
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl px-4 py-3 shadow-xl">
            <p className="text-sm font-bold text-gray-900 mb-1.5">
                Year {data.year}
            </p>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-xs text-gray-500">Forecast:</span>
                    <span className="text-xs font-bold text-gray-900">
                        {data.point.toLocaleString()} alumni
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
                    <span className="text-xs text-gray-500">95% CI:</span>
                    <span className="text-xs font-semibold text-gray-700">
                        {data.lower_ci.toLocaleString()} – {data.upper_ci.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2.5 h-2.5 rounded-full ${data.yoy_change >= 0
                            ? "bg-emerald-400"
                            : "bg-red-400"
                            }`}
                    />
                    <span className="text-xs text-gray-500">YoY Change:</span>
                    <span
                        className={`text-xs font-bold ${data.yoy_change >= 0
                            ? "text-emerald-700"
                            : "text-red-600"
                            }`}
                    >
                        {data.yoy_change >= 0 ? "+" : ""}
                        {data.yoy_change}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function ForecastChart({
    forecasts,
    dataSource,
}: ForecastChartProps) {
    // Prepare chart data
    const chartData = forecasts.map((f) => ({
        ...f,
        name: f.year.toString(),
    }));

    const minPoint = Math.min(...forecasts.map(f => f.point));
    const maxPoint = Math.max(...forecasts.map(f => f.point));

    return (
        <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
            {/* Chart Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Employment Forecast
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Predicted employed alumni count per year with 95%
                            confidence intervals
                        </p>
                    </div>
                    <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${dataSource === "real"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                    >
                        <div
                            className={`w-1.5 h-1.5 rounded-full ${dataSource === "real"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                                }`}
                        />
                        {dataSource} data
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="px-4 pb-6">
                <ResponsiveContainer width="100%" height={360}>
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="ciGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#10b981"
                                    stopOpacity={0.15}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#10b981"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                            <linearGradient
                                id="pointGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#059669"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#059669"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="year"
                            tick={{ fontSize: 12, fill: "#94a3b8" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[minPoint - 50, maxPoint + 50]}
                            allowDataOverflow={true}
                            tick={{ fontSize: 12, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Confidence interval band */}
                        <Area
                            type="monotone"
                            dataKey="upper_ci"
                            stroke="none"
                            fill="url(#ciGradient)"
                            fillOpacity={1}
                            stackId="ci"
                            name="Upper CI"
                        />
                        <Area
                            type="monotone"
                            dataKey="lower_ci"
                            stroke="none"
                            fill="#ffffff"
                            fillOpacity={1}
                            stackId="ci"
                            name="Lower CI"
                        />

                        {/* Point forecast line */}
                        <Area
                            type="monotone"
                            dataKey="point"
                            stroke="#059669"
                            strokeWidth={2.5}
                            fill="url(#pointGradient)"
                            fillOpacity={1}
                            dot={{
                                fill: "#059669",
                                r: 5,
                                stroke: "#ffffff",
                                strokeWidth: 2.5,
                            }}
                            activeDot={{
                                fill: "#059669",
                                r: 7,
                                stroke: "#ffffff",
                                strokeWidth: 3,
                            }}
                            name="Forecast"
                        />

                        {/* Reference line at first forecast year */}
                        {chartData.length > 0 && (
                            <ReferenceLine
                                x={chartData[0].year}
                                stroke="#cbd5e1"
                                strokeDasharray="4 4"
                                label={{
                                    value: "Forecast Start",
                                    position: "insideTopRight",
                                    fill: "#94a3b8",
                                    fontSize: 10,
                                }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Year-over-Year Summary Strip */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
                <div className="flex items-center gap-6 overflow-x-auto">
                    {forecasts.map((f) => (
                        <div
                            key={f.year}
                            className="flex items-center gap-2 min-w-fit"
                        >
                            <span className="text-xs font-semibold text-gray-500">
                                {f.year}
                            </span>
                            <span
                                className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${f.yoy_change >= 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
                                    }`}
                            >
                                {f.yoy_change >= 0 ? "↑" : "↓"}
                                {Math.abs(f.yoy_change)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
