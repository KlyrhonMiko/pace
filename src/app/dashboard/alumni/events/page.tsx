"use client";

import { useState, useMemo, useEffect } from "react";
import EventFilters from "./_components/EventFilters";
import EventList from "./_components/EventList";
import EventsHeader from "./_components/EventsHeader";

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const EVENTS_PER_PAGE = 5;

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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <EventsHeader />

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
