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
import { Skeleton } from "@/components/ui/skeleton";
import {
    type Event,
} from "@/app/dashboard/_lib/events";

interface EventListProps {
    events: Event[];
    isLoading: boolean;
    // Management handlers (optional)
    openUpdateModal?: (event: Event) => void;
    handleDeleteClick?: (eventId: string) => void;
    onViewAttendees?: (event: Event) => void;
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
    onViewAttendees,
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
                        <div className="space-y-3.5 skeleton-stagger">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                                >
                                    <div className="relative flex flex-col md:grid md:grid-cols-[200px_1fr] min-h-[200px]">
                                        {/* Left: Date showcase placeholder */}
                                        <div className="relative flex flex-col items-center justify-center h-48 md:h-auto skeleton-shimmer" style={{
                                            background: 'linear-gradient(160deg, hsl(160 40% 96%), hsl(160 30% 93%))'
                                        }}>
                                            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                            <div className="relative z-10 flex flex-col items-center">
                                                <Skeleton className="h-3 w-8 rounded bg-emerald-200/40" />
                                                <Skeleton className="h-10 w-12 rounded-md mt-1 bg-slate-300/30" />
                                                <div className="mt-2.5 h-px w-8 rounded-full bg-emerald-200/30" />
                                                <Skeleton className="h-[10px] w-20 rounded mt-2 bg-slate-300/20" />
                                            </div>
                                        </div>

                                        {/* Right: Content placeholder */}
                                        <div className="relative flex flex-col justify-center p-5 md:py-6 md:pr-6 md:pl-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <Skeleton className="h-[10px] w-20 rounded" />
                                                <Skeleton className="h-8 w-28 rounded-lg" />
                                            </div>
                                            <Skeleton className="h-[18px] w-3/4 rounded-md" />
                                            <div className="mt-2 space-y-1.5">
                                                <Skeleton className="h-[11px] w-full rounded" />
                                                <Skeleton className="h-[11px] w-2/3 rounded" />
                                            </div>
                                            <div className="my-3 h-px w-full bg-slate-100" />
                                            <div className="flex flex-wrap gap-1.5">
                                                <Skeleton className="h-7 w-24 rounded-lg" />
                                                <Skeleton className="h-7 w-28 rounded-lg" />
                                                <Skeleton className="h-7 w-20 rounded-lg" />
                                                <Skeleton className="h-7 w-32 rounded-lg" />
                                            </div>
                                            <div className="mt-4 flex items-center gap-3">
                                                <Skeleton className="h-1.5 flex-1 rounded-full" />
                                                <Skeleton className="h-[10px] w-20 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                    onViewAttendees={onViewAttendees}
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
