import { Building2, CheckCircle2, Calendar, ShieldCheck, FileText, Clock, UserPlus, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PlatformActivityProps {
    activities: {
        id: string;
        description: string;
        type: string;
        created_at: string;
    }[];
    isLoading?: boolean;
}

const activityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    registration: {
        icon: <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />,
        color: "#10b981",
        bg: "bg-emerald-50",
    },
    verification: {
        icon: <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />,
        color: "#3b82f6",
        bg: "bg-blue-50",
    },
    event: {
        icon: <Calendar className="w-3.5 h-3.5" strokeWidth={2} />,
        color: "#8b5cf6",
        bg: "bg-violet-50",
    },
    job: {
        icon: <Building2 className="w-3.5 h-3.5" strokeWidth={2} />,
        color: "#f59e0b",
        bg: "bg-amber-50",
    },
    survey: {
        icon: <FileText className="w-3.5 h-3.5" strokeWidth={2} />,
        color: "#ec4899",
        bg: "bg-pink-50",
    },
    default: {
        icon: <HelpCircle className="w-3.5 h-3.5" strokeWidth={2} />,
        color: "#64748b",
        bg: "bg-slate-50",
    },
};

export default function PlatformActivity({ activities = [], isLoading }: PlatformActivityProps) {
    if (isLoading) {
        return (
            <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
                        <div className="space-y-1.5">
                            <div className="h-3 w-32 rounded skeleton-shimmer" />
                            <div className="h-2 w-24 rounded skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="w-16 h-8 rounded-lg skeleton-shimmer" />
                </div>
                <div className="px-6 pb-2 flex-1">
                    <div className="space-y-0.5">
                        <div className="space-y-3 pt-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={`skel-${i}`} className="flex items-start gap-4 py-3 px-2">
                                    <div className="w-[30px] h-[30px] rounded-lg skeleton-shimmer flex-shrink-0" />
                                    <div className="space-y-2 flex-1 pt-1">
                                        <div className="h-3 w-48 rounded skeleton-shimmer" />
                                        <div className="h-2 w-24 rounded skeleton-shimmer" />
                                    </div>
                                    <div className="w-16 h-5 rounded-md skeleton-shimmer flex-shrink-0 mt-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        {activities.length === 0 ? (
                            <div className="flex items-center justify-center text-gray-400 py-12 text-sm">
                                No recent activities
                            </div>
                        ) : activities.slice(0, 4).map((item, idx) => {
                            const config = activityConfig[item.type] || activityConfig.default;
                            return (
                                <div
                                    key={item.id || idx}
                                    className="group/item relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/60 transition-all duration-200 cursor-pointer"
                                >
                                    {/* Icon node */}
                                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                                        <div
                                            className={`w-[30px] h-[30px] rounded-lg ${config.bg} flex items-center justify-center ring-[3px] ring-white transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md`}
                                            style={{ color: config.color }}
                                        >
                                            {config.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-[13px] font-medium text-gray-800 leading-tight group-hover/item:text-gray-900 transition-colors">
                                            {item.description}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5 truncate uppercase tracking-wider font-semibold">
                                            {item.type}
                                        </p>
                                    </div>

                                    {/* Time badge */}
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md ring-1 ring-gray-100/60 group-hover/item:bg-white group-hover/item:ring-gray-200/80 transition-all">
                                            {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : "Recently"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>


        </div>
    );
}
