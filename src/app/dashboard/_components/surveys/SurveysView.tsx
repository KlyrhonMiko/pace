"use client";

import { useState } from "react";
import { Plus, Search, HelpCircle } from "lucide-react";
import { Survey } from "../../_lib/surveys";
import { SURVEY_STATUSES } from "../../_lib/surveys";
import SurveyCard from "./SurveyCard";
import SurveyFilters from "./SurveyFilters";

interface SurveysViewProps {
    surveys: Survey[];
    onCreateSurvey: () => void;
    onEditSurvey: (survey: Survey) => void;
    onDeleteSurvey: (id: string) => void;
}

export default function SurveysView({
    surveys,
    onCreateSurvey,
    onEditSurvey,
    onDeleteSurvey,
}: SurveysViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [showAnonymousOnly, setShowAnonymousOnly] = useState(false);

    // Calculate background counts for the filters
    const statusCounts = SURVEY_STATUSES.reduce((acc, status) => {
        acc[status] = surveys.filter(s => s.status === status).length;
        return acc;
    }, {} as Record<string, number>);

    const filteredSurveys = surveys.filter(s => {
        const matchesSearch =
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatus ? s.status === selectedStatus : true;
        const matchesAnon = showAnonymousOnly ? s.is_anonymous === true : true;

        return matchesSearch && matchesStatus && matchesAnon;
    });

    const handleClearFilters = () => {
        setSelectedStatus(null);
        setShowAnonymousOnly(false);
        setSearchQuery("");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search active, closed, or draft surveys..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
                <button
                    onClick={onCreateSurvey}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200 shrink-0"
                >
                    <Plus className="h-4 w-4 stroke-2" />
                    Create Survey
                </button>
            </div>

            {/* Main Layout containing Filters & Grid */}
            <div className="flex flex-col-reverse lg:flex-row-reverse gap-8">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <SurveyFilters
                        statusCounts={statusCounts}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        showAnonymousOnly={showAnonymousOnly}
                        setShowAnonymousOnly={setShowAnonymousOnly}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                {/* Grid Area */}
                <div className="flex-1">
                    {filteredSurveys.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <HelpCircle className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No surveys found</h3>
                            <p className="text-slate-500 text-sm max-w-sm">
                                {searchQuery || selectedStatus || showAnonymousOnly
                                    ? "Try adjusting your filters or search terms to find what you're looking for."
                                    : "You haven't created any surveys yet. Click 'Create Survey' to get started."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredSurveys.map((survey) => (
                                <SurveyCard
                                    key={survey.survey_id}
                                    survey={survey}
                                    onEdit={() => onEditSurvey(survey)}
                                    onDelete={() => onDeleteSurvey(survey.survey_id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
