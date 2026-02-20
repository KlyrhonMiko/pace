import Link from "next/link";

const actions = [
    {
        label: "Add User",
        description: "Create a new account",
        href: "/dashboard/admin/users",
        icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
        color: "#10b981",
        gradient: "from-emerald-700 to-emerald-800",
        bgTint: "bg-emerald-50",
        ringTint: "ring-emerald-100/60",
    },
    {
        label: "Create Event",
        description: "Schedule new event",
        href: "/dashboard/admin/events",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        color: "#3b82f6",
        gradient: "from-blue-500 to-blue-600",
        bgTint: "bg-blue-50",
        ringTint: "ring-blue-100/60",
    },
    {
        label: "Job Postings",
        description: "View Job Posts",
        href: "/dashboard/admin/jobs",
        icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
        color: "#8b5cf6",
        gradient: "from-violet-500 to-violet-600",
        bgTint: "bg-violet-50",
        ringTint: "ring-violet-100/60",
    },
    {
        label: "Gen. Report",
        description: "Export analytics data",
        href: "/dashboard/admin/reports",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        color: "#f59e0b",
        gradient: "from-amber-500 to-amber-600",
        bgTint: "bg-amber-50",
        ringTint: "ring-amber-100/60",
    },
    {
        label: "Settings",
        description: "Platform configuration",
        href: "/dashboard/admin/settings",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
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
