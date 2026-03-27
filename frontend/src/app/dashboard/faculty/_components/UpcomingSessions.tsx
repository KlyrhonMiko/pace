"use client";

import { useEffect, useState } from "react";
import { Briefcase, FileText, Users, MonitorPlay, CalendarDays, Loader2 } from "lucide-react";
import { fetchFacultySessions, MentoringSessionItem } from "../../_lib/dashboard";
import { format, isToday, isTomorrow, isAfter, addHours } from "date-fns";

export default function UpcomingSessions() {
    const [sessions, setSessions] = useState<MentoringSessionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchFacultySessions();
            setSessions(data);
            setLoading(false);
        }
        load();
    }, []);

    const colorMap: Record<string, { gradient: string; hex: string; bg: string; text: string; ring: string; icon: React.ReactNode }> = {
        emerald: { gradient: "from-emerald-600 to-emerald-700", hex: "#10b981", bg: "bg-emerald-50", text: "text-emerald-800", ring: "ring-emerald-100/60", icon: <Briefcase className="w-4 h-4" /> },
        blue: { gradient: "from-blue-400 to-blue-500", hex: "#3b82f6", bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100/60", icon: <FileText className="w-4 h-4" /> },
        violet: { gradient: "from-violet-400 to-violet-500", hex: "#8b5cf6", bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100/60", icon: <Users className="w-4 h-4" /> },
        amber: { gradient: "from-amber-400 to-amber-500", hex: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100/60", icon: <MonitorPlay className="w-4 h-4" /> },
    };

    const getStyles = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("career")) return colorMap.emerald;
        if (t.includes("resume")) return colorMap.blue;
        if (t.includes("group") || t.includes("seminar")) return colorMap.violet;
        return colorMap.amber;
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white border border-gray-100/80 p-6 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-400 font-medium">Loading schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Upcoming Sessions</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Mentoring schedule</p>
                    </div>
                </div>
            </div>

            {/* Sessions List */}
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
                        {sessions.map((s) => {
                            const sessionDate = new Date(s.time);
                            const colors = getStyles(s.title);
                            const dayStr = isToday(sessionDate) ? "Today" : isTomorrow(sessionDate) ? "Tomorrow" : format(sessionDate, "EEE");
                            const timeStr = format(sessionDate, "h:mm a");
                            const isLive = isAfter(sessionDate, addHours(new Date(), -1)) && isAfter(addHours(new Date(), 1), sessionDate);

                            return (
                                <div
                                    key={s.id}
                                    className="group/item relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/60 transition-all duration-200 cursor-pointer"
                                >
                                    {/* Icon node */}
                                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                                        <div
                                            className={`w-[30px] h-[30px] rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white ring-[3px] ring-white transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md`}
                                            style={{ boxShadow: `0 4px 12px ${colors.hex}25` }}
                                        >
                                            {colors.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-semibold text-gray-800 leading-tight group-hover/item:text-gray-900 transition-colors">
                                                {s.title}
                                            </p>
                                            {isLive && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-700 text-[8px] font-bold text-white uppercase tracking-wider">
                                                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] text-gray-500">{s.student}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className={`text-[11px] font-semibold ${isLive ? colors.text : "text-gray-500"}`}>
                                                {dayStr}, {timeStr}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <div className="flex-shrink-0 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 ${s.status === "Scheduled"
                                            ? "bg-blue-50/80 text-blue-700 ring-blue-100/60"
                                            : "bg-gray-50/80 text-gray-600 ring-gray-100/60"
                                            } group-hover/item:ring-gray-200/80 transition-all`}>
                                            {s.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {sessions.length === 0 && (
                            <div className="py-10 text-center">
                                <p className="text-sm text-gray-400">No upcoming sessions.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
