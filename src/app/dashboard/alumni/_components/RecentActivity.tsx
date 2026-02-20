import ActivityItem from "./ActivityItem";

export default function RecentActivity() {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/30 hover:border-blue-100/60">
            {/* Decorative top gradient bar */}


            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-200/50">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
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
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        }
                    />
                    <ActivityItem
                        title="Profile Updated"
                        description="Added new skills: React, TypeScript"
                        time="Yesterday"
                        iconBg="bg-blue-500"
                        icon={
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                    />
                    <ActivityItem
                        title="Interview Scheduled"
                        description="Globe Telecom - Feb 18 at 10:00 AM"
                        time="2d ago"
                        iconBg="bg-violet-500"
                        icon={
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <ActivityItem
                        title="Job Saved"
                        description="Technical Support at DITO Telecommunity"
                        time="3d ago"
                        iconBg="bg-amber-500"
                        isLast={true}
                        icon={
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
