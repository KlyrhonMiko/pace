"use client";

import { TrendingUp, Activity } from "lucide-react";

export default function EmployerHiringActivity() {
    return (
        <div className="group/card flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                    <Activity className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">Hiring Activity</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Track your pipeline progress</p>
                </div>
            </div>


            <div className="p-6 flex-1 flex flex-col gap-6">

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
