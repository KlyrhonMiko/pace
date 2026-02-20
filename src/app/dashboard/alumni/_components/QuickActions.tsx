"use client";

import Link from "next/link";

const actions = [
    {
        label: "Upload Resume",
        description: "Update your CV",
        href: "/dashboard/alumni/profile",
        icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
        color: "#10b981",
        gradient: "from-emerald-700 to-emerald-800",
        bgTint: "bg-emerald-50",
        ringTint: "ring-emerald-100/60",
    },
    {
        label: "Track Applications",
        description: "Status updates",
        href: "/dashboard/alumni/applications",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
        color: "#3b82f6",
        gradient: "from-blue-500 to-blue-600",
        bgTint: "bg-blue-50",
        ringTint: "ring-blue-100/60",
    },
    {
        label: "Find Events",
        description: "Networking events",
        href: "/dashboard/alumni/events",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        color: "#8b5cf6",
        gradient: "from-violet-500 to-violet-600",
        bgTint: "bg-violet-50",
        ringTint: "ring-violet-100/60",
    },
    {
        label: "Settings",
        description: "Account settings",
        href: "/dashboard/alumni/settings",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        color: "#64748b",
        gradient: "from-slate-500 to-slate-600",
        bgTint: "bg-slate-50",
        ringTint: "ring-slate-100/60",
    },
];

export default function QuickActions() {
    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-500/20">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
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
                            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={action.icon} />
                            </svg>
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
                            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
