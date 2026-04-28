"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Users, Loader2 } from "lucide-react";
import { fetchEvents, Event } from "../../_lib/events";
import { format, parseISO } from "date-fns";

export default function UpcomingFacultyEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchEvents({ limit: 3, status: "active" });
            setEvents(data.events);
            setLoading(false);
        }
        load();
    }, []);

    const getEventStyles = (idx: number) => {
        const styles = [
            { gradient: "from-emerald-700 to-emerald-800", hex: "#10b981", statusStyle: "bg-emerald-50/80 text-emerald-700 ring-emerald-100/60" },
            { gradient: "from-blue-500 to-blue-600", hex: "#3b82f6", statusStyle: "bg-blue-50/80 text-blue-700 ring-blue-100/60" },
            { gradient: "from-violet-500 to-violet-600", hex: "#8b5cf6", statusStyle: "bg-violet-50/80 text-violet-700 ring-violet-100/60" },
        ];
        return styles[idx % styles.length];
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white border border-gray-100/80 p-6 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    <p className="text-sm text-gray-400 font-medium">Fetching events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Platform Events</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Upcoming activities</p>
                    </div>
                </div>
                <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                    View All
                </button>
            </div>

            {/* Events List */}
            <div className="px-6 pb-6 flex-1 space-y-3">
                {events.slice(0, 3).map((event, idx) => {
                    const styles = getEventStyles(idx);
                    const eventDate = parseISO(event.date);
                    const month = format(eventDate, "MMM");
                    const day = format(eventDate, "d");

                    return (
                        <div
                            key={event.event_id}
                            className="group/item relative rounded-xl border border-gray-100/60 bg-gradient-to-b from-gray-50/50 to-white p-4 hover:border-gray-200/80 hover:shadow-md transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                {/* Date block */}
                                <div
                                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${styles.gradient} text-white flex-shrink-0 transition-transform duration-300 group-hover/item:scale-105`}
                                    style={{ boxShadow: `0 4px 14px ${styles.hex}30` }}
                                >
                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{month}</span>
                                    <span className="text-xl font-extrabold leading-tight">{day}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate group-hover/item:text-gray-900">{event.event_name}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                                            <MapPin className="h-3 w-3 text-gray-400" />
                                            {event.location}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                            <Users className="h-3 w-3 text-gray-400" />
                                            {event.attendees}
                                        </span>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 flex-shrink-0 ${styles.statusStyle}`}>
                                    Upcoming
                                </span>
                            </div>
                        </div>
                    );
                })}
                {events.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-sm text-gray-400">No upcoming events found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
