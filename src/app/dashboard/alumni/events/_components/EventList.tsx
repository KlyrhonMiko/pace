"use client";

import EventCard from "./EventCard";

interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    description: string;
    attendees: number;
    capacity: number;
    image?: string;
    isRegistered?: boolean;
}

interface EventListProps {
    filteredEvents: Event[];
    totalEvents: number;
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    EVENTS_PER_PAGE: number;
    clearFilters: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export default function EventList({
    filteredEvents,
    totalEvents,
    totalPages,
    currentPage,
    setCurrentPage,
    EVENTS_PER_PAGE,
    clearFilters,
    searchQuery,
    onSearchChange,
}: EventListProps) {
    const isLoading = false;

    return (
        <div className="relative rounded-2xl bg-white border border-slate-200/80 p-7 shadow-lg shadow-slate-200/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-50 opacity-20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-slate-100 opacity-10 blur-3xl" />
            </div>

            <div className="relative z-10">
                {/* Search Bar */}
                <div className="mb-7">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2.5 block">Search Events</label>
                    <div className="relative group">
                        <svg
                            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by title, description..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition-all bg-white hover:border-slate-300"
                        />
                    </div>
                </div>

                {/* Events Display */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative h-10 w-10">
                                <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-700 animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Loading events...</p>
                        </div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="relative z-10 py-16 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                                <svg
                                    className="h-10 w-10 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No events found</h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                            {searchQuery
                                ? "Try adjusting your search keywords or removing filters"
                                : "No events match your current filters"}
                        </p>
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700 transition-colors px-4 py-2 rounded-lg hover:bg-emerald-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Results Summary */}
                        <div className="mb-6 pt-2 flex items-center justify-between border-t border-slate-200/50">
                            <div className="text-sm text-slate-700">
                                <span className="font-bold text-emerald-700">{(currentPage - 1) * EVENTS_PER_PAGE + 1}</span>
                                <span className="text-slate-500"> – </span>
                                <span className="font-bold text-emerald-700">{Math.min(currentPage * EVENTS_PER_PAGE, totalEvents)}</span>
                                <span className="text-slate-500"> of </span>
                                <span className="font-bold text-slate-900">{totalEvents}</span>
                                <span className="text-slate-500"> events</span>
                            </div>
                        </div>

                        {/* Event Cards */}
                        <div className="space-y-3.5 mt-6">
                            {filteredEvents.map((event) => (
                                <div key={event.id} className="group">
                                    <EventCard
                                        title={event.title}
                                        date={event.date}
                                        time={event.time}
                                        location={event.location}
                                        attendees={event.attendees}
                                        type={event.type}
                                        capacity={event.capacity}
                                        description={event.description}
                                        isRegistered={event.isRegistered}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-10 pt-6 border-t border-slate-200/50 flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
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
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
