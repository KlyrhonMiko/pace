"use client";

import {
    Edit2,
    Trash2,
    Calendar,
    Clock,
    MapPin,
    RefreshCw,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
    getMonthAbbreviation,
    getDayNumber,
    formatEventDate,
    type Event,
} from "../../_lib/events";

interface EventListProps {
    events: Event[];
    isLoading: boolean;
    openUpdateModal: (event: Event) => void;
    handleDeleteClick: (eventId: string) => void;
    fetchEvents: () => void;
}

export default function EventList({
    events,
    isLoading,
    openUpdateModal,
    handleDeleteClick,
    fetchEvents,
}: EventListProps) {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 flex flex-col h-full">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <Calendar className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            Events Directory
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage and track upcoming events ({events.length})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchEvents}
                        className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-white bg-slate-50 border-slate-200/80 transition-all rounded-xl shadow-sm hover:shadow"
                        disabled={isLoading}
                        title="Refresh data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Details</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type & Location</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading events...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                            <Calendar className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500">No events found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.event_id} className="group transition-all duration-200 hover:bg-slate-50/50">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex flex-col items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                                                <span className="text-emerald-700 font-bold text-[10px] uppercase">{getMonthAbbreviation(event.date)}</span>
                                                <span className="text-emerald-800 font-extrabold text-lg leading-none">{getDayNumber(event.date)}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{event.event_name}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatEventDate(event.date)} • {event.time_start} - {event.time_end}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 w-fit border border-slate-200/60 mb-1">
                                                {event.event_type}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-slate-400" /> {event.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                                <span>{Math.round((event.attendees / (event.capacity || 1)) * 100)}%</span>
                                                <span>{event.attendees}/{event.capacity}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${(event.attendees / (event.capacity || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openUpdateModal(event)}
                                                className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg hover:shadow-sm"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(event.event_id)}
                                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg hover:shadow-sm"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
