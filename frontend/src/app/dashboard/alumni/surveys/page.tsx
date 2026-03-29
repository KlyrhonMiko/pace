"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import SurveysHeader from "./_components/SurveysHeader";
import AlumniSurveyList from "./_components/AlumniSurveyList";
import SurveyResponseModal from "./_components/SurveyResponseModal";
import type { SurveySubmissionPayload } from "./_components/SurveyResponseModal";
import { Survey, Question } from "../../_lib/surveys";

// ============================================================================
// MOCK DATA — Replace with real API calls when backend is ready.
//
// Backend endpoints to integrate:
//   GET  /surveys?status=ACTIVE         → fetchActiveSurveys()
//   GET  /surveys/{survey_id}           → fetchSurvey()  (already exists in _lib/surveys.ts)
//   POST /surveys/{survey_id}/respond   → submitSurveyResponse()
//
// See _lib/surveys.ts for existing fetchSurveys() and fetchSurvey() functions.
// ============================================================================

const MOCK_QUESTIONS: Question[] = [
    {
        question_id: "QSTN-000001",
        question_text: "How would you rate your overall experience with our program?",
        question_type: "SCALE",
        is_required: true,
        scale_min: 1,
        scale_max: 5,
        scale_label_min: "Very Poor",
        scale_label_max: "Excellent",
    },
    {
        question_id: "QSTN-000002",
        question_text: "What is your current employment status?",
        question_type: "MULTIPLE_CHOICE",
        is_required: true,
        options: JSON.stringify(["Employed Full-time", "Employed Part-time", "Self-employed", "Freelancing", "Unemployed", "Further Studies"]),
    },
    {
        question_id: "QSTN-000003",
        question_text: "Which skills from your program do you use most at work?",
        question_type: "MULTI_SELECT",
        is_required: false,
        options: JSON.stringify(["Programming", "Data Analysis", "Project Management", "Communication", "Critical Thinking", "Research"]),
    },
    {
        question_id: "QSTN-000004",
        question_text: "Would you recommend this program to other students?",
        question_type: "YES_NO",
        is_required: true,
    },
    {
        question_id: "QSTN-000005",
        question_text: "Please share any additional feedback or suggestions for improvement.",
        question_type: "TEXT",
        is_required: false,
        placeholder: "Share your thoughts...",
    },
    {
        question_id: "QSTN-000006",
        question_text: "When did you start your first job after graduation?",
        question_type: "DATE",
        is_required: false,
    },
    {
        question_id: "QSTN-000007",
        question_text: "How many job offers did you receive before accepting your current role?",
        question_type: "NUMBER",
        is_required: false,
        placeholder: "e.g. 3",
    },
];

const MOCK_SURVEYS: Survey[] = [
    {
        survey_id: "SRVY-000001",
        title: "2026 Graduate Tracer Study",
        description: "Help us understand your career journey after graduation. This survey collects data about employment outcomes, skills utilization, and program relevance to improve future curriculum.",
        is_anonymous: false,
        allow_multiple_responses: false,
        opens_at: "2026-03-01",
        closes_at: "2026-04-30",
        status: "ACTIVE",
        question_count: 7,
        questions: MOCK_QUESTIONS,
    },
    {
        survey_id: "SRVY-000002",
        title: "Alumni Satisfaction Survey",
        description: "Rate your satisfaction with the university's services, facilities, and career support. Your feedback helps us continuously improve the alumni experience.",
        is_anonymous: true,
        allow_multiple_responses: false,
        opens_at: "2026-03-15",
        closes_at: "2026-05-15",
        status: "ACTIVE",
        question_count: 5,
        questions: [
            {
                question_id: "QSTN-000010",
                question_text: "How satisfied are you with the career services provided?",
                question_type: "SCALE",
                is_required: true,
                scale_min: 1,
                scale_max: 5,
                scale_label_min: "Very Dissatisfied",
                scale_label_max: "Very Satisfied",
            },
            {
                question_id: "QSTN-000011",
                question_text: "Which alumni services have you used?",
                question_type: "MULTI_SELECT",
                is_required: false,
                options: JSON.stringify(["Career Counseling", "Job Board", "Networking Events", "Mentorship Program", "Skills Workshops"]),
            },
            {
                question_id: "QSTN-000012",
                question_text: "Would you attend alumni reunion events?",
                question_type: "YES_NO",
                is_required: true,
            },
            {
                question_id: "QSTN-000013",
                question_text: "What type of events would you like to see more of?",
                question_type: "MULTIPLE_CHOICE",
                is_required: false,
                options: JSON.stringify(["Professional Development", "Social Gatherings", "Industry Talks", "Volunteer Opportunities"]),
            },
            {
                question_id: "QSTN-000014",
                question_text: "Any suggestions for improving alumni services?",
                question_type: "TEXT",
                is_required: false,
                placeholder: "Your suggestions...",
            },
        ],
    },
    {
        survey_id: "SRVY-000003",
        title: "Curriculum Feedback & Relevance",
        description: "Share your perspective on how well the curriculum prepared you for the workforce. Help future students by providing insights on course relevance.",
        is_anonymous: false,
        allow_multiple_responses: false,
        opens_at: "2026-02-01",
        closes_at: "2026-06-01",
        status: "ACTIVE",
        question_count: 4,
        questions: [
            {
                question_id: "QSTN-000020",
                question_text: "How relevant was the curriculum to your current job?",
                question_type: "SCALE",
                is_required: true,
                scale_min: 1,
                scale_max: 10,
                scale_label_min: "Not Relevant",
                scale_label_max: "Highly Relevant",
            },
            {
                question_id: "QSTN-000021",
                question_text: "Which courses were most valuable for your career?",
                question_type: "TEXT",
                is_required: true,
                placeholder: "List the courses...",
            },
            {
                question_id: "QSTN-000022",
                question_text: "What year did you graduate?",
                question_type: "NUMBER",
                is_required: true,
                placeholder: "e.g. 2024",
            },
            {
                question_id: "QSTN-000023",
                question_text: "When did you start looking for jobs?",
                question_type: "DATE",
                is_required: false,
            },
        ],
    },
];

// ============================================================================
// API STUBS — Replace these with real API calls
// ============================================================================

/**
 * TODO: Replace with real API call.
 * Fetch active surveys available to the alumni.
 *
 * Real implementation:
 *   import { fetchSurveys } from "../../_lib/surveys";
 *   const { surveys } = await fetchSurveys({ status: "ACTIVE", limit: 100 });
 *   // Then for each survey, fetch full details:
 *   // const full = await fetchSurvey(survey.survey_id);
 */
async function fetchAlumniSurveys(): Promise<Survey[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_SURVEYS;
}

/**
 * TODO: Replace with real API call.
 * Submit a survey response.
 *
 * Real implementation:
 *   import { apiFetch } from "@/lib/api-client";
 *   const result = await apiFetch(`/surveys/${surveyId}/respond`, {
 *       method: "POST",
 *       body: payload,
 *   });
 *   return result.success;
 */
async function submitSurveyResponse(
    surveyId: string,
    payload: SurveySubmissionPayload
): Promise<{ success: boolean; message?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Log the payload for debugging — this is exactly what the backend expects
    console.log(`[Mock] POST /surveys/${surveyId}/respond`, JSON.stringify(payload, null, 2));

    // Simulate success
    return { success: true, message: "Survey response submitted successfully" };
}

// ============================================================================
// Page Component
// ============================================================================

export default function AlumniSurveysPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track completed survey IDs (in a real app, this would come from the backend)
    const [completedSurveyIds, setCompletedSurveyIds] = useState<Set<string>>(new Set());

    // Modal state
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load surveys
    const loadSurveys = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAlumniSurveys();
            setSurveys(data);
        } catch {
            toast.error("Failed to load surveys.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSurveys();
    }, [loadSurveys]);

    // Open survey modal
    const handleTakeSurvey = (survey: Survey) => {
        // In a real implementation, you would fetch the full survey with questions here:
        // const fullSurvey = await fetchSurvey(survey.survey_id);
        setSelectedSurvey(survey);
        setIsModalOpen(true);
    };

    // Handle survey submission
    const handleSubmit = async (
        surveyId: string,
        payload: SurveySubmissionPayload
    ): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            const result = await submitSurveyResponse(surveyId, payload);
            if (result.success) {
                toast.success("Response submitted successfully!");
                setCompletedSurveyIds(prev => new Set([...prev, surveyId]));
                setIsModalOpen(false);
                setSelectedSurvey(null);
                return true;
            } else {
                toast.error(result.message || "Failed to submit response.");
                return false;
            }
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
            <SurveysHeader />

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
                    setIsModalOpen(false);
                    setSelectedSurvey(null);
                }}
                survey={selectedSurvey}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
