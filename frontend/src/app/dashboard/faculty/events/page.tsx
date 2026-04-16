"use client";

import EventManagement from "../../_components/events/EventManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function FacultyEventsPage() {
    return (
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-emerald-100 opacity-30 blur-3xl" />
                <div className="absolute bottom-20 right-1/4 h-48 w-48 rounded-full bg-teal-100 opacity-30 blur-3xl" />
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <PageHeader
                    title="Event HUB"
                    description="Organize workshops, seminars, and networking sessions for your alumni. Build a vibrant academic community."
                    currentPage="Event HUB"
                    dashboardHref="/dashboard/faculty"
                    dashboardName="Faculty Dashboard"
                />
            </div>

            {/* Main Content */}
            <EventManagement />
        </div>
    );
}
