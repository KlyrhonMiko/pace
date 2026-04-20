"use client";

import SurveyManagement from "../../_components/surveys/SurveyManagement";
import { useSurveyManagement } from "../../_components/surveys/useSurveyManagement";
import PageHeader from "@/components/dashboard/PageHeader";
import { ClipboardList, Library } from "lucide-react";

export default function AdminSurveysPage() {
    const surveyState = useSurveyManagement();
    const { activeTab, setActiveTab } = surveyState;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Survey HUB"
                description="Create surveys, collect feedback, and manage the reusable question library for your alumni evaluations."
                currentPage="Survey HUB"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            >
                {/* Tabs Navigation */}
                <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
                    <button
                        onClick={() => setActiveTab('surveys')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'surveys'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        Active Surveys
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'library'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        <Library className="h-4 w-4" />
                        Question Library
                    </button>
                </div>
            </PageHeader>

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />
                <SurveyManagement {...surveyState} />
            </div>
        </div>
    );
}
