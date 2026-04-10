"use client";

import { Activity, Database, Cpu, CheckCircle, AlertTriangle } from "lucide-react";
import type { ForecastData } from "../_lib/api";

interface ForecastSummaryProps {
    forecast: ForecastData;
    forecastSteps: number;
    createdAt: string;
}

export default function ForecastSummary({
    forecast,
    forecastSteps,
    createdAt,
}: ForecastSummaryProps) {
    const { model, diagnostics, data_source, observations } = forecast;

    const cards = [
        {
            label: "Data Source",
            value: data_source === "real" ? "Real Alumni Data" : "Synthetic Baseline",
            sub: `${observations} observations`,
            icon: Database,
            accent:
                data_source === "real"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-700 bg-amber-50 border-amber-200",
            iconColor: data_source === "real" ? "text-emerald-600" : "text-amber-600",
        },
        {
            label: "Forecast Horizon",
            value: `${forecastSteps} Year${forecastSteps > 1 ? "s" : ""} Ahead`,
            sub: `95% confidence intervals`,
            icon: Activity,
            accent: "text-blue-700 bg-blue-50 border-blue-200",
            iconColor: "text-blue-600",
        },
        {
            label: "Model Coefficients",
            value: `φ=${model.phi.toFixed(3)}, θ=${model.theta.toFixed(3)}`,
            sub: `σ = ${model.sigma.toFixed(2)}`,
            icon: Cpu,
            accent: "text-violet-700 bg-violet-50 border-violet-200",
            iconColor: "text-violet-600",
        },
        {
            label: "Residual Diagnostics",
            value: diagnostics.residuals_ok ? "Residuals OK" : "Check Residuals",
            sub: isNaN(diagnostics.ljung_box_p)
                ? "Insufficient data for test"
                : `Ljung-Box p = ${diagnostics.ljung_box_p.toFixed(4)}`,
            icon: diagnostics.residuals_ok ? CheckCircle : AlertTriangle,
            accent: diagnostics.residuals_ok
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-amber-700 bg-amber-50 border-amber-200",
            iconColor: diagnostics.residuals_ok
                ? "text-emerald-600"
                : "text-amber-600",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`rounded-2xl border bg-white p-5 transition-all duration-200 hover:shadow-md ${card.accent.split(" ").slice(2).join(" ") || "border-gray-200"}`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent.split(" ").slice(1, 2).join(" ")} ${card.iconColor}`}
                        >
                            <card.icon className="h-4.5 w-4.5" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                            {card.label}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                        {card.value}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">{card.sub}</p>
                </div>
            ))}
        </div>
    );
}
