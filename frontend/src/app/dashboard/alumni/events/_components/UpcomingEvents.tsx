"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const events = [
    {
        title: "PLP Career Fair 2024",
        day: "15",
        month: "Feb",
        time: "9:00 AM - 5:00 PM",
        location: "PLP Main Campus",
        attendees: 234,
        type: "Career Fair",
        typeColor: "emerald" as const,
    },
    {
        title: "Resume Writing Workshop",
        day: "20",
        month: "Feb",
        time: "2:00 PM - 4:00 PM",
        location: "Virtual Event",
        attendees: 89,
        type: "Workshop",
        typeColor: "violet" as const,
    },
    {
        title: "Tech Networking Night",
        day: "28",
        month: "Feb",
        time: "6:00 PM - 9:00 PM",
        location: "BGC Arts Center",
        attendees: 156,
        type: "Networking",
        typeColor: "blue" as const,
    },
];

const typeStyles = {
    emerald: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
    violet: "bg-violet-50 text-violet-600 border border-violet-200/60",
    blue: "bg-blue-50 text-blue-600 border border-blue-200/60",
} as const;

export default function UpcomingEvents() {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-violet-100/30 hover:border-violet-100/60 h-full flex flex-col">
            {/* Decorative top gradient bar */}


            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-lg shadow-violet-200/50">
                            <Calendar className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Upcoming Events</h2>
                            <p className="text-xs text-gray-500">Don&apos;t miss these opportunities</p>
                        </div>
                    </div>
                    <Link href="/dashboard/alumni/events" className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                        View All
                    </Link>
                </div>

                {/* Event List */}
                <div className="space-y-3">
                    {events.slice(0, 3).map((event, idx) => (
                        <div
                            key={idx}
                            className="group/event flex gap-4 p-3.5 rounded-xl border border-gray-100/80 hover:border-violet-200/60 hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-purple-50/20 transition-all duration-200 cursor-pointer"
                        >
                            {/* Calendar Date Block */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100/80 group-hover/event:border-violet-200 group-hover/event:shadow-sm group-hover/event:from-violet-100/80 group-hover/event:to-purple-100/60 transition-all duration-200">
                                <span className="text-lg font-extrabold text-violet-700 leading-none">{event.day}</span>
                                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mt-0.5">{event.month}</span>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h3 className="text-sm font-semibold text-gray-900 group-hover/event:text-violet-800 transition-colors truncate">
                                        {event.title}
                                    </h3>
                                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${typeStyles[event.typeColor]}`}>
                                        {event.type}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-gray-400" strokeWidth={2} />
                                        {event.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-gray-400" strokeWidth={2} />
                                        {event.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-gray-400" strokeWidth={2} />
                                        <span className="font-semibold text-violet-600">{event.attendees}</span>
                                        <span className="text-gray-400">attending</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
