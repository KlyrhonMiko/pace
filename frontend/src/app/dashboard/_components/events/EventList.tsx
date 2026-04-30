"use client";

import {
    Calendar,
    RefreshCw,
    Loader2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";
import {
    type Event,
} from "@/app/dashboard/_lib/events";

interface EventListProps {
    events: Event[];
    isLoading: boolean;
    // Management handlers (optional)
    openUpdateModal?: (event: Event) => void;
    handleDeleteClick?: (eventId: string) => void;
    fetchEvents: () => void;
    // Registration handler (optional)
    onToggleRegistration?: (eventId: string) => void;
    // Pagination (optional)
    totalEvents?: number;
    totalPages?: number;
    currentPage?: number;
    setCurrentPage?: (page: number) => void;
    eventsPerPage?: number;
}

export default function EventList({
    events,
    isLoading,
    openUpdateModal,
    handleDeleteClick,
    fetchEvents,
    onToggleRegistration,
    totalEvents,
    totalPages,
    currentPage,
    setCurrentPage,
    eventsPerPage,
}: EventListProps) {
    const isManagementMode = !!(openUpdateModal || handleDeleteClick);
    const hasPagination = totalPages && totalPages > 1 && setCurrentPage && currentPage;

    return (
        <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/30 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-50 opacity-20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-slate-100 opacity-10 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header Area */}
                <div className="p-7 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <Calendar className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {isManagementMode ? "Events Directory" : "Available Events"}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {isManagementMode 
                                    ? `Manage and track platform activities`
                                    : `Discover and register for upcoming events`}
                                {totalEvents !== undefined && ` (${totalEvents})`}
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

                {/* List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
                    {isLoading ? (
                        <div className="py-32 text-center bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading events...</p>
                            </div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="py-32 text-center bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                    <Calendar className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-semibold text-slate-500">No events found.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {events.map((event) => (
                                <EventCard
                                    key={event.event_id}
                                    event={event}
                                    onEdit={openUpdateModal}
                                    onDelete={handleDeleteClick}
                                    onToggleRegistration={onToggleRegistration}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {hasPagination && (
                        <div className="mt-10 pt-6 border-t border-slate-200/50 flex items-center justify-center gap-3">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                                Previous
                            </button>

                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    const pageNum = currentPage - 2 + i;
                                    if (pageNum < 1 || pageNum > totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`h-10 min-w-10 rounded-lg text-sm font-bold transition-all ${currentPage === pageNum
                                                ? 'bg-gradient-to-br from-emerald-800 to-emerald-700 text-white shadow-lg shadow-emerald-800/30'
                                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" strokeWidth={2} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
