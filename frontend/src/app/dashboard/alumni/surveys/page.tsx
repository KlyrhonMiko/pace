"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/dashboard/PageHeader";
import AlumniSurveyList from "./_components/AlumniSurveyList";
import SurveyResponseModal from "./_components/SurveyResponseModal";
import { Survey, SurveyResponse, SurveySubmissionPayload } from "../../_lib/surveys";
import {
    fetchMyAlumniProfile,
    fetchAlumniActiveSurveys,
    fetchAlumniSurvey,
    fetchRespondedSurveyIds,
    submitAlumniSurveyResponse,
    fetchMySurveyResponse,
} from "../../_lib/surveys";

// ============================================================================
// Page Component
// ============================================================================

export default function AlumniSurveysPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // Alumni ID resolved from JWT on mount (used for survey submission)
    const [alumniId, setAlumniId] = useState<string | null>(null);

    // Track completed survey IDs — pre-populated from backend, then updated on submit
    const [completedSurveyIds, setCompletedSurveyIds] = useState<Set<string>>(new Set());

    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [initialAnswers, setInitialAnswers] = useState<SurveyResponse | null>(null);

    // ── Resolve alumni profile on mount ────────────────────────────────────
    useEffect(() => {
        fetchMyAlumniProfile()
            .then((profile) => {
                if (profile) setAlumniId(profile.alumni_id);
            })
            .catch(() => {
                // Non-fatal: anonymous surveys still work without alumni_id
            });
    }, []);

    // ── Load surveys + pre-populate completed status ───────────────────────
    const loadSurveys = useCallback(async () => {
        setIsLoading(true);
        try {
            const [activeSurveys, respondedIds] = await Promise.all([
                fetchAlumniActiveSurveys(),
                fetchRespondedSurveyIds(),
            ]);
            setSurveys(activeSurveys);
            setCompletedSurveyIds(respondedIds);
        } catch {
            toast.error("Failed to load surveys. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSurveys();
    }, [loadSurveys]);

    // ── Open survey modal — fetch full questions ───────────────────────────
    const handleTakeSurvey = async (survey: Survey) => {
        const isCompleted = completedSurveyIds.has(survey.survey_id);
        setIsReadOnly(isCompleted);
        setInitialAnswers(null);

        // If completed, fetch the response first
        if (isCompleted) {
            setIsModalLoading(true);
            try {
                const [fullSurvey, myResponse] = await Promise.all([
                    fetchAlumniSurvey(survey.survey_id),
                    fetchMySurveyResponse(survey.survey_id)
                ]);

                if (fullSurvey && myResponse) {
                    setSelectedSurvey(fullSurvey);
                    setInitialAnswers(myResponse);
                    setIsModalOpen(true);
                } else {
                    toast.error("Could not load your previous response.");
                }
            } catch {
                toast.error("An error occurred while loading the survey.");
            } finally {
                setIsModalLoading(false);
            }
            return;
        }

        // If the list already included questions, open immediately
        if (survey.questions && survey.questions.length > 0) {
            setSelectedSurvey(survey);
            setIsModalOpen(true);
            return;
        }

        // Otherwise fetch the full detail (with questions) from the backend
        setIsModalLoading(true);
        setSelectedSurvey(survey);      // show modal with loading state
        setIsModalOpen(true);

        try {
            const fullSurvey = await fetchAlumniSurvey(survey.survey_id);
            if (fullSurvey) {
                setSelectedSurvey(fullSurvey);
            } else {
                toast.error("Could not load survey questions. Please try again.");
                setIsModalOpen(false);
                setSelectedSurvey(null);
            }
        } catch {
            toast.error("Could not load survey questions. Please try again.");
            setIsModalOpen(false);
            setSelectedSurvey(null);
        } finally {
            setIsModalLoading(false);
        }
    };

    // ── Handle survey submission ───────────────────────────────────────────
    const handleSubmit = async (
        surveyId: string,
        payload: SurveySubmissionPayload
    ): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            // Attach alumni_id if we have it (and the survey is not anonymous)
            const enrichedPayload: SurveySubmissionPayload = {
                ...payload,
                alumni_id: selectedSurvey?.is_anonymous ? null : (alumniId ?? null),
            };

            const result = await submitAlumniSurveyResponse(surveyId, enrichedPayload);

            if (result.success) {
                toast.success("Response submitted successfully!");
                setCompletedSurveyIds(prev => new Set([...prev, surveyId]));
                setIsModalOpen(false);
                setSelectedSurvey(null);
                return true;
            }

            // Handle specific backend error codes gracefully
            const msg = result.message ?? "";
            if (msg.toLowerCase().includes("already responded") || msg.toLowerCase().includes("duplicate")) {
                toast.warning("You have already responded to this survey.");
                setCompletedSurveyIds(prev => new Set([...prev, surveyId]));
                setIsModalOpen(false);
                setSelectedSurvey(null);
                return false;
            }
            if (msg.toLowerCase().includes("closed") || msg.toLowerCase().includes("ended")) {
                toast.error("This survey's submission period has ended.");
                return false;
            }

            toast.error(msg || "Failed to submit response.");
            return false;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to submit response.";
            toast.error(message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <PageHeader
                title="Surveys"
                description="Share your feedback and help us improve the alumni experience."
                currentPage="Surveys"
            />

            {/* Survey List with Tabs */}
            <AlumniSurveyList
                activeSurveys={surveys}
                completedSurveyIds={completedSurveyIds}
                isLoading={isLoading}
                onTakeSurvey={handleTakeSurvey}
            />

            {/* Response Modal */}
            <SurveyResponseModal
                isOpen={isModalOpen}
                onClose={() => {
                    if (!isSubmitting) {
                        setIsModalOpen(false);
                        setSelectedSurvey(null);
                    }
                }}
                survey={selectedSurvey}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isLoadingQuestions={isModalLoading}
                readOnly={isReadOnly}
                initialAnswers={initialAnswers}
            />
        </div>
    );
}
