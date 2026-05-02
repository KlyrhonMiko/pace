import { CheckCircle2, Zap, Database, ShieldCheck, Activity } from "lucide-react";

interface PlatformHealthProps {
    health: {
        uptime: string;
        latency: string;
        db_load: number;
        cache_status: string;
    };
}

export default function PlatformHealth({ health }: PlatformHealthProps) {
    const metrics = [
        {
            label: "Uptime",
            value: health.uptime,
            status: "healthy" as const,
            bar: 100,
            icon: <CheckCircle2 className="w-4 h-4" strokeWidth={2} />,
            gradient: "from-emerald-600 to-emerald-700",
            barColor: "#10b981",
        },
        {
            label: "Latency",
            value: health.latency,
            status: "healthy" as const,
            bar: 100 - Math.min(100, (parseInt(health.latency) || 0) / 10),
            icon: <Zap className="w-4 h-4" strokeWidth={2} />,
            gradient: "from-blue-400 to-blue-500",
            barColor: "#3b82f6",
        },
        {
            label: "DB Load",
            value: `${health.db_load}%`,
            status: health.db_load > 80 ? ("warning" as const) : ("healthy" as const),
            bar: health.db_load,
            icon: <Database className="w-4 h-4" strokeWidth={2} />,
            gradient: "from-violet-400 to-violet-500",
            barColor: "#8b5cf6",
        },
        {
            label: "Cache",
            value: health.cache_status,
            status: health.cache_status === "Healthy" ? ("healthy" as const) : ("warning" as const),
            bar: health.cache_status === "Healthy" ? 100 : 0,
            icon: <Activity className="w-4 h-4" strokeWidth={2} />,
            gradient: "from-amber-400 to-amber-500",
            barColor: "#f59e0b",
        },
    ];


    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-teal-100/20 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
                        <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">System Health</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Infrastructure monitoring</p>
                    </div>
                </div>

            </div>

            {/* Metrics Grid */}
            <div className="px-6 pb-2 flex-1">
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((m) => (
                        <div
                            key={m.label}
                            className="relative rounded-xl bg-gradient-to-b from-gray-50/80 to-white border border-gray-100/60 p-4 transition-all duration-300 hover:border-gray-200/80 hover:shadow-sm"
                        >
                            {/* Icon + Label */}
                            <div className="flex items-center gap-2 mb-3">
                                <div
                                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white shadow-sm`}
                                    style={{ boxShadow: `0 4px 12px ${m.barColor}25` }}
                                >
                                    {m.icon}
                                </div>
                                <span className="text-[11px] font-medium text-gray-500">{m.label}</span>
                            </div>

                            {/* Value */}
                            <div className="flex items-baseline justify-between mb-3">
                                <span
                                    className={`text-xl font-extrabold tracking-tight ${m.status === "warning" ? "text-amber-600" : "text-gray-900"
                                        }`}
                                >
                                    {m.value}
                                </span>
                                {m.status === "healthy" ? (
                                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Good
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Watch
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${m.bar}%`,
                                        background: `linear-gradient(90deg, ${m.barColor}80, ${m.barColor})`,
                                        boxShadow: `0 0 8px ${m.barColor}40`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>


        </div>
    );
}
