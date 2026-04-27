"use client";

import Link from "next/link";
import { Zap, ChevronRight, User, FileUp, Lightbulb, Briefcase, Calendar, Settings, TrendingUp, ClipboardCheck } from "lucide-react";

const actions = [
    {
        label: "Edit Profile",
        description: "Update your information",
        href: "/dashboard/alumni/profile",
        icon: User,
        color: "#ec4899",
        gradient: "from-pink-500 to-pink-600",
        bgTint: "bg-pink-50",
        ringTint: "ring-pink-100/60",
    },
    {
        label: "Upload Resume",
        description: "Update your CV",
        href: "/dashboard/alumni/resumes",
        icon: FileUp,
        color: "#10b981",
        gradient: "from-emerald-700 to-emerald-800",
        bgTint: "bg-emerald-50",
        ringTint: "ring-emerald-100/60",
    },
    {
        label: "Employability Insights",
        description: "ML career guidance",
        href: "/dashboard/alumni/insights",
        icon: Lightbulb,
        color: "#eab308",
        gradient: "from-yellow-400 to-yellow-500",
        bgTint: "bg-yellow-50",
        ringTint: "ring-yellow-100/60",
    },
    {
        label: "Career Predictions",
        description: "Salary & job timeline",
        href: "/dashboard/alumni/predictions",
        icon: TrendingUp,
        color: "#3b82f6",
        gradient: "from-blue-500 to-blue-600",
        bgTint: "bg-blue-50",
        ringTint: "ring-blue-100/60",
    },
    {
        label: "View Job Listings",
        description: "Find new opportunities",
        href: "/dashboard/alumni/jobs",
        icon: Briefcase,
        color: "#f97316",
        gradient: "from-orange-500 to-orange-600",
        bgTint: "bg-orange-50",
        ringTint: "ring-orange-100/60",
    },
    {
        label: "My Applications",
        description: "Track your applications",
        href: "/dashboard/alumni/applications",
        icon: ClipboardCheck,
        color: "#059669",
        gradient: "from-emerald-500 to-emerald-600",
        bgTint: "bg-emerald-50",
        ringTint: "ring-emerald-100/60",
    },
    {
        label: "Find Events",
        description: "Networking events",
        href: "/dashboard/alumni/events",
        icon: Calendar,
        color: "#8b5cf6",
        gradient: "from-violet-500 to-violet-600",
        bgTint: "bg-violet-50",
        ringTint: "ring-violet-100/60",
    },
];

export default function QuickActions({ className }: { className?: string }) {
    return (
        <div className={`group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col ${className}`}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-500/20">
                    <Zap className="w-[18px] h-[18px] text-white" />
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
                            <action.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
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
