"use client";

import { useEffect, useState } from "react";
import { Activity as ActivityIcon, ArrowRight, Loader2 } from "lucide-react";
import { fetchFacultyActivity, FacultyActivity } from "../../_lib/dashboard";
import { formatDistanceToNow } from "date-fns";

export default function RecentAlumniActivity() {
    const [activities, setActivities] = useState<FacultyActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchFacultyActivity();
            setActivities(data);
            setLoading(false);
        }
        load();
    }, []);

    const getTypeStyles = (type: string) => {
        switch (type.toLowerCase()) {
            case "registration":
            case "user_registered":
                return { icon: "👤", color: "text-blue-600", bg: "bg-blue-50" };
            case "job_post":
            case "job_application":
                return { icon: "💼", color: "text-emerald-600", bg: "bg-emerald-50" };
            case "event":
            case "event_registered":
                return { icon: "📅", color: "text-violet-600", bg: "bg-violet-50" };
            default:
                return { icon: "✨", color: "text-gray-600", bg: "bg-gray-50" };
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white border border-gray-100/80 p-6 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    <p className="text-sm text-gray-400 font-medium">Fetching activities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col h-full">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25">
                        <ActivityIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Alumni Activity</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Platform-wide updates</p>
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
                        {activities.map((item) => {
                            const { icon, color, bg } = getTypeStyles(item.type);
                            const timeAgo = formatDistanceToNow(new Date(item.created_at));

                            return (
                                <div
                                    key={item.id}
                                    className="group/item relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/60 transition-all duration-200 cursor-pointer"
                                >
                                    {/* Icon node */}
                                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                                        <div
                                            className={`w-[30px] h-[30px] rounded-lg ${bg} flex items-center justify-center ring-[3px] ring-white transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md`}
                                        >
                                            <span className={`text-sm ${color}`}>{icon}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-[13px] font-medium text-gray-800 leading-tight group-hover/item:text-gray-900 transition-colors">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Time badge */}
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md ring-1 ring-gray-100/60 group-hover/item:bg-white group-hover/item:ring-gray-200/80 transition-all whitespace-nowrap">
                                            {timeAgo} ago
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {activities.length === 0 && (
                            <div className="py-10 text-center">
                                <p className="text-sm text-gray-400">No recent activity found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
