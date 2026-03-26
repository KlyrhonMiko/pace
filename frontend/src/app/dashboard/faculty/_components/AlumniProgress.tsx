"use client";

import { useEffect, useState } from "react";
import { Users, Check, Loader2 } from "lucide-react";
import { fetchFacultyAlumniProgress, AlumniProgressItem } from "../../_lib/dashboard";

export default function AlumniProgress() {
    const [alumnis, setAlumnis] = useState<AlumniProgressItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchFacultyAlumniProgress();
            setAlumnis(data);
            setLoading(false);
        }
        load();
    }, []);

    // Helper for initials/colors (can be random or derived)
    const getStyles = (initials: string) => {
        const colors = [
            "from-emerald-700 to-emerald-800",
            "from-blue-500 to-blue-600",
            "from-violet-500 to-violet-600",
            "from-rose-500 to-rose-600",
            "from-amber-500 to-amber-600",
            "from-cyan-500 to-cyan-600"
        ];
        const statusColors: Record<string, string> = {
            "Employed": "bg-emerald-700",
            "Interviewing": "bg-blue-500",
            "Searching": "bg-amber-500",
            "Applied": "bg-violet-500"
        };
        const statusBgs: Record<string, string> = {
            "Employed": "bg-emerald-50/80 text-emerald-700 ring-emerald-100/60",
            "Interviewing": "bg-blue-50/80 text-blue-700 ring-blue-100/60",
            "Searching": "bg-amber-50/80 text-amber-700 ring-amber-100/60",
            "Applied": "bg-violet-50/80 text-violet-700 ring-violet-100/60"
        };

        const charCode = initials.charCodeAt(0) || 0;
        const color = colors[charCode % colors.length];

        return { color, statusColor: statusColors, statusBg: statusBgs };
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white border border-gray-100/80 p-6 flex items-center justify-center min-h-[300px] lg:col-span-2">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-sm text-gray-400 font-medium">Loading advisees...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col lg:col-span-2">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Career Journey Tracking</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Recent alumni status updates</p>
                    </div>
                </div>
                <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                    View All
                </button>
            </div>

            {/* Alumni Card Grid */}
            <div className="px-6 pb-2 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {alumnis.slice(0, 6).map((alumnus, idx) => {
                        const { color, statusColor, statusBg } = getStyles(alumnus.initials);
                        const sColor = statusColor[alumnus.status] || "bg-gray-400";
                        const sBg = statusBg[alumnus.status] || "bg-gray-50 text-gray-500 ring-gray-100";

                        return (
                            <div
                                key={idx}
                                className="group/card relative rounded-xl border border-gray-100/60 bg-gradient-to-b from-gray-50/50 to-white p-4 hover:border-gray-200/80 hover:shadow-md transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover/card:scale-105`}>
                                            {alumnus.initials}
                                        </div>
                                        {/* Status dot overlay */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${sColor} ring-2 ring-white flex items-center justify-center`}>
                                            {alumnus.status === "Employed" ? (
                                                <Check className="w-2 h-2 text-white stroke-[4]" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-gray-900 truncate group-hover/card:text-gray-900">{alumnus.name}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{alumnus.course}</p>
                                    </div>
                                </div>

                                <div className="mt-3.5 pt-3 border-t border-gray-100/60 flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 ${sBg}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${sColor}`} />
                                        {alumnus.status}
                                    </span>
                                    {alumnus.company && alumnus.company !== "N/A" && (
                                        <span className="text-[10px] text-gray-400 truncate ml-2 font-medium">{alumnus.company}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


        </div>
    );
}
