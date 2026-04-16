"use client";

import { ClipboardList, Library, AlertTriangle, Loader2 } from "lucide-react";
import QuestionLibraryView from "./QuestionLibraryView";
import QuestionModal from "./QuestionModal";
import SurveysView from "./SurveysView";
import SurveyModal from "./SurveyModal";
import { Question, Survey } from "../../_lib/surveys";

interface SurveyManagementProps {
    activeTab: 'surveys' | 'library';
    isLoading: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    surveys: Survey[];
    questionBank: Question[];
    isSurveyModalOpen: boolean;
    isQuestionModalOpen: boolean;
    editingSurvey: Survey | null;
    editingQuestion: Question | null;
    surveyToDelete: string | null;
    questionToDelete: string | null;
    handleCreateSurvey: () => void;
    handleCreateTracerStudy: () => void;
    handleEditSurvey: (s: Survey) => void;
    handleDeleteSurveyClick: (id: string) => void;
    confirmDeleteSurvey: () => void;
    handleSaveSurvey: (sData: Omit<Survey, "survey_id" | "question_count">) => void;
    handlePublishSurvey: (id: string) => void;
    handleCloseSurvey: (id: string) => void;
    handleArchiveSurvey: (id: string) => void;
    handleReopenSurvey: (id: string) => void;
    handleCreateQuestion: () => void;
    handleEditQuestion: (q: Question) => void;
    handleDeleteQuestionClick: (id: string) => void;
    confirmDeleteQuestion: () => void;
    handleSaveQuestion: (qData: Omit<Question, "question_id">) => void;
    setIsSurveyModalOpen: (open: boolean) => void;
    setIsQuestionModalOpen: (open: boolean) => void;
    setSurveyToDelete: (id: string | null) => void;
    setQuestionToDelete: (id: string | null) => void;
}

export default function SurveyManagement({
    activeTab,
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
    handleCreateSurvey,
    handleCreateTracerStudy,
    handleEditSurvey,
    handleDeleteSurveyClick,
    confirmDeleteSurvey,
    handleSaveSurvey,
    handlePublishSurvey,
    handleCloseSurvey,
    handleArchiveSurvey,
    handleReopenSurvey,
    handleCreateQuestion,
    handleEditQuestion,
    handleDeleteQuestionClick,
    confirmDeleteQuestion,
    handleSaveQuestion,
    setIsSurveyModalOpen,
    setIsQuestionModalOpen,
    setSurveyToDelete,
    setQuestionToDelete,
}: SurveyManagementProps) {
    return (
        <div className="space-y-6">
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
                            onCreateTracerStudy={handleCreateTracerStudy}
                            onEditSurvey={handleEditSurvey}
                            onDeleteSurvey={handleDeleteSurveyClick}
                            onPublishSurvey={handlePublishSurvey}
                            onCloseSurvey={handleCloseSurvey}
                            onArchiveSurvey={handleArchiveSurvey}
                            onReopenSurvey={handleReopenSurvey}
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
