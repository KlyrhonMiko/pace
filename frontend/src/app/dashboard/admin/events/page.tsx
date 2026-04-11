"use client";

import EventManagement from "../../_components/events/EventManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function AdminEventsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Event Management"
                description="Create, update, and manage professional events across the platform. Maintain high-quality standards for our alumni community."
                currentPage="Event Management"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            />

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                <EventManagement />
            </div>
        </div>
    );
}
