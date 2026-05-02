"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users, Loader2, ArrowUpRight } from "lucide-react";
import { fetchEvents, Event, getMonthAbbreviation, getDayNumber } from "../../../_lib/events";

function getAccentColor(eventType: string): string {
    switch (eventType?.toLowerCase()) {
        case "career fair":
            return "#059669";
        case "workshop":
            return "#7c3aed";
        case "seminar":
            return "#2563eb";
        case "networking":
            return "#d97706";
        default:
            return "#475569";
    }
}

export default function UpcomingEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadEvents() {
            try {
                const { events: eventData } = await fetchEvents({ limit: 3, status: "active" });
                setEvents(eventData);
            } catch (error) {
                console.error("Failed to load events", error);
            } finally {
                setLoading(false);
            }
        }
        loadEvents();
    }, []);

    return (
        <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/30 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Decorative elements (matching EventList) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-50 opacity-20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-slate-100 opacity-10 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <Calendar className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Upcoming Events</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Don&apos;t miss these opportunities</p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/alumni/events"
                        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50/60 ring-1 ring-emerald-100/60 hover:ring-emerald-200"
                    >
                        View All
                        <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                    </Link>
                </div>

                {/* Event List */}
                <div className="flex-1 p-6">
                    {loading ? (
                        <div className="py-16 text-center bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading events...</p>
                            </div>
                        </div>
                    ) : events.length > 0 ? (
                        <div className="space-y-3">
                            {events.map((event) => {
                                const accent = getAccentColor(event.event_type);
                                const month = getMonthAbbreviation(event.date);
                                const day = getDayNumber(event.date);

                                return (
                                    <Link
                                        key={event.event_id}
                                        href="/dashboard/alumni/events"
                                        className="group/event relative flex overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-0.5"
                                        style={{
                                            borderColor: `color-mix(in srgb, ${accent} 14%, #e2e8f0)`,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px -12px ${accent}25, 0 4px 12px -4px rgba(0,0,0,0.04)`;
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                                        }}
                                    >
                                        {/* Accent glow on hover */}
                                        <div
                                            className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover/event:opacity-100"
                                            style={{
                                                background: `linear-gradient(135deg, ${accent}08, transparent 40%, ${accent}05)`,
                                            }}
                                        />

                                        {/* Date showcase or image */}
                                        <div
                                            className={`relative flex-shrink-0 self-stretch overflow-hidden flex items-center justify-center ${event.image_url ? "w-32" : "w-20"}`}
                                            style={{
                                                background: event.image_url
                                                    ? undefined
                                                    : `linear-gradient(160deg, ${accent}10, ${accent}04 60%, transparent)`,
                                            }}
                                        >
                                            {event.image_url ? (
                                                <img
                                                    src={event.image_url}
                                                    alt={event.event_name}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                />
                                            ) : (
                                                <>
                                                    {/* Decorative grid dots */}
                                                    <div
                                                        className="absolute inset-0 opacity-[0.04]"
                                                        style={{
                                                            backgroundImage: `radial-gradient(circle, ${accent} 1px, transparent 1px)`,
                                                            backgroundSize: "14px 14px",
                                                        }}
                                                    />
                                                    {/* Subtle radial glow */}
                                                    <div
                                                        className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-500 opacity-[0.08] group-hover/event:opacity-[0.18]"
                                                        style={{ background: accent }}
                                                    />
                                                    <div className="relative z-10 flex flex-col items-center transition-transform duration-500 ease-out group-hover/event:-translate-y-0.5">
                                                        <span
                                                            className="text-[9px] font-black uppercase tracking-[0.18em] leading-none"
                                                            style={{ color: accent }}
                                                        >
                                                            {month}
                                                        </span>
                                                        <span className="mt-0.5 text-2xl font-black leading-none text-slate-800">
                                                            {day}
                                                        </span>
                                                        <div
                                                            className="mt-1.5 h-px w-5 rounded-full"
                                                            style={{ background: `${accent}30` }}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Event details */}
                                        <div className="relative z-10 flex-1 min-w-0 p-3">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <span
                                                    className="text-[9px] font-bold tracking-widest uppercase"
                                                    style={{ color: accent }}
                                                >
                                                    {event.event_type}
                                                </span>
                                                {event.is_registered && (
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                                                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                                        Registered
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                                                {event.event_name}
                                            </h3>

                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-slate-400" strokeWidth={2} />
                                                    {event.time_start} – {event.time_end}
                                                </span>
                                                <span className="inline-flex items-center gap-1 truncate">
                                                    <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" strokeWidth={2} />
                                                    <span className="truncate">{event.location}</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-slate-400" strokeWidth={2} />
                                                    <span className="font-semibold" style={{ color: accent }}>
                                                        {event.attendees}
                                                    </span>
                                                    <span className="text-slate-400">attending</span>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                    <Calendar className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500">No upcoming events</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Check back later for new opportunities.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
