"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Activity as ActivityIcon, Loader2, Zap, Briefcase, UserCheck, CalendarDays, Edit, Bookmark, LogIn, LogOut } from "lucide-react";
import { fetchEmployerActivity, Activity } from "../../_lib/dashboard";
import ActivityItem from "../../alumni/_components/ActivityItem";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployerHiringActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadActivity() {
            try {
                const data = await fetchEmployerActivity(5);
                setActivities(data);
            } catch (error) {
                console.error("Failed to load employer activity", error);
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, []);

    const getActivityIcon = (type: string, description: string = "") => {
        const t = type.toUpperCase();
        const d = description.toUpperCase();

        if (t === "POST_JOB") return <Briefcase className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (t === "UPDATE_JOB") return <Edit className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (t === "DELETE_JOB") return <Bookmark className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (t === "TOGGLE_JOB_VISIBILITY") return <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (t === "UPDATE_JOB_STATUS" || d.includes("ACCEPTED") || d.includes("REJECTED")) return <UserCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (t === "SCHEDULE_INTERVIEW" || d.includes("INTERVIEW")) return <CalendarDays className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (t === "UPDATE_COMPANY_PROFILE" || d.includes("PROFILE") || d.includes("LOGO")) return <Edit className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (d.includes("LOGGED IN")) return <LogIn className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (d.includes("LOGGED OUT")) return <LogOut className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;

        return <ActivityIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
    };

    const getIconBg = (type: string, description: string = "") => {
        const t = type.toUpperCase();
        const d = description.toUpperCase();

        if (t === "POST_JOB") return "bg-blue-600";
        if (t === "UPDATE_JOB") return "bg-amber-600";
        if (t === "DELETE_JOB") return "bg-rose-600";
        if (t === "TOGGLE_JOB_VISIBILITY") return "bg-emerald-600";
        if (t === "UPDATE_JOB_STATUS") {
            if (d.includes("ACCEPTED")) return "bg-emerald-600";
            if (d.includes("REJECTED")) return "bg-rose-600";
            return "bg-amber-500";
        }
        if (t === "SCHEDULE_INTERVIEW") return "bg-violet-600";
        if (t === "UPDATE_COMPANY_PROFILE") return "bg-indigo-600";
        if (d.includes("LOGGED IN")) return "bg-emerald-500";
        if (d.includes("LOGGED OUT")) return "bg-rose-500";

        return "bg-slate-500";
    };

    const formatTime = (dateStr: string) => {
        let date: Date;
        if (dateStr.includes(" - ")) {
            const [datePart, timePart] = dateStr.split(" - ");
            const [m, d, y] = datePart.split("/").map(Number);
            const [h, min, s] = timePart.split(":").map(Number);
            date = new Date(y, m - 1, d, h, min, s);
        } else {
            // Handle ISO strings robustly
            let normalizedDateStr = dateStr;
            // If it's a naive ISO string (no Z and no offset), assume it's UTC
            if (!dateStr.includes("Z") && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
                normalizedDateStr = dateStr.includes("T") ? `${dateStr}Z` : `${dateStr.replace(' ', 'T')}Z`;
            }
            date = new Date(normalizedDateStr);
        }

        if (isNaN(date.getTime())) return "Recent";

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInSeconds < 120) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays === 1) return "Yesterday";
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/30 hover:border-blue-100/60 h-full flex flex-col">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
                            <p className="text-xs text-gray-500">Your latest hiring updates</p>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-0">
                    {loading ? (
                        <div className="flex flex-col skeleton-stagger">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="relative flex gap-4 py-3.5 px-3 -mx-3 rounded-xl">
                                    <div className="relative flex-shrink-0">
                                        {i < 5 && (
                                            <div className="absolute left-1/2 top-[3.25rem] -translate-x-1/2 w-px h-[calc(100%-12px)] bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
                                        )}
                                        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl shadow-md ring-4 ring-white skeleton-shimmer" style={{
                                            background: 'linear-gradient(135deg, hsl(210 40% 92%) 0%, hsl(220 30% 88%) 100%)'
                                        }}>
                                            <div className="skeleton-shimmer h-full w-full rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                                                <Skeleton className="h-3 w-1/2 rounded-md mt-1.5" />
                                            </div>
                                            <Skeleton className="h-[18px] w-12 rounded-full flex-shrink-0 mt-0.5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activities.length > 0 ? (
                        activities.map((activity, idx) => (
                            <ActivityItem
                                key={activity.activity_id || idx}
                                title={activity.description?.replace(/_/g, ' ') || 'Unknown Activity'}
                                description={activity.description?.includes("LOGGED") ? "University platform activity" : "Hiring pipeline activity"}
                                time={formatTime(activity.created_at || new Date().toISOString())}
                                iconBg={getIconBg(activity.activity_type, activity.description)}
                                isLast={idx === activities.length - 1}
                                icon={getActivityIcon(activity.activity_type, activity.description)}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
                            <Zap className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-sm font-medium text-gray-500">No recent activity</p>
                            <p className="text-xs text-gray-400 mt-1">Updates will appear as you interact with the platform.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
