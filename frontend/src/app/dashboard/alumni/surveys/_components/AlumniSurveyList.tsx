"use client";

import { useState } from "react";
import { Search, ClipboardList, CheckCircle2, HelpCircle } from "lucide-react";
import { Survey } from "../../../_lib/surveys";
import AlumniSurveyCard from "./AlumniSurveyCard";

interface AlumniSurveyListProps {
    activeSurveys: Survey[];
    completedSurveyIds: Set<string>;
    isLoading: boolean;
    onTakeSurvey: (survey: Survey) => void;
}

export default function AlumniSurveyList({
    activeSurveys,
    completedSurveyIds,
    isLoading,
    onTakeSurvey,
}: AlumniSurveyListProps) {
    const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
    const [searchQuery, setSearchQuery] = useState("");

    // Split surveys into active (not yet answered) and completed
    const pendingSurveys = activeSurveys.filter(s => !completedSurveyIds.has(s.survey_id));
    const completedSurveys = activeSurveys.filter(s => completedSurveyIds.has(s.survey_id));

    // Apply search filter
    const filterBySearch = (surveys: Survey[]) =>
        surveys.filter(
            s =>
                (s.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                (s.description || "").toLowerCase().includes((searchQuery || "").toLowerCase())
        );

    const displayedSurveys = activeTab === "active"
        ? filterBySearch(pendingSurveys)
        : filterBySearch(completedSurveys);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Sub-Header with Tabs & Search */}
            <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 border border-emerald-100/50 p-6 overflow-hidden shadow-sm">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-100 opacity-30 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 self-start">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === "active"
                                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                            }`}
                        >
                            <ClipboardList className="h-4 w-4" />
                            Active
                            {pendingSurveys.length > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5">
                                    {pendingSurveys.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("completed")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === "completed"
                                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                            }`}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Completed
                            {completedSurveys.length > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-slate-200 text-slate-600 text-xs font-bold px-1.5">
                                    {completedSurveys.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search surveys..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-10 w-10">
                            <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-700 animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Loading surveys...</p>
                    </div>
                </div>
            ) : displayedSurveys.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <HelpCircle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {activeTab === "active" ? "No active surveys" : "No completed surveys"}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                        {activeTab === "active"
                            ? searchQuery
                                ? "Try adjusting your search terms to find what you're looking for."
                                : "There are no surveys available for you at the moment. Check back later!"
                            : searchQuery
                                ? "Try adjusting your search terms."
                                : "You haven't completed any surveys yet. Head to the Active tab to get started."}
                    </p>
                </div>
            ) : (
                /* Survey Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayedSurveys.map(survey => (
                        <AlumniSurveyCard
                            key={survey.survey_id}
                            survey={survey}
                            isCompleted={completedSurveyIds.has(survey.survey_id)}
                            onTakeSurvey={() => onTakeSurvey(survey)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
