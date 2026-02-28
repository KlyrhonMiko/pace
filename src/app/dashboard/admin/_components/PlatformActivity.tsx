import { Building2, CheckCircle2, Calendar, ShieldCheck, FileText, Clock } from "lucide-react";

const activities = [
    {
        action: "New employer registered",
        detail: "Tech Solutions Inc.",
        time: "15m",
        color: "#10b981",
        bgClass: "bg-emerald-50",
        icon: <Building2 className="w-3.5 h-3.5" strokeWidth={2} />,
    },
    {
        action: "Job posting approved",
        detail: "UI/UX Designer at Accenture",
        time: "1h",
        color: "#3b82f6",
        bgClass: "bg-blue-50",
        icon: <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />,
    },
    {
        action: "Event created",
        detail: "Career Fair 2026 — March 20",
        time: "3h",
        color: "#8b5cf6",
        bgClass: "bg-violet-50",
        icon: <Calendar className="w-3.5 h-3.5" strokeWidth={2} />,
    },
    {
        action: "Alumni verified",
        detail: "Maria Santos — BSIT 2024",
        time: "5h",
        color: "#10b981",
        bgClass: "bg-emerald-50",
        icon: <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />,
    },
    {
        action: "Report generated",
        detail: "Monthly analytics — Jan 2026",
        time: "1d",
        color: "#f59e0b",
        bgClass: "bg-amber-50",
        icon: <FileText className="w-3.5 h-3.5" strokeWidth={2} />,
    },
];

export default function PlatformActivity() {
    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25">
                        <Clock className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Activity Log</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Platform-wide actions</p>
                    </div>
                </div>
                <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                    View All
                </button>
            </div>

            {/* Timeline */}
            <div className="px-6 pb-2 flex-1">
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div
                        className="absolute left-[15px] top-[20px] bottom-[20px] w-px"
                        style={{
                            background: "linear-gradient(to bottom, #e2e8f0, #e2e8f0 60%, transparent)",
                        }}
                    />

                    <div className="space-y-0.5">
                        {activities.slice(0, 4).map((item, idx) => (
                            <div
                                key={idx}
                                className="group/item relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/60 transition-all duration-200 cursor-pointer"
                            >
                                {/* Icon node */}
                                <div className="relative z-10 flex-shrink-0 mt-0.5">
                                    <div
                                        className={`w-[30px] h-[30px] rounded-lg ${item.bgClass} flex items-center justify-center ring-[3px] ring-white transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md`}
                                        style={{ color: item.color }}
                                    >
                                        {item.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <p className="text-[13px] font-medium text-gray-800 leading-tight group-hover/item:text-gray-900 transition-colors">
                                        {item.action}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.detail}</p>
                                </div>

                                {/* Time badge */}
                                <div className="flex-shrink-0 mt-1">
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md ring-1 ring-gray-100/60 group-hover/item:bg-white group-hover/item:ring-gray-200/80 transition-all">
                                        {item.time} ago
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    );
}
