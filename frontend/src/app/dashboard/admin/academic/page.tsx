"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import AcademicManagement from "./_components/AcademicManagement";

export default function AcademicStructurePage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Academic Structure"
                description="Manage university departments and courses. View program sizes and alumni distribution."
                currentPage="Academic Structure"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            />

            <AcademicManagement />
        </div>
    );
}
