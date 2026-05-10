"use client";

import { useEffect, useState, useRef } from "react";
import { Activity as ActivityIcon, Loader2, Zap, CalendarDays, Edit, Send, Sparkles, Briefcase, LogIn, LogOut, Bookmark } from "lucide-react";
import { fetchFacultyActivity, FacultyActivity } from "../../_lib/dashboard";
import ActivityItem from "../../alumni/_components/ActivityItem";

export default function RecentAlumniActivity() {
    const [activities, setActivities] = useState<FacultyActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(5);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = entry.contentRect.height;
                // Average height of an ActivityItem is ~66px including padding
                const count = Math.floor(height / 66);
                if (count > 0) setVisibleCount(Math.min(count, 5));
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        async function load() {
            const data = await fetchFacultyActivity();
            setActivities(data);
            setLoading(false);
        }
        load();
    }, []);

    const getActivityIcon = (type: string, description: string = "") => {
        const n = description.toUpperCase();
        if (n.includes("REGISTERED") || n.includes("EVENT")) return <CalendarDays className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (n.includes("PROFILE") || n.includes("UPDATED")) return <Edit className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (n.includes("APPLICATION") || n.includes("SUBMITTED") || n.includes("SURVEY")) return <Send className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (n.includes("CREATED") || n.includes("JOINED")) return <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (n.includes("APPLIED") || n.includes("JOB")) return <Briefcase className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (n.includes("LOGGED IN")) return <LogIn className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        if (n.includes("LOGGED OUT")) return <LogOut className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
        return <Bookmark className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />;
    };

    const getIconBg = (type: string, description: string = "") => {
        const n = description.toUpperCase();
        if (n.includes("REGISTERED") || n.includes("EVENT")) return "bg-violet-500";
        if (n.includes("PROFILE") || n.includes("UPDATED")) return "bg-blue-500";
        if (n.includes("APPLICATION") || n.includes("SUBMITTED") || n.includes("SURVEY")) return "bg-emerald-700";
        if (n.includes("CREATED") || n.includes("JOINED")) return "bg-indigo-500";
        if (n.includes("APPLIED") || n.includes("JOB")) return "bg-blue-600";
        if (n.includes("LOGGED IN")) return "bg-emerald-500";
        if (n.includes("LOGGED OUT")) return "bg-rose-500";
        return "bg-amber-500";
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

    if (loading) {
        return (
            <div className="rounded-2xl bg-white border border-gray-100 p-6 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <p className="text-xs text-gray-400 font-medium tracking-wide italic">Fetching activity stream...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/30 hover:border-blue-100/60 flex flex-col max-h-full">
            <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Alumni Activity</h2>
                            <p className="text-xs text-gray-500">Latest platform-wide updates</p>
                        </div>
                    </div>
                    <button className="text-[11px] font-semibold text-gray-500 hover:text-blue-600 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 ring-1 ring-gray-100/60 hover:ring-blue-100">
                        View All
                    </button>
                </div>

                {/* Activity Timeline */}
                <div ref={containerRef} className="flex-1 overflow-hidden">
                    {activities.length > 0 ? (
                        activities.slice(0, visibleCount).map((activity, idx) => (
                            <ActivityItem
                                key={activity.id || idx}
                                title={activity.description?.replace(/_/g, ' ') || 'Unknown Activity'}
                                description={activity.description?.includes("UPDATED") ? "Modified platform profile details" : "Alumni dashboard activity"}
                                time={formatTime(activity.created_at || new Date().toISOString())}
                                iconBg={getIconBg(activity.type, activity.description)}
                                isLast={idx === Math.min(activities.length, visibleCount) - 1}
                                icon={getActivityIcon(activity.type, activity.description)}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
                            <Zap className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-sm font-medium text-gray-500">No recent activity</p>
                            <p className="text-xs text-gray-400 mt-1">Updates will appear as alumni interact with the platform.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
