"use client";

import { useState, useEffect, useCallback } from "react";
import { GraduationCap, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
import ForecastChart from "./_components/ForecastChart";
import ForecastSummary from "./_components/ForecastSummary";
import NewForecastForm from "./_components/NewForecastForm";
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
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-8 lg:p-12 text-white shadow-2xl">
                {/* Decorative mesh */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400 blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-400 blur-[100px]" />
                </div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200 mb-6">
                            <GraduationCap className="h-3 w-3" />
                            Faculty Dashboard
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
                            Employment{" "}
                            <span className="text-teal-300">FORECAST</span>
                        </h1>
                        <p className="text-emerald-50/80 text-lg max-w-xl leading-relaxed">
                            ARIMA-powered employment trend analysis. Forecast
                            alumni employment rates and plan institutional
                            strategies accordingly.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[160px] hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-teal-400/20 text-teal-300">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest">
                                    Model
                                </span>
                            </div>
                            <div className="text-3xl font-black">
                                ARIMA
                            </div>
                            <div className="text-[11px] font-bold text-teal-300/60 uppercase mt-1">
                                (1,1,1)
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[160px] hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-teal-400/20 text-teal-300">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest">
                                    Forecasts
                                </span>
                            </div>
                            <div className="text-3xl font-black">
                                {forecast?.forecast_data?.forecasts?.length ??
                                    "—"}
                            </div>
                            <div className="text-[11px] font-bold text-teal-300/60 uppercase mt-1">
                                Years Projected
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

                        {/* Chart + New Forecast Form */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
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

                            <div className="lg:col-span-1">
                                <NewForecastForm
                                    onForecastCreated={handleForecastCreated}
                                    isLoading={generating}
                                    onSubmit={handleNewForecast}
                                    initialSteps={forecast?.forecast_steps}
                                />
                            </div>
                        </div>

                        {/* Forecast Table */}
                        {forecast?.forecast_data?.forecasts && (
                            <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
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
                                                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                    Year
                                                </th>
                                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                    Point Forecast
                                                </th>
                                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                    Lower 95% CI
                                                </th>
                                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                    Upper 95% CI
                                                </th>
                                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                                    YoY Change
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {forecast.forecast_data.forecasts.map(
                                                (f, i) => (
                                                    <tr
                                                        key={f.year}
                                                        className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${
                                                            i % 2 === 0
                                                                ? ""
                                                                : "bg-gray-50/30"
                                                        }`}
                                                    >
                                                        <td className="px-6 py-3.5 text-sm font-bold text-gray-900">
                                                            {f.year}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">
                                                            {f.point.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-sm text-gray-500 text-right">
                                                            {f.lower_ci.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-sm text-gray-500 text-right">
                                                            {f.upper_ci.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-right">
                                                            <span
                                                                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                                                                    f.yoy_change >=
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
                    </div>
                )}
            </div>
        </div>
    );
}
