"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    type Question,
    type Survey,
    fetchQuestions,
    fetchSurvey,
    createQuestion as apiCreateQuestion,
    updateQuestion as apiUpdateQuestion,
    deleteQuestion as apiDeleteQuestion,
    fetchSurveys,
    saveSurveyWorkflow,
    deleteSurvey as apiDeleteSurvey,
} from "../../_lib/surveys";

export function useSurveyManagement() {
    // --- Global State ---
    const [activeTab, setActiveTab] = useState<'surveys' | 'library'>('surveys');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
        try {
            const [questionsResult, surveysResult] = await Promise.all([
                fetchQuestions({ limit: 100 }),
                fetchSurveys({ limit: 100 }),
            ]);
            setQuestionBank(questionsResult.questions);
            setSurveys(surveysResult.surveys);
        } catch (error) {
            toast.error("Failed to load survey data.");
        } finally {
            setIsLoading(false);
        }
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
        const fullSurvey = await fetchSurvey(s.survey_id);
        setEditingSurvey(fullSurvey ?? s);
        setIsSurveyModalOpen(true);
    };

    const handleDeleteSurveyClick = (id: string) => {
        setSurveyToDelete(id);
    };

    const confirmDeleteSurvey = async () => {
        if (surveyToDelete !== null) {
            setIsDeleting(true);
            const success = await apiDeleteSurvey(surveyToDelete);
            if (success) {
                toast.success("Survey deleted successfully.");
                await loadData();
            } else {
                toast.error("Failed to delete survey.");
            }
            setIsDeleting(false);
            setSurveyToDelete(null);
        }
    };

    const handleSaveSurvey = async (sData: Omit<Survey, "survey_id" | "question_count">) => {
        setIsSaving(true);
        const { success } = await saveSurveyWorkflow(editingSurvey, sData);
        
        if (success) {
            toast.success(editingSurvey ? "Survey updated successfully." : "Survey created successfully.");
            await loadData();
            setIsSurveyModalOpen(false);
        } else {
            toast.error(editingSurvey ? "Failed to update survey." : "Failed to create survey.");
        }
        
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
            setIsDeleting(true);
            const success = await apiDeleteQuestion(questionToDelete);
            if (success) {
                toast.success("Question deleted successfully.");
                await loadData();
            } else {
                toast.error("Failed to delete question.");
            }
            setIsDeleting(false);
            setQuestionToDelete(null);
        }
    };

    const handleSaveQuestion = async (qData: Omit<Question, "question_id">) => {
        setIsSaving(true);
        const qAction = editingQuestion 
            ? apiUpdateQuestion(editingQuestion.question_id, qData)
            : apiCreateQuestion(qData);

        const result = await qAction;
        if (result) {
            toast.success(editingQuestion ? "Question updated successfully." : "Question created successfully.");
            await loadData();
            setIsQuestionModalOpen(false);
        } else {
            toast.error(editingQuestion ? "Failed to update question." : "Failed to create question.");
        }
        setIsSaving(false);
    };

    return {
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
    };
}
