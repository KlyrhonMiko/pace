"use client";

import EventManagement from "../../_components/events/EventManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function FacultyEventsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Event HUB"
                description="Organize workshops, seminars, and networking sessions for your alumni. Build a vibrant academic community."
                currentPage="Event HUB"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            />

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />
                <EventManagement />
            </div>
        </div>
    );
}
