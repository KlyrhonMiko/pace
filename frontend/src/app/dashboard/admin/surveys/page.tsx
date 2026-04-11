"use client";

import SurveyManagement from "../../_components/surveys/SurveyManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function AdminSurveysPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Survey Management"
                description="Create surveys, collect feedback, and manage the reusable question library for your alumni evaluations."
                currentPage="Survey Management"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            />

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                <SurveyManagement />
            </div>
        </div>
    );
}
