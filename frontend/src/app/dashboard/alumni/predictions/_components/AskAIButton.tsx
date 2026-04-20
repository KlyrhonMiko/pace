"use client";

import { Sparkles } from "lucide-react";
import { RegressionPrediction } from "../_lib/api";
import { useAIInsightsStore } from "./ai-insights-store";

export default function AskAIButton({
    predictionData,
}: {
    predictionData: RegressionPrediction;
}) {
    const { openWithQuery } = useAIInsightsStore();

    return (
        <button
            onClick={() => openWithQuery("Please analyze my career predictions.")}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-green-500 transition-all duration-300 cursor-pointer"
        >
            <Sparkles
                className="h-4 w-4 group-hover:animate-pulse"
                strokeWidth={2}
            />
            Ask AI
        </button>
    );
}
