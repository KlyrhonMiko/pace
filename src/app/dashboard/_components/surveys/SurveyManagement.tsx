"use client";

import { ClipboardList, Library, AlertTriangle, Loader2 } from "lucide-react";
import { useSurveyManagement } from "./useSurveyManagement";
import QuestionLibraryView from "./QuestionLibraryView";
import QuestionModal from "./QuestionModal";
import SurveysView from "./SurveysView";
import SurveyModal from "./SurveyModal";

export default function SurveyManagement() {
    const {
        // State
        activeTab,
        setActiveTab,
        isLoading,
        isSaving,
        isDeleting,
        surveys,
        questionBank,
        isSurveyModalOpen,
        isQuestionModalOpen,
        editingSurvey,
        editingQuestion,
        surveyToDelete,
        questionToDelete,
        
        // Handlers
        handleCreateSurvey,
        handleEditSurvey,
        handleDeleteSurveyClick,
        confirmDeleteSurvey,
        handleSaveSurvey,
        handleCreateQuestion,
        handleEditQuestion,
        handleDeleteQuestionClick,
        confirmDeleteQuestion,
        handleSaveQuestion,
        setIsSurveyModalOpen,
        setIsQuestionModalOpen,
        setSurveyToDelete,
        setQuestionToDelete,
    } = useSurveyManagement();

    return (
        <div className="space-y-6">
            {/* Sub-Header with Tabs */}
            <div className="relative mb-8 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 border border-emerald-100/50 p-8 overflow-hidden shadow-sm">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-100 opacity-30 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Surveys & Feedback</h1>
                        <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
                            Create custom surveys, collect student feedback, and manage your reusable question library for future evaluations.
                        </p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 self-start">
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
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">Loading data...</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Main Content Area based on Tab */}
                    {activeTab === 'surveys' ? (
                        <SurveysView
                            surveys={surveys}
                            onCreateSurvey={handleCreateSurvey}
                            onEditSurvey={handleEditSurvey}
                            onDeleteSurvey={handleDeleteSurveyClick}
                        />
                    ) : (
                        <QuestionLibraryView
                            questions={questionBank}
                            onCreateQuestion={handleCreateQuestion}
                            onEditQuestion={handleEditQuestion}
                            onDeleteQuestion={handleDeleteQuestionClick}
                        />
                    )}
                </>
            )}

            {/* Global Modals */}
            <QuestionModal
                isOpen={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                onSubmit={handleSaveQuestion}
                initialData={editingQuestion}
                isSaving={isSaving}
            />

            <SurveyModal
                isOpen={isSurveyModalOpen}
                onClose={() => setIsSurveyModalOpen(false)}
                onSubmit={handleSaveSurvey}
                initialData={editingSurvey}
                questionLibrary={questionBank}
                isSaving={isSaving}
            />

            {/* Delete Confirmation Modal for Surveys */}
            {surveyToDelete !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                            <AlertTriangle className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Survey?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete this survey? This action cannot be undone and you will lose all responses.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSurveyToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteSurvey}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                {isDeleting ? "Deleting..." : "Delete Survey"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal for Questions */}
            {questionToDelete !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                            <AlertTriangle className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Question?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to remove this question from your Library? Existing surveys using this question will not be affected.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setQuestionToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteQuestion}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                {isDeleting ? "Deleting..." : "Delete Question"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
