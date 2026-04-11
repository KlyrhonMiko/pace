"use client";

import AlumniManagement from "./_components/AlumniManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function FacultyAlumniPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Alumni Management"
                description="View and manage alumni records, track academic performance, and maintain student details for your department."
                currentPage="Alumni Management"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            />

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />
                <AlumniManagement />
            </div>
        </div>
    );
}
