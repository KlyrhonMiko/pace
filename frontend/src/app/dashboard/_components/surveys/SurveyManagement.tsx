"use client";

import { ClipboardList, Library, Loader2 } from "lucide-react";
import QuestionLibraryView from "./QuestionLibraryView";
import QuestionModal from "./QuestionModal";
import SurveysView from "./SurveysView";
import SurveyModal from "./SurveyModal";
import { SurveyResultsModal } from "./SurveyResultsModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Question, Survey } from "../../_lib/surveys";
import { useState } from "react";

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
    handleResetSurveyForm: () => void;
    handleResetQuestionForm: () => void;
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
    handleResetSurveyForm,
    handleResetQuestionForm,
    setIsSurveyModalOpen,
    setIsQuestionModalOpen,
    setSurveyToDelete,
    setQuestionToDelete,
}: SurveyManagementProps) {
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

    const handleOpenResults = (survey: Survey) => {
        setSelectedSurvey(survey);
        setIsResultsModalOpen(true);
    };

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
                            onViewResults={handleOpenResults}
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
                onReset={handleResetQuestionForm}
                initialData={editingQuestion}
                isSaving={isSaving}
            />

            <SurveyModal
                isOpen={isSurveyModalOpen}
                onClose={() => setIsSurveyModalOpen(false)}
                onSubmit={handleSaveSurvey}
                onReset={handleResetSurveyForm}
                initialData={editingSurvey}
                questionLibrary={questionBank}
                isSaving={isSaving}
            />

            {/* Delete Confirmation Modal for Surveys */}
            <ConfirmationModal
                isOpen={surveyToDelete !== null}
                onClose={() => setSurveyToDelete(null)}
                onConfirm={confirmDeleteSurvey}
                title="Delete Survey?"
                description="Are you sure you want to delete this survey? This action cannot be undone and you will lose all responses."
                confirmText="Delete Survey"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Delete Confirmation Modal for Questions */}
            <ConfirmationModal
                isOpen={questionToDelete !== null}
                onClose={() => setQuestionToDelete(null)}
                onConfirm={confirmDeleteQuestion}
                title="Delete Question?"
                description="Are you sure you want to remove this question from your Library? Existing surveys using this question will not be affected."
                confirmText="Delete Question"
                variant="danger"
                isLoading={isDeleting}
            />

            <SurveyResultsModal 
                survey={selectedSurvey}
                isOpen={isResultsModalOpen}
                onClose={() => setIsResultsModalOpen(false)}
            />
        </div>
    );
}
