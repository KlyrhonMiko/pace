import ActivityItem from "./ActivityItem";
import { Zap, Send, Edit, CalendarDays, Bookmark } from "lucide-react";

export default function RecentActivity() {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/30 hover:border-blue-100/60 h-full flex flex-col">
            {/* Decorative top gradient bar */}


            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
                            <p className="text-xs text-gray-500">Your latest updates &amp; actions</p>
                        </div>
                    </div>

                </div>

                {/* Activity Timeline */}
                <div className="space-y-0">
                    <ActivityItem
                        title="Application Submitted"
                        description="Junior Developer at Accenture Philippines"
                        time="2h ago"
                        iconBg="bg-emerald-700"
                        icon={
                            <Send className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                        }
                    />
                    <ActivityItem
                        title="Profile Updated"
                        description="Added new skills: React, TypeScript"
                        time="Yesterday"
                        iconBg="bg-blue-500"
                        icon={
                            <Edit className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                        }
                    />
                    <ActivityItem
                        title="Interview Scheduled"
                        description="Globe Telecom - Feb 18 at 10:00 AM"
                        time="2d ago"
                        iconBg="bg-violet-500"
                        icon={
                            <CalendarDays className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                        }
                    />
                    <ActivityItem
                        title="Job Saved"
                        description="Technical Support at DITO Telecommunity"
                        time="3d ago"
                        iconBg="bg-amber-500"
                        isLast={true}
                        icon={
                            <Bookmark className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                        }
                    />
                </div>
            </div>
        </div>
    );
}
