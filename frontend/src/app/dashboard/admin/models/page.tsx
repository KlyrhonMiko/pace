"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { apiFetch } from "@/lib/api-client";
import {
    Brain,
    Activity,
    TrendingUp,
    Clock,
    Hash,
    ChevronDown,
    ChevronUp,
    Layers,
    Target,
    Cpu,
    BarChart3,
    Loader2,
    AlertCircle,
    TreeDeciduous,
    LineChart,
    Sparkles,
} from "lucide-react";
import ModelInsightsChat from "./_components/ModelInsightsChat";
import { useAIInsightsStore } from "./_components/ai-insights-store";

/* ─── Types ─────────────────────────────────────────────── */
interface ModelInfo {
    id: string;
    name: string;
    type: string;
    target: string;
    description: string;
    includes_cgpa?: boolean;
    num_features: number;
    features: string[];
    programs?: string[];
    hyperparameters?: Record<string, any>;
    metrics?: Record<string, number | null> | null;
    size_bytes: number;
    last_modified: string | null;
}

interface ModelsResponse {
    total_models: number;
    models: ModelInfo[];
}

/* ─── Helpers ───────────────────────────────────────────── */
function formatBytes(bytes: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getTypeIcon(type: string) {
    if (type.toLowerCase().includes("random forest"))
        return <TreeDeciduous size={18} />;
    if (type.toLowerCase().includes("linear"))
        return <LineChart size={18} />;
    return <TrendingUp size={18} />;
}

function getTypeColor(type: string): string {
    if (type.toLowerCase().includes("random forest")) return "emerald";
    if (type.toLowerCase().includes("linear")) return "blue";
    return "violet";
}

function getTypeBg(color: string) {
    const map: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        violet: "bg-violet-50 text-violet-700 border-violet-200",
    };
    return map[color] || map.violet;
}

function getTypeGradient(color: string) {
    const map: Record<string, string> = {
        emerald: "from-emerald-600 to-emerald-700",
        blue: "from-blue-600 to-blue-700",
        violet: "from-violet-600 to-violet-700",
    };
    return map[color] || map.violet;
}

/* ─── Metric Badge ──────────────────────────────────────── */
function MetricBadge({
    label,
    value,
    suffix,
    good,
}: {
    label: string;
    value: number | null | undefined;
    suffix?: string;
    good?: boolean;
}) {
    if (value === null || value === undefined) return null;
    const formatted =
        typeof value === "number"
            ? value < 1 && value > 0
                ? (value * 100).toFixed(1) + "%"
                : value.toFixed(3)
            : String(value);

    return (
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-gray-50/80 border border-gray-100 min-w-[100px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {label}
            </span>
            <span
                className={`text-lg font-bold tabular-nums ${good === true
                    ? "text-emerald-700"
                    : good === false
                        ? "text-amber-600"
                        : "text-gray-800"
                    }`}
            >
                {formatted}
                {suffix && (
                    <span className="text-xs font-medium text-gray-400 ml-0.5">
                        {suffix}
                    </span>
                )}
            </span>
        </div>
    );
}

/* ─── Model Card ────────────────────────────────────────── */
function ModelCard({ model }: { model: ModelInfo }) {
    const [expanded, setExpanded] = useState(false);
    const color = getTypeColor(model.type);
    const gradient = getTypeGradient(color);
    const typeBg = getTypeBg(color);
    const { openWithQuery } = useAIInsightsStore();

    const hasMetrics = model.metrics && Object.values(model.metrics).some((v) => v !== null);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div
                            className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg flex-shrink-0`}
                        >
                            {getTypeIcon(model.type)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
                                {model.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeBg}`}
                                >
                                    {model.type}
                                </span>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    <Target size={11} />
                                    {model.target}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                    {model.description}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <Hash
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                        />
                        <div>
                            <div className="text-xs font-bold text-gray-900">
                                {model.num_features}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                                Features
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <Layers
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                        />
                        <div>
                            <div className="text-xs font-bold text-gray-900">
                                {formatBytes(model.size_bytes)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                                Size
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <Clock
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                        />
                        <div>
                            <div
                                className="text-xs font-bold text-gray-900 truncate max-w-[90px]"
                                title={formatDate(model.last_modified)}
                            >
                                {model.last_modified
                                    ? new Date(
                                        model.last_modified
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "—"}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                                Trained
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Strip */}
                {hasMetrics && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {model.metrics?.r_squared !== undefined &&
                            model.metrics.r_squared !== null && (
                                <MetricBadge
                                    label="R²"
                                    value={model.metrics.r_squared}
                                    good={
                                        model.metrics.r_squared > 0.7
                                            ? true
                                            : model.metrics.r_squared < 0.4
                                                ? false
                                                : undefined
                                    }
                                />
                            )}
                        {model.metrics?.mae !== undefined &&
                            model.metrics.mae !== null && (
                                <MetricBadge label="MAE" value={model.metrics.mae} />
                            )}
                        {model.metrics?.rmse !== undefined &&
                            model.metrics.rmse !== null && (
                                <MetricBadge label="RMSE" value={model.metrics.rmse} />
                            )}
                    </div>
                )}

                {!hasMetrics && model.type.includes("Random Forest") && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 px-3 py-2.5 rounded-xl bg-gray-50/60 border border-gray-100">
                        <BarChart3 size={13} />
                        <span>
                            Retrain the model to generate performance metrics
                        </span>
                    </div>
                )}

                {!hasMetrics && model.type.includes("ARIMA") && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 px-3 py-2.5 rounded-xl bg-gray-50/60 border border-gray-100">
                        <BarChart3 size={13} />
                        <span>
                            ARIMA metrics are computed dynamically per forecast
                        </span>
                    </div>
                )}

                {/* Expandable Details Options */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        {expanded ? (
                            <ChevronUp size={14} />
                        ) : (
                            <ChevronDown size={14} />
                        )}
                        {expanded ? "Hide Details" : "View Details"}
                    </button>

                    <button
                        onClick={() => openWithQuery(`Tell me about the ${model.name} model.`)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                        <Sparkles size={14} />
                        Ask AI
                    </button>
                </div>

                {expanded && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Features */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Input Features
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {model.features.map((f) => (
                                    <span
                                        key={f}
                                        className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600"
                                    >
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Programs */}
                        {model.programs && model.programs.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Supported Programs
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {model.programs.map((p) => (
                                        <span
                                            key={p}
                                            className={`px-2 py-1 rounded-lg border text-[11px] font-medium ${typeBg}`}
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hyperparameters */}
                        {model.hyperparameters && (
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Hyperparameters
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(model.hyperparameters).map(
                                        ([key, val]) => (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                                            >
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    {key.replace(/_/g, " ")}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-800 font-mono">
                                                    {String(val)}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        {model.last_modified && (
                            <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                <Clock size={12} />
                                Last trained: {formatDate(model.last_modified)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function AdminModelsPage() {
    const [data, setData] = useState<ModelsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { openWithQuery } = useAIInsightsStore();

    useEffect(() => {
        async function load() {
            try {
                const json = await apiFetch<any>("/predict/models/info");
                if (json.success && json.data) {
                    setData(json.data);
                } else {
                    setError(json.message || "Failed to load model info");
                }
            } catch (e: any) {
                setError(e.message || "Failed to load model info");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Stat computations
    const totalModels = data?.total_models ?? 0;
    const modelTypes = data
        ? new Set(data.models.map((m) => m.type.split("(")[0].trim())).size
        : 0;
    const latestTrained = data
        ? data.models
            .map((m) => m.last_modified)
            .filter(Boolean)
            .sort()
            .pop()
        : null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Model Registry"
                description="Track all deployed ML models, their performance metrics, and training history."
                currentPage="Models"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            >
                <button
                    onClick={() => openWithQuery("Can you summarize the performance of all deployed models?")}
                    className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-green-500 transition-all duration-300 cursor-pointer flex-shrink-0"
                >
                    <Sparkles
                        className="h-4 w-4 group-hover:animate-pulse"
                        strokeWidth={2}
                    />
                    Ask AI
                </button>
            </PageHeader>

            {/* Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: "Total Models",
                        value: loading ? "—" : String(totalModels),
                        icon: <Brain size={18} />,
                        color: "emerald",
                    },
                    {
                        label: "Model Types",
                        value: loading ? "—" : String(modelTypes),
                        icon: <Cpu size={18} />,
                        color: "blue",
                    },
                    {
                        label: "Last Trained",
                        value: loading
                            ? "—"
                            : latestTrained
                                ? new Date(latestTrained).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric", year: "numeric" }
                                )
                                : "—",
                        icon: <Activity size={18} />,
                        color: "violet",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
                    >
                        <div
                            className={`flex items-center justify-center w-11 h-11 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-900">
                                {stat.value}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2
                        size={28}
                        className="animate-spin text-emerald-600"
                    />
                    <span className="ml-3 text-sm text-gray-500 font-medium">
                        Loading model data…
                    </span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
                    <AlertCircle size={20} className="text-red-500" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            {!loading && !error && data && (
                <div className="grid gap-5 lg:grid-cols-2">
                    {data.models.map((model) => (
                        <ModelCard key={model.id} model={model} />
                    ))}
                    <ModelInsightsChat modelsData={data.models} />
                </div>
            )}
        </div>
    );
}
