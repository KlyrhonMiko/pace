"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Library, AlertTriangle, Loader2 } from "lucide-react";
import {
    type Question,
    type Survey,
    fetchQuestions,
    fetchSurvey,
    createQuestion as apiCreateQuestion,
    updateQuestion as apiUpdateQuestion,
    deleteQuestion as apiDeleteQuestion,
    fetchSurveys,
    createSurvey as apiCreateSurvey,
    updateSurvey as apiUpdateSurvey,
    deleteSurvey as apiDeleteSurvey,
    addQuestionsBatch,
    removeQuestionFromSurvey,
    reorderSurveyQuestions,
} from "../../_lib/surveys";
import QuestionLibraryView from "./QuestionLibraryView";
import QuestionModal from "./QuestionModal";
import SurveysView from "./SurveysView";
import SurveyModal from "./SurveyModal";

export default function SurveyManagement() {
    // --- Global State ---
    const [activeTab, setActiveTab] = useState<'surveys' | 'library'>('surveys');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- Survey State ---
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

    // --- Question Library State ---
    const [questionBank, setQuestionBank] = useState<Question[]>([]);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // --- Delete Confirmation State ---
    const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

    // --- Load data from backend ---
    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [questionsResult, surveysResult] = await Promise.all([
            fetchQuestions({ limit: 100 }),
            fetchSurveys({ limit: 100 }),
        ]);
        setQuestionBank(questionsResult.questions);
        setSurveys(surveysResult.surveys);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Survey Handlers ---
    const handleCreateSurvey = () => {
        setEditingSurvey(null);
        setIsSurveyModalOpen(true);
    };

    const handleEditSurvey = async (s: Survey) => {
        // Fetch full survey with questions (list endpoint doesn't include them)
        const fullSurvey = await fetchSurvey(s.survey_id);
        setEditingSurvey(fullSurvey ?? s);
        setIsSurveyModalOpen(true);
    };

    const handleDeleteSurveyClick = (id: string) => {
        setSurveyToDelete(id);
    };

    const confirmDeleteSurvey = async () => {
        if (surveyToDelete !== null) {
            const success = await apiDeleteSurvey(surveyToDelete);
            if (success) {
                await loadData();
            } else {
                alert("Failed to delete survey.");
            }
            setSurveyToDelete(null);
        }
    };

    const handleSaveSurvey = async (sData: Omit<Survey, "survey_id" | "question_count">) => {
        setIsSaving(true);
        if (editingSurvey) {
            // 1. Update survey metadata
            const updated = await apiUpdateSurvey(editingSurvey.survey_id, {
                title: sData.title,
                description: sData.description,
                is_anonymous: sData.is_anonymous,
                allow_multiple_responses: sData.allow_multiple_responses,
                opens_at: sData.opens_at,
                closes_at: sData.closes_at,
            });
            if (!updated) {
                alert("Failed to update survey.");
            }

            // 2. Sync questions: diff for add/remove, then reorder
            const originalIds = new Set((editingSurvey.questions || []).map(q => q.question_id));
            const newQuestions = sData.questions || [];
            const newIds = new Set(newQuestions.map(q => q.question_id));

            // Remove questions that were deleted by the user
            const toRemove = [...originalIds].filter(id => !newIds.has(id));
            for (const qid of toRemove) {
                await removeQuestionFromSurvey(editingSurvey.survey_id, qid);
            }

            // Add questions that are newly added by the user
            const toAdd = newQuestions.filter(q => !originalIds.has(q.question_id));
            if (toAdd.length > 0) {
                const batch = toAdd.map((q) => ({
                    question_id: q.question_id,
                    order_index: newQuestions.indexOf(q) + 1,
                }));
                await addQuestionsBatch(editingSurvey.survey_id, batch);
            }

            // 3. Reorder all questions to match the new order
            if (newQuestions.length > 0) {
                const orderMap: Record<string, number> = {};
                newQuestions.forEach((q, idx) => {
                    orderMap[q.question_id] = idx + 1;
                });
                await reorderSurveyQuestions(editingSurvey.survey_id, orderMap);
            }
        } else {
            // Create new survey (DRAFT), then attach questions if any
            const created = await apiCreateSurvey({
                title: sData.title,
                description: sData.description,
                is_anonymous: sData.is_anonymous,
                allow_multiple_responses: sData.allow_multiple_responses,
                opens_at: sData.opens_at,
                closes_at: sData.closes_at,
            });

            if (created && sData.questions && sData.questions.length > 0) {
                const batch = sData.questions.map((q, idx) => ({
                    question_id: q.question_id,
                    order_index: idx + 1,
                }));
                await addQuestionsBatch(created.survey_id, batch);
            } else if (!created) {
                alert("Failed to create survey.");
            }
        }
        await loadData();
        setIsSaving(false);
    };

    // --- Question Library Handlers ---
    const handleCreateQuestion = () => {
        setEditingQuestion(null);
        setIsQuestionModalOpen(true);
    };

    const handleEditQuestion = (q: Question) => {
        setEditingQuestion(q);
        setIsQuestionModalOpen(true);
    };

    const handleDeleteQuestionClick = (id: string) => {
        setQuestionToDelete(id);
    };

    const confirmDeleteQuestion = async () => {
        if (questionToDelete !== null) {
            const success = await apiDeleteQuestion(questionToDelete);
            if (success) {
                await loadData();
            } else {
                alert("Failed to delete question.");
            }
            setQuestionToDelete(null);
        }
    };

    const handleSaveQuestion = async (qData: Omit<Question, "question_id">) => {
        setIsSaving(true);
        if (editingQuestion) {
            const updated = await apiUpdateQuestion(editingQuestion.question_id, qData);
            if (!updated) {
                alert("Failed to update question.");
            }
        } else {
            const created = await apiCreateQuestion(qData);
            if (!created) {
                alert("Failed to create question.");
            }
        }
        await loadData();
        setIsSaving(false);
    };

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
            />

            <SurveyModal
                isOpen={isSurveyModalOpen}
                onClose={() => setIsSurveyModalOpen(false)}
                onSubmit={handleSaveSurvey}
                initialData={editingSurvey}
                questionLibrary={questionBank}
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
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteSurvey}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                                Delete Survey
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
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteQuestion}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                                Delete Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
