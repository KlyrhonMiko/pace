"use client";

import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";

interface NewForecastFormProps {
    onForecastCreated: () => void;
    isLoading: boolean;
    onSubmit: (steps: number) => Promise<void>;
    initialSteps?: number;
}

export default function NewForecastForm({
    onForecastCreated,
    isLoading,
    onSubmit,
    initialSteps,
}: NewForecastFormProps) {
    const [forecastSteps, setForecastSteps] = useState(initialSteps ?? 3);

    // Sync slider when fetched forecast changes
    useEffect(() => {
        if (initialSteps !== undefined) {
            setForecastSteps(initialSteps);
        }
    }, [initialSteps]);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await onSubmit(forecastSteps);
            onForecastCreated();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to generate forecast"
            );
        }
    };

    return (
        <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
            <div className="px-6 pt-6 pb-5">
                <h3 className="text-base font-bold text-gray-900">
                    Generate New Forecast
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                    Run the ARIMA(1,1,1) model to forecast alumni employment
                    trends
                </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6">
                <div className="space-y-4">
                    {/* Forecast Steps Input */}
                    <div>
                        <label
                            htmlFor="forecast-steps"
                            className="block text-xs font-semibold text-gray-700 mb-1.5"
                        >
                            Years Ahead to Forecast
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                id="forecast-steps"
                                type="range"
                                min={1}
                                max={10}
                                value={forecastSteps}
                                onChange={(e) =>
                                    setForecastSteps(Number(e.target.value))
                                }
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                                disabled={isLoading}
                            />
                            <div className="flex items-center justify-center w-12 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm">
                                {forecastSteps}
                            </div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">
                                1 year
                            </span>
                            <span className="text-[10px] text-gray-400">
                                10 years
                            </span>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            The model uses historical alumni employment data to
                            predict future trends. If insufficient real data is
                            available, a synthetic baseline is used. Results
                            include 95% confidence intervals.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-700/20 hover:shadow-emerald-800/30 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    strokeWidth={2.5}
                                />
                                Running Forecast...
                            </>
                        ) : (
                            <>
                                <Play
                                    className="h-4 w-4"
                                    strokeWidth={2.5}
                                />
                                Run ARIMA Forecast
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
