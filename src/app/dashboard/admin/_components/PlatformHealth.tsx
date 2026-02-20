const metrics = [
    {
        label: "Uptime",
        value: "99.9%",
        status: "healthy" as const,
        bar: 99.9,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        gradient: "from-emerald-600 to-emerald-700",
        barColor: "#10b981",
    },
    {
        label: "Response",
        value: "142ms",
        status: "healthy" as const,
        bar: 85,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        gradient: "from-blue-400 to-blue-500",
        barColor: "#3b82f6",
    },
    {
        label: "DB Load",
        value: "34%",
        status: "healthy" as const,
        bar: 34,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
        ),
        gradient: "from-violet-400 to-violet-500",
        barColor: "#8b5cf6",
    },
    {
        label: "Storage",
        value: "67%",
        status: "warning" as const,
        bar: 67,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
        ),
        gradient: "from-amber-400 to-amber-500",
        barColor: "#f59e0b",
    },
];

export default function PlatformHealth() {


    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-teal-100/20 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
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
