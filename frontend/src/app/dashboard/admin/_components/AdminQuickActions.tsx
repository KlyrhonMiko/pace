import Link from "next/link";
import { Zap, ChevronRight, UserPlus, Calendar, Briefcase, BarChart3, Settings, Brain } from "lucide-react";

import React from "react";
const actions = [
    {
        label: "Add User",
        description: "Create a new account",
        href: "/dashboard/admin/users",
        icon: UserPlus,
        color: "#10b981",
        gradient: "from-emerald-700 to-emerald-800",
        bgTint: "bg-emerald-50",
        ringTint: "ring-emerald-100/60",
    },
    {
        label: "Create Event",
        description: "Schedule new event",
        href: "/dashboard/admin/events",
        icon: Calendar,
        color: "#3b82f6",
        gradient: "from-blue-500 to-blue-600",
        bgTint: "bg-blue-50",
        ringTint: "ring-blue-100/60",
    },
    {
        label: "Job Postings",
        description: "View Job Posts",
        href: "/dashboard/admin/jobs",
        icon: Briefcase,
        color: "#8b5cf6",
        gradient: "from-violet-500 to-violet-600",
        bgTint: "bg-violet-50",
        ringTint: "ring-violet-100/60",
    },
    {
        label: "Model Registry",
        description: "Manage ML models",
        href: "/dashboard/admin/models",
        icon: Brain,
        color: "#f43f5e",
        gradient: "from-rose-500 to-rose-600",
        bgTint: "bg-rose-50",
        ringTint: "ring-rose-100/60",
    },
    {
        label: "Gen. Report",
        description: "Export analytics data",
        href: "/dashboard/admin/reports",
        icon: BarChart3,
        color: "#f59e0b",
        gradient: "from-amber-500 to-amber-600",
        bgTint: "bg-amber-50",
        ringTint: "ring-amber-100/60",
    },
    {
        label: "Settings",
        description: "Platform configuration",
        href: "/dashboard/admin/settings",
        icon: Settings,
        color: "#64748b",
        gradient: "from-slate-500 to-slate-600",
        bgTint: "bg-slate-50",
        ringTint: "ring-slate-100/60",
    },
];

export default function AdminQuickActions() {
    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">


            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-500/20">
                    <Zap className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Quick Actions</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Common shortcuts</p>
                </div>
            </div>

            {/* Action Items */}
            <div className="px-4 pb-2 flex-1 space-y-1">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="group/item relative flex items-center gap-3.5 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-gray-50/70"
                    >
                        {/* Icon */}
                        <div
                            className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-sm transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md flex-shrink-0`}
                            style={{ boxShadow: `0 4px 14px ${action.color}20` }}
                        >
                            {React.createElement(action.icon, { className: "h-[18px] w-[18px]", strokeWidth: 1.8 })}
                        </div>

                        {/* Label + Description */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 group-hover/item:text-gray-900 transition-colors leading-tight">
                                {action.label}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{action.description}</p>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-100/0 flex items-center justify-center transition-all duration-200 group-hover/item:bg-gray-100/80 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0">
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" strokeWidth={2.5} />
                        </div>
                    </Link>
                ))}
            </div>


        </div>
    );
}
