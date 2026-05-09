"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import FacultyAcademicView from "./_components/FacultyAcademicView";

export default function FacultyAcademicPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Academic Structure"
                description="View university departments, courses, and alumni distribution across programs."
                currentPage="Academic Structure"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            />

            <FacultyAcademicView />
        </div>
    );
}
