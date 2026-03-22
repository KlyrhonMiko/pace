"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import EventFilters from "./_components/EventFilters";
import EventList from "./_components/EventList";
import EventsHeader from "./_components/EventsHeader";

import { fetchEvents, fetchEventTypes, registerEvent, unregisterEvent, type Event } from "../../_lib/events";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [eventTypeLabels, setEventTypeLabels] = useState<{ id: string; label: string; count: number }[]>([]);

    const EVENTS_PER_PAGE = 5;

    // Fetch events and event types from API
    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [eventsResult, types] = await Promise.all([
            fetchEvents({ limit: 100, sort_by: "date", sort_order: "desc" }),
            fetchEventTypes(),
        ]);
        setEvents(eventsResult.events);

        // Derive event type counts from the fetched events
        const counts: Record<string, number> = {};
        eventsResult.events.forEach(event => {
            counts[event.event_type] = (counts[event.event_type] || 0) + 1;
        });
        // Also include types with 0 events from the event-types table
        types.forEach(t => {
            if (!(t.event_name in counts)) {
                counts[t.event_name] = 0;
            }
        });
        setEventTypeLabels(
            Object.entries(counts).map(([label, count]) => ({
                id: label.toLowerCase().replace(/\s+/g, "-"),
                label,
                count,
            }))
        );

        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter and search logic (client-side on the fetched data)
    const filteredEvents = useMemo(() => {
        let result = events;

        if (searchQuery) {
            result = result.filter(
                (event) =>
                    event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedType) {
            result = result.filter((event) => event.event_type === selectedType);
        }

        if (showRegisteredOnly) {
            result = result.filter((event) => event.is_registered);
        }

        return result;
    }, [searchQuery, selectedType, showRegisteredOnly, events]);

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

    // Registration toggle with optimistic UI update
    const handleToggleRegistration = async (eventId: string) => {
        const event = events.find((e) => e.event_id === eventId);
        if (!event) return;

        const isCurrentlyRegistered = event.is_registered;

        // Optimistic UI update
        setEvents((prevEvents) =>
            prevEvents.map((e) => {
                if (e.event_id === eventId) {
                    return {
                        ...e,
                        is_registered: !isCurrentlyRegistered,
                        attendees: isCurrentlyRegistered 
                            ? Math.max(0, e.attendees - 1) 
                            : e.attendees + 1,
                    };
                }
                return e;
            })
        );

        // API call
        let success = false;
        if (isCurrentlyRegistered) {
            success = await unregisterEvent(eventId);
        } else {
            success = await registerEvent(eventId);
        }

        // Revert on failure
        if (!success) {
            setEvents((prevEvents) =>
                prevEvents.map((e) => {
                    if (e.event_id === eventId) {
                        return {
                            ...e,
                            is_registered: isCurrentlyRegistered,
                            attendees: isCurrentlyRegistered 
                                ? e.attendees + 1 
                                : Math.max(0, e.attendees - 1),
                        };
                    }
                    return e;
                })
            );
            console.error("Failed to toggle event registration");
            // Optionally, we could show a toast error here
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-5">
                <EventsHeader />
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-10 w-10">
                            <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-700 animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Loading events...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <EventsHeader />

            {/* 2-Column Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-5">
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
                <div className="lg:col-span-1 lg:sticky lg:top-5 lg:self-start">
                    <EventFilters
                        eventTypes={eventTypeLabels}
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
