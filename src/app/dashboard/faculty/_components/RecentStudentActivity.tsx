import { Activity, Briefcase, Send, Edit, Calendar } from "lucide-react";

const activities = [
    {
        action: "Maria Santos got hired",
        detail: "Junior Developer at Accenture PH",
        time: "1h",
        color: "#10b981",
        bgClass: "bg-emerald-50",
        icon: <Briefcase className="w-3.5 h-3.5" />,
    },
    {
        action: "Carlos Reyes applied",
        detail: "Network Engineer at Globe Telecom",
        time: "3h",
        color: "#3b82f6",
        bgClass: "bg-blue-50",
        icon: <Send className="w-3.5 h-3.5" />,
    },
    {
        action: "Ana Dela Cruz updated profile",
        detail: "Added: React, Node.js, Python",
        time: "1d",
        color: "#8b5cf6",
        bgClass: "bg-violet-50",
        icon: <Edit className="w-3.5 h-3.5" />,
    },
    {
        action: "Lea Garcia registered for event",
        detail: "Career Fair 2026 — March 20",
        time: "2d",
        color: "#f59e0b",
        bgClass: "bg-amber-50",
        icon: <Calendar className="w-3.5 h-3.5" />,
    },
];

export default function RecentStudentActivity() {
    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col h-full">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Student Activity</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">From your advisees</p>
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
                        {activities.map((item, idx) => (
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
