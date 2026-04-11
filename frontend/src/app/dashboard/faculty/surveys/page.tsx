"use client";

import SurveyManagement from "../../_components/surveys/SurveyManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function FacultySurveysPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Survey HUB"
                description="Create surveys, gather student feedback, and manage your reusable question library for academic evaluations."
                currentPage="Survey HUB"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            />

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />
                <SurveyManagement />
            </div>
        </div>
    );
}
