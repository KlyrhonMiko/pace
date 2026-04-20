"use client";

import { useState, useCallback, ReactNode } from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCcw, ChevronRight } from "lucide-react";
import type { ForecastData } from "../_lib/api";

interface ForecastAIInsightsProps {
    forecastData: ForecastData;
}

// ── Markdown-lite renderer ─────────────────────────────────────

function formatMarkdown(text: string): ReactNode[] {
    return text.split("\n").map((line, i) => {
        // Headers
        const headerMatch = line.match(/^(#{1,4})\s+(.*)/);
        if (headerMatch) {
            const content = headerMatch[2].replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="font-bold text-gray-900">$1</strong>'
            );
            return (
                <div
                    key={i}
                    className="pt-4 pb-1 text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-100 mb-2 mt-2"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        }

        // Bold text
        const processed = line.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-bold text-gray-900">$1</strong>'
        );

        // Bullet points
        if (processed.match(/^[\s]*[-•*]\s/)) {
            return (
                <div key={i} className="flex gap-2 py-1 items-start">
                    <span className="text-emerald-500 mt-1 flex-shrink-0">•</span>
                    <span
                        className="text-sm text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: processed.replace(/^[\s]*[-•*]\s/, "") }}
                    />
                </div>
            );
        }

        // Numbered lists
        if (processed.match(/^[\s]*\d+\.\s/)) {
            return (
                <div
                    key={i}
                    className="pl-4 py-1 text-sm text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processed }}
                />
            );
        }

        // Empty lines
        if (!processed.trim()) return <div key={i} className="h-3" />;

        // Normal paragraph
        return (
            <div
                key={i}
                className="py-1 text-sm text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processed }}
            />
        );
    });
}

export default function ForecastAIInsights({ forecastData }: ForecastAIInsightsProps) {
    const [insights, setInsights] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateInsights = useCallback(async () => {
        setLoading(true);
        setError(null);
        setInsights("");

        try {
            const response = await fetch("/api/ai-forecast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ forecastData }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate insights.");
            }

            if (!response.body) throw new Error("No response body.");

            const reader = response.body.getReader();
            let done = false;

            // Simple decoder implementation
            const textDecoder = new TextDecoder();

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunk = textDecoder.decode(value, { stream: true });
                    setInsights((prev) => prev + chunk);
                }
            }
        } catch (err: any) {
            console.error("AI Insights Error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }, [forecastData]);

    return (
        <div className="group relative rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
                            <Sparkles className={`h-6 w-6 ${loading ? 'animate-pulse' : ''}`} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI Analysis & Insights</h2>
                            <p className="text-sm text-gray-500 font-medium">Strategic planning powered by statistical models</p>
                        </div>
                    </div>

                    {!insights && !loading && !error && (
                        <button
                            onClick={generateInsights}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-gray-900/10 hover:bg-gray-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                            Generate Insights
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}

                    {(insights || loading || error) && (
                        <button
                            disabled={loading}
                            onClick={generateInsights}
                            className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn cursor-pointer"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} />
                            {loading ? "Generating..." : "Regenerate Analysis"}
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="min-h-[120px] relative">
                    {loading && !insights && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                                <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                            </div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Consulting statistical models...</p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl bg-red-50 border border-red-100 p-6 flex items-start gap-4 animate-in slide-in-from-top-2">
                            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-red-900">Analysis Interrupted</h3>
                                <p className="text-xs text-red-700 mt-1 leading-relaxed">{error}</p>
                                <button
                                    onClick={generateInsights}
                                    className="mt-3 text-xs font-bold text-red-900 underline underline-offset-4 hover:text-red-800"
                                >
                                    Retry generation
                                </button>
                            </div>
                        </div>
                    )}

                    {insights && (
                        <div className="prose prose-sm max-w-none animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="space-y-0 text-gray-600 bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                                {formatMarkdown(insights)}
                                {loading && (
                                    <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse rounded-full align-middle" />
                                )}
                            </div>
                        </div>
                    )}

                    {!insights && !loading && !error && (
                        <div className="rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center py-12 px-6">
                            <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center mb-4 ring-8 ring-white">
                                <Sparkles className="h-7 w-7 text-gray-200" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">Explain this trend</h3>
                            <p className="text-xs text-gray-500 mt-1 text-center max-w-[280px]">
                                Click the button above to generate an AI-powered statistical analysis of these employment forecasts.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
