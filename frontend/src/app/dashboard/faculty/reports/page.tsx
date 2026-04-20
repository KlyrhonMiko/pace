"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, BarChart3, Sparkles } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import ForecastChart from "./_components/ForecastChart";
import ForecastSummary from "./_components/ForecastSummary";
import NewForecastForm from "./_components/NewForecastForm";
import ForecastInsightsChat from "./_components/ForecastInsightsChat";
import { useForecastAIStore } from "./_components/forecast-ai-store";
import {
    getLatestForecast,
    runNewForecast,
    type ForecastRecord,
} from "./_lib/api";

export default function FacultyReportsPage() {
    const [forecast, setForecast] = useState<ForecastRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { openWithQuery } = useForecastAIStore();

    const fetchLatest = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getLatestForecast();
            setForecast(data);
        } catch (err) {
            console.error("Failed to load forecast:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatest();
    }, [fetchLatest]);

    const handleNewForecast = async (steps: number) => {
        setGenerating(true);
        setError(null);
        try {
            await runNewForecast(steps);
        } catch (err) {
            throw err;
        } finally {
            setGenerating(false);
        }
    };

    const handleForecastCreated = () => {
        fetchLatest();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Employment FORECAST"
                description="ARIMA-powered employment trend analysis. Forecast alumni employment rates and plan institutional strategies accordingly."
                currentPage="Employment Forecast"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            >
                <button
                    onClick={() => openWithQuery("Can you summarize the key trends and implications of this employment forecast?")}
                    className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-green-500 transition-all duration-300 cursor-pointer flex-shrink-0"
                >
                    <Sparkles
                        className="h-4 w-4 group-hover:animate-pulse"
                        strokeWidth={2}
                    />
                    Ask AI
                </button>
            </PageHeader>

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />

                {/* Loading State */}
                {loading && (
                    <div className="rounded-2xl bg-white border border-gray-200/60 p-16 flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-gray-300 animate-spin mb-4" />
                        <p className="text-sm text-gray-500 font-medium">
                            Loading forecast data...
                        </p>
                    </div>
                )}

                {/* Content when loaded */}
                {!loading && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        {forecast?.forecast_data && (
                            <ForecastSummary
                                forecast={forecast.forecast_data}
                                forecastSteps={forecast.forecast_steps}
                                createdAt={forecast.created_at}
                            />
                        )}

                        {/* Main Layout Grid: (Chart & Interaction) | (Table) */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left Column: Analysis & Visualization */}
                            <div className="lg:col-span-2 space-y-6">
                                {forecast?.forecast_data?.forecasts ? (
                                    <ForecastChart
                                        forecasts={
                                            forecast.forecast_data.forecasts
                                        }
                                        dataSource={
                                            forecast.forecast_data.data_source
                                        }
                                    />
                                ) : (
                                    <div className="rounded-2xl bg-white border border-gray-200/60 p-16 flex flex-col items-center justify-center">
                                        <BarChart3 className="h-10 w-10 text-gray-200 mb-4" />
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                            No Forecast Data Available
                                        </h3>
                                        <p className="text-xs text-gray-500 text-center max-w-xs">
                                            Generate your first ARIMA forecast
                                            using the form to see employment
                                            trend predictions.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Interaction & Data */}
                            <div className="lg:col-span-1 space-y-6">
                                <NewForecastForm
                                    onForecastCreated={handleForecastCreated}
                                    isLoading={generating}
                                    onSubmit={handleNewForecast}
                                    initialSteps={forecast?.forecast_steps}
                                />
                            </div>
                        </div>

                        {/* Forecast Table - Full Width below */}
                        {forecast?.forecast_data?.forecasts && (
                            <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-sm">
                                <div className="px-6 pt-6 pb-4">
                                    <h3 className="text-base font-bold text-gray-900">
                                        Detailed Forecast Data
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Year-by-year breakdown of employment
                                        predictions
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-t border-b border-gray-100 bg-gray-50/50">
                                                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                                    Year
                                                </th>
                                                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                                    Point
                                                </th>
                                                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                                    Lower 95%
                                                </th>
                                                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                                    Upper 95%
                                                </th>
                                                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                                    YoY
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {forecast.forecast_data.forecasts.map(
                                                (f, i) => (
                                                    <tr
                                                        key={f.year}
                                                        className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${i % 2 === 0
                                                            ? ""
                                                            : "bg-gray-50/30"
                                                            }`}
                                                    >
                                                        <td className="px-3 py-2.5 text-xs font-bold text-gray-900">
                                                            {f.year}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-xs font-semibold text-gray-900 text-right">
                                                            {f.point.toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-gray-500 text-right">
                                                            {f.lower_ci.toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-gray-500 text-right">
                                                            {f.upper_ci.toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            <span
                                                                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${f.yoy_change >=
                                                                    0
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-red-50 text-red-600"
                                                                    }`}
                                                            >
                                                                {f.yoy_change >=
                                                                    0
                                                                    ? "+"
                                                                    : ""}
                                                                {f.yoy_change}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* AI Insights Widget */}
                        {forecast?.forecast_data && (
                            <ForecastInsightsChat forecastData={forecast.forecast_data} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
