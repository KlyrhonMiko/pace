"use client";

import { useState, useMemo, useEffect } from "react";
import EventFilters from "./_components/EventFilters";
import EventList from "./_components/EventList";
import { eventTypes as _unused_eventTypes } from "./_components/constants";
import { getStoredEvents, saveStoredEvents, type Event } from "../../_lib/events";

// Mock data is now managed in src/app/dashboard/_lib/events.ts

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Initial load and synchronization
    useEffect(() => {
        setEvents(getStoredEvents());

        const handleSync = () => {
            setEvents(getStoredEvents());
        };

        window.addEventListener("eventsUpdated", handleSync);
        window.addEventListener("storage", handleSync);
        return () => {
            window.removeEventListener("eventsUpdated", handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, []);

    const EVENTS_PER_PAGE = 10;

    // Filter and search logic
    const filteredEvents = useMemo(() => {
        let result = events;

        // Search filter
        if (searchQuery) {
            result = result.filter(
                (event) =>
                    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Type filter
        if (selectedType) {
            result = result.filter((event) => event.type === selectedType);
        }

        // Registered only filter
        if (showRegisteredOnly) {
            result = result.filter((event) => event.isRegistered);
        }

        return result;
    }, [searchQuery, selectedType, showRegisteredOnly, events]);

    const derivedEventTypes = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(event => {
            counts[event.type] = (counts[event.type] || 0) + 1;
        });

        return Object.entries(counts).map(([label, count]) => ({
            id: label.toLowerCase().replace(/\s+/g, '-'),
            label,
            count
        }));
    }, [events]);



    const totalEvents = filteredEvents.length;
    const totalPages = Math.ceil(totalEvents / EVENTS_PER_PAGE);
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * EVENTS_PER_PAGE,
        currentPage * EVENTS_PER_PAGE
    );

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedType(null);
        setShowRegisteredOnly(false);
        setCurrentPage(1);
    };

    const handleToggleRegistration = (eventId: number) => {
        const updatedEvents = events.map(event => {
            if (event.id === eventId) {
                const isRegistering = !event.isRegistered;
                return {
                    ...event,
                    isRegistered: isRegistering,
                    attendees: isRegistering ? event.attendees + 1 : event.attendees - 1
                };
            }
            return event;
        });
        setEvents(updatedEvents);
        saveStoredEvents(updatedEvents);
    };

    const registeredCount = events.filter(e => e.isRegistered).length;

    return (
        <div className="space-y-6">
            {/* Redesigned Header to match Overview Page */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-500 p-6 lg:p-10 text-white shadow-xl shadow-emerald-900/10">
                {/* Decorative mesh */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal-300/20 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
                </div>

                {/* Grid overlay pattern */}
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                }} />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    {/* Left: Content */}
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                            Events Hub
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Events & Networking</h1>
                        <p className="text-emerald-50/80 text-sm lg:text-base leading-relaxed">
                            Discover professional development events, seminars, and networking opportunities.
                            Connect with industry leaders and expand your career network.
                        </p>
                    </div>

                    {/* Right: Quick Stats */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[140px]">
                            <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-wider mb-1">Available</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{totalEvents}</span>
                                <span className="text-xs text-emerald-100/60 uppercase">Events</span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[140px]">
                            <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-wider mb-1">Registered</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{registeredCount}</span>
                                <span className="text-xs text-emerald-100/60 uppercase">Signed Up</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2-Column Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Event List */}
                <div className="lg:col-span-3">
                    <EventList
                        filteredEvents={paginatedEvents}
                        totalEvents={totalEvents}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        EVENTS_PER_PAGE={EVENTS_PER_PAGE}
                        clearFilters={clearFilters}
                        searchQuery={searchQuery}
                        onSearchChange={(query) => {
                            setSearchQuery(query);
                            setCurrentPage(1);
                        }}
                        onToggleRegistration={handleToggleRegistration}
                    />
                </div>

                {/* Right Column: Filters */}
                <div className="lg:col-span-1">
                    <EventFilters
                        eventTypes={derivedEventTypes}
                        selectedType={selectedType}
                        setSelectedType={(type) => {
                            setSelectedType(type);
                            setCurrentPage(1);
                        }}
                        showRegisteredOnly={showRegisteredOnly}
                        setShowRegisteredOnly={(show) => {
                            setShowRegisteredOnly(show);
                            setCurrentPage(1);
                        }}
                        onClearFilters={clearFilters}
                    />
                </div>
            </div>
        </div>
    );
}
