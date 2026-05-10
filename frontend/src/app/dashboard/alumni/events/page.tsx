"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import EventFilters from "./_components/EventFilters";
import EventList from "@/app/dashboard/_components/events/EventList";
import PageHeader from "@/components/dashboard/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchEvents, fetchEventHistory, fetchEventTypes, registerEvent, unregisterEvent, type Event } from "../../_lib/events";

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
        const [eventsResult, historyResult, types] = await Promise.all([
            fetchEvents({ limit: 100, sort_by: "date", sort_order: "desc" }),
            showRegisteredOnly ? fetchEventHistory() : Promise.resolve({ events: [], total: 0 }),
            fetchEventTypes(),
        ]);
        const sourceEvents = showRegisteredOnly ? historyResult.events : eventsResult.events;
        setEvents(sourceEvents);

        const clientFacets = sourceEvents.reduce<Record<string, number>>((acc, event) => {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
        }, {});

        const typeLabels = types.map(t => ({
            id: t.event_type_id,
            label: t.event_name,
            count: clientFacets[t.event_name] || 0
        }));

        setEventTypeLabels(typeLabels);

        setIsLoading(false);
    }, [showRegisteredOnly]);

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


    return (
        <div className="space-y-5">
            {/* Page Header */}
            <PageHeader
                title="Events & Networking"
                description="Discover professional development events, seminars, and networking opportunities"
                currentPage="Events & Networking"
            />

            {/* 2-Column Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Left Column: Event List */}
                <div className="lg:col-span-3">
                    <EventList
                        events={paginatedEvents}
                        isLoading={isLoading}
                        fetchEvents={loadData}
                        onToggleRegistration={handleToggleRegistration}
                        totalEvents={totalEvents}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        eventsPerPage={EVENTS_PER_PAGE}
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
                        searchQuery={searchQuery}
                        onSearchChange={(query) => {
                            setSearchQuery(query);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
