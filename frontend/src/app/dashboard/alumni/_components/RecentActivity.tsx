"use client";

import { useState, useEffect } from "react";
import ActivityItem from "./ActivityItem";
import { Zap, Send, Edit, CalendarDays, Bookmark, Loader2, Sparkles, Briefcase, LogIn, LogOut } from "lucide-react";
import { fetchAlumniActivity, Activity } from "../../_lib/dashboard";

export default function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadActivity() {
            try {
                const data = await fetchAlumniActivity(4);
                setActivities(data);
            } catch (error) {
                console.error("Failed to load activity", error);
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
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
        // Handle custom format: "MM/DD/YYYY - HH:mm:ss"
        let date: Date;
        if (dateStr.includes(" - ")) {
            const [datePart, timePart] = dateStr.split(" - ");
            const [m, d, y] = datePart.split("/").map(Number);
            const [h, min, s] = timePart.split(":").map(Number);
            date = new Date(y, m - 1, d, h, min, s);
        } else {
            date = new Date(dateStr);
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
                            <p className="text-xs text-gray-500">Your latest university updates</p>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-xs">Fetching life stream...</p>
                        </div>
                    ) : activities.length > 0 ? (
                        activities.map((activity, idx) => (
                            <ActivityItem
                                key={activity.activity_id || idx}
                                title={activity.description?.replace(/_/g, ' ') || 'Unknown Activity'}
                                description={activity.description?.includes("UPDATED") ? "Modified your career profile details" : "University platform activity"}
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
