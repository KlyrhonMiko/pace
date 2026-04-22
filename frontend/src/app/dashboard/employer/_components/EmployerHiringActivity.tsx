"use client";

import { TrendingUp } from "lucide-react";

export default function EmployerHiringActivity() {
    return (
        <div className="flex flex-col h-full overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="border-b border-gray-50 px-6 py-5">
                <h3 className="text-lg font-bold text-gray-900">Hiring Activity</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-6">
                {/* Highlight Card */}
                <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <TrendingUp className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-emerald-900">Job Views are Up!</h3>
                            <p className="mt-1 text-sm text-emerald-700/80 leading-relaxed">
                                Your recent posting <span className="font-bold text-emerald-800">"Software Engineer"</span> has gathered 300% more views than your average postings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    <div className="relative group">
                        <div className="absolute -left-[20px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm group-hover:scale-125 transition-transform"></div>
                        <p className="text-sm text-gray-900 font-bold group-hover:text-emerald-900 transition-colors">Interview scheduled for PM role</p>
                        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Today at 2:00 PM</p>
                    </div>
                    <div className="relative group">
                        <div className="absolute -left-[20px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white shadow-sm group-hover:bg-emerald-300 transition-colors"></div>
                        <p className="text-sm text-gray-800 font-bold group-hover:text-emerald-900 transition-colors">Offer accepted by David Johnson</p>
                        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Yesterday</p>
                    </div>
                    <div className="relative group">
                        <div className="absolute -left-[20px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white shadow-sm group-hover:bg-emerald-300 transition-colors"></div>
                        <p className="text-sm text-gray-800 font-bold group-hover:text-emerald-900 transition-colors">New Job "Data Analyst" posted</p>
                        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Aug 15</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
