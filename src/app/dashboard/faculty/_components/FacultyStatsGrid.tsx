"use client";

import { Users, TrendingUp, CalendarDays, Target, Link } from "lucide-react";

export default function FacultyStatsGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Students Advised */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25">
                        <Users className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +8
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">64</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Students Advised</p>
                {/* Mini sparkline */}
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[3, 5, 4, 7, 6, 8, 9, 7, 10, 12].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-emerald-100 group-hover:bg-emerald-200 transition-colors" style={{ height: `${(v / 12) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Events Organized */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +3
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">12</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Events Organized</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[4, 6, 5, 8, 7, 9, 8, 10, 9, 11].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-blue-100 group-hover:bg-blue-200 transition-colors" style={{ height: `${(v / 12) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Placement Rate */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                        <Target className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +5%
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">78%</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Placement Rate</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[2, 4, 3, 5, 4, 6, 7, 5, 8, 9].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-violet-100 group-hover:bg-violet-200 transition-colors" style={{ height: `${(v / 10) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Referrals */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25">
                        <Link className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +6
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">23</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Referrals Sent</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[1, 2, 1, 3, 2, 4, 3, 5, 4, 6].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-amber-100 group-hover:bg-amber-200 transition-colors" style={{ height: `${(v / 7) * 100}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
