"use client";

import { apiFetch } from "../../../lib/api-client";

// ---------------------------------------------------------------------------
// Survey & Question types
// ---------------------------------------------------------------------------

export type QuestionType =
    | 'MULTIPLE_CHOICE'
    | 'MULTI_SELECT'
    | 'TEXT'
    | 'SCALE'
    | 'YES_NO'
    | 'DATE'
    | 'NUMBER';

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface Question {
    question_id: string;
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    options?: string;
    scale_min?: number;
    scale_max?: number;
    scale_label_min?: string;
    scale_label_max?: string;
    placeholder?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Survey {
    survey_id: string;
    title: string;
    description: string;
    is_anonymous: boolean;
    allow_multiple_responses: boolean;
    opens_at: string | null;
    closes_at: string | null;
    status: SurveyStatus;
    target_department_abbv?: string | null;
    target_course_abbv?: string | null;
    question_count?: number;
    questions?: Question[];
    created_at?: string;
    updated_at?: string;
}

export interface SurveyQuestionWithDetails {
    order_index: number;
    question: Question;
}

export const QUESTION_TYPES = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice (Single Answer)' },
    { value: 'MULTI_SELECT', label: 'Checkboxes (Multiple Answers)' },
    { value: 'TEXT', label: 'Short/Long Answer' },
    { value: 'SCALE', label: 'Linear Scale (e.g. 1 to 5)' },
    { value: 'YES_NO', label: 'Yes or No' },
    { value: 'DATE', label: 'Date Selection' },
    { value: 'NUMBER', label: 'Number Input' },
];

export const SURVEY_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'];

export async function fetchQuestions(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    question_type?: string;
}): Promise<{ questions: Question[]; total: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set("skip", String(params?.skip ?? 0));
    searchParams.set("limit", String(params?.limit ?? 100));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.question_type) searchParams.set("question_type", params.question_type);

    try {
        const json = await apiFetch<any>(`/questions?${searchParams}`);
        if (json.success && json.data) {
            return {
                questions: json.data.questions ?? [],
                total: json.data.total ?? 0,
            };
        }
        return { questions: [], total: 0 };
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return { questions: [], total: 0 };
    }
}

export async function createQuestion(data: any): Promise<Question | null> {
    try {
        const json = await apiFetch<any>("/questions", {
            method: "POST",
            body: data,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create question:", error);
        return null;
    }
}

export async function updateQuestion(questionId: string, data: any): Promise<Question | null> {
    try {
        const json = await apiFetch<any>(`/questions/${questionId}`, {
            method: "PATCH",
            body: data,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to update question:", error);
        return null;
    }
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/questions/${questionId}`, {
            method: "DELETE",
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to delete question:", error);
        return false;
    }
}

export async function fetchSurveys(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
}): Promise<{ surveys: Survey[]; total: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set("skip", String(params?.skip ?? 0));
    searchParams.set("limit", String(params?.limit ?? 100));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);

    try {
        const json = await apiFetch<any>(`/surveys?${searchParams}`);
        if (json.success && json.data) {
            return {
                surveys: json.data.surveys ?? [],
                total: json.data.total ?? 0,
            };
        }
        return { surveys: [], total: 0 };
    } catch (error) {
        console.error("Failed to fetch surveys:", error);
        return { surveys: [], total: 0 };
    }
}

export async function fetchSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}`);
        if (json.success && json.data) {
            const data = json.data;
            // Unwrap SurveyQuestionWithDetails → flat Question[]
            if (data.questions && Array.isArray(data.questions)) {
                data.questions = data.questions
                    .sort((a: SurveyQuestionWithDetails, b: SurveyQuestionWithDetails) => a.order_index - b.order_index)
                    .map((sqwd: SurveyQuestionWithDetails) => sqwd.question);
            }
            return data as Survey;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch survey:", error);
        return null;
    }
}

export async function createSurvey(data: any): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>("/surveys", {
            method: "POST",
            body: data,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create survey:", error);
        return null;
    }
}

export async function updateSurvey(surveyId: string, data: any): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}`, {
            method: "PATCH",
            body: data,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to update survey:", error);
        return null;
    }
}

export async function deleteSurvey(surveyId: string): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}`, {
            method: "DELETE",
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to delete survey:", error);
        return false;
    }
}

export async function publishSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/publish`, {
            method: "POST",
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to publish survey:", error);
        return null;
    }
}

export async function closeSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/close`, {
            method: "POST",
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to close survey:", error);
        return null;
    }
}

export async function reopenSurvey(
    surveyId: string, 
    payload: { opens_at: string; closes_at: string }
): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/reopen`, {
            method: "POST",
            body: payload,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to reopen survey:", error);
        return null;
    }
}

export async function archiveSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/archive`, {
            method: "POST",
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to archive survey:", error);
        return null;
    }
}

export async function createTracerStudyTemplate(): Promise<Survey> {
    const json = await apiFetch<any>("/surveys/templates/tracer-study", {
        method: "POST",
    });
    return json.data as Survey;
}

export async function fetchSurveyQuestions(surveyId: string): Promise<SurveyQuestionWithDetails[]> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/questions`);
        if (json.success && json.data) {
            return json.data.questions ?? [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch survey questions:", error);
        return [];
    }
}

export async function addQuestionsBatch(
    surveyId: string,
    questions: { question_id: string; order_index?: number }[]
): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/questions/batch`, {
            method: "POST",
            body: questions,
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to add questions batch:", error);
        return false;
    }
}

export async function removeQuestionFromSurvey(
    surveyId: string,
    questionId: string
): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/questions/${questionId}`, {
            method: "DELETE",
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to remove question from survey:", error);
        return false;
    }
}

export async function reorderSurveyQuestions(
    surveyId: string,
    orderMap: Record<string, number>
): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/questions/reorder`, {
            method: "PATCH",
            body: { order_map: orderMap },
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to reorder survey questions:", error);
        return false;
    }
}

// ---------------------------------------------------------------------------
// High-level Workflows (Orchestration)
// ---------------------------------------------------------------------------

/**
 * Orchestrates saving/updating a survey including metadata and question syncing.
 */
export async function saveSurveyWorkflow(
    editingSurvey: Survey | null,
    sData: Omit<Survey, "survey_id" | "question_count">
): Promise<{ success: boolean; survey?: Survey; error?: string }> {
    // Normalize dates: empty strings to null
    const normalizedData = {
        ...sData,
        opens_at: sData.opens_at?.trim() || null,
        closes_at: sData.closes_at?.trim() || null,
    };

    try {
        if (editingSurvey) {
            // 1. Update metadata if changed
            const metadataChanged =
                normalizedData.title !== editingSurvey.title ||
                normalizedData.description !== editingSurvey.description ||
                normalizedData.is_anonymous !== editingSurvey.is_anonymous ||
                normalizedData.allow_multiple_responses !== editingSurvey.allow_multiple_responses ||
                normalizedData.opens_at !== editingSurvey.opens_at ||
                normalizedData.closes_at !== editingSurvey.closes_at ||
                normalizedData.status !== editingSurvey.status ||
                normalizedData.target_department_abbv !== editingSurvey.target_department_abbv ||
                normalizedData.target_course_abbv !== editingSurvey.target_course_abbv;

            if (metadataChanged) {
                const updated = await updateSurvey(editingSurvey.survey_id, {
                    title: normalizedData.title,
                    description: normalizedData.description,
                    is_anonymous: normalizedData.is_anonymous,
                    allow_multiple_responses: normalizedData.allow_multiple_responses,
                    opens_at: normalizedData.opens_at,
                    closes_at: normalizedData.closes_at,
                    status: normalizedData.status,
                    target_department_abbv: normalizedData.target_department_abbv,
                    target_course_abbv: normalizedData.target_course_abbv,
                });
                if (!updated) return { success: false };
            }

            // 2. Sync questions: diff for add/remove
            const originalIds = new Set((editingSurvey.questions || []).map(q => q.question_id));
            const newQuestions = sData.questions || [];
            const newIds = new Set(newQuestions.map(q => q.question_id));

            // Deletes
            const toRemove = [...originalIds].filter(id => !newIds.has(id));
            if (toRemove.length > 0) {
                await Promise.all(
                    toRemove.map(qid => removeQuestionFromSurvey(editingSurvey.survey_id, qid))
                );
            }

            // Adds
            const toAdd = newQuestions.filter(q => !originalIds.has(q.question_id));
            if (toAdd.length > 0) {
                const batch = toAdd.map((q) => ({
                    question_id: q.question_id,
                    order_index: newQuestions.indexOf(q) + 1,
                }));
                await addQuestionsBatch(editingSurvey.survey_id, batch);
            }

            // 3. Reorder all to match the new UI order
            if (newQuestions.length > 0) {
                const orderMap: Record<string, number> = {};
                newQuestions.forEach((q, idx) => {
                    orderMap[q.question_id] = idx + 1;
                });
                await reorderSurveyQuestions(editingSurvey.survey_id, orderMap);
            }

            return { success: true };
        } else {
            // Create new survey
            const created = await createSurvey({
                title: normalizedData.title,
                description: normalizedData.description,
                is_anonymous: normalizedData.is_anonymous,
                allow_multiple_responses: normalizedData.allow_multiple_responses,
                opens_at: normalizedData.opens_at,
                closes_at: normalizedData.closes_at,
                target_department_abbv: normalizedData.target_department_abbv,
                target_course_abbv: normalizedData.target_course_abbv,
            });

            if (created && normalizedData.questions && normalizedData.questions.length > 0) {
                const batch = normalizedData.questions.map((q, idx) => ({
                    question_id: q.question_id,
                    order_index: idx + 1,
                }));
                await addQuestionsBatch(created.survey_id, batch);
            }

            return { success: !!created, survey: created || undefined };
        }
    } catch (error) {
        console.error("Workflow failed:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "An unexpected error occurred"
        };
    }
}

// ---------------------------------------------------------------------------
// Alumni-facing API functions  (call /alumni/* endpoints — no staff gate)
// ---------------------------------------------------------------------------

export interface AlumniProfile {
    alumni_id: string;
    first_name: string;
    last_name: string;
}

export interface AnswerItem {
    question_id: string;
    question_text?: string;
    question_type?: string;
    answer_text?: string | null;
    answer_choice?: string | null;
    answer_choices?: string | null; // JSON string for MULTI_SELECT
    answer_scale?: number | null;
    answer_number?: number | null;
    answer_date?: string | null;
    answer_bool?: boolean | null;
}

export interface SurveySubmissionPayload {
    alumni_id?: string | null;
    answers: AnswerItem[];
}

/**
 * Resolve the current user's alumni profile (alumni_id etc.) from the JWT.
 * Calls GET /alumni/me
 */
export async function fetchMyAlumniProfile(): Promise<AlumniProfile | null> {
    try {
        const json = await apiFetch<any>("/alumni/me");
        return json.success && json.data ? (json.data as AlumniProfile) : null;
    } catch (error) {
        console.error("Failed to fetch alumni profile:", error);
        return null;
    }
}

/**
 * Fetch ACTIVE surveys available to alumni.
 * Calls GET /alumni/surveys
 */
export async function fetchAlumniActiveSurveys(): Promise<Survey[]> {
    try {
        const json = await apiFetch<any>("/alumni/surveys");
        if (json.success && json.data?.surveys) {
            return json.data.surveys as Survey[];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch active surveys:", error);
        return [];
    }
}

/**
 * Fetch a single survey with full question list for alumni.
 * Calls GET /alumni/surveys/{survey_id}
 */
export async function fetchAlumniSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/alumni/surveys/${surveyId}`);
        return json.success && json.data ? (json.data as Survey) : null;
    } catch (error) {
        console.error(`Failed to fetch survey ${surveyId}:`, error);
        return null;
    }
}

/**
 * Fetch the set of survey_ids the current alumni has already responded to.
 * Calls GET /alumni/me/responded-surveys
 */
export async function fetchRespondedSurveyIds(): Promise<Set<string>> {
    try {
        const json = await apiFetch<any>("/alumni/me/responded-surveys");
        if (json.success && json.data?.responded_survey_ids) {
            return new Set<string>(json.data.responded_survey_ids as string[]);
        }
        return new Set();
    } catch (error) {
        console.error("Failed to fetch responded survey IDs:", error);
        return new Set();
    }
}

/**
 * Submit a survey response.
 * Calls POST /surveys/{survey_id}/respond
 */
export async function submitAlumniSurveyResponse(
    surveyId: string,
    payload: SurveySubmissionPayload
): Promise<{ success: boolean; message?: string }> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/respond`, {
            method: "POST",
            body: payload,
        });
        return {
            success: json.success === true,
            message: json.message,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Submission failed";
        return { success: false, message };
    }
}

/**
 * Fetch the current alumni's response for a specific survey.
 * Calls GET /alumni/surveys/{survey_id}/my-response
 */
export async function fetchMySurveyResponse(surveyId: string): Promise<SurveyResponse | null> {
    try {
        const json = await apiFetch<any>(`/alumni/surveys/${surveyId}/my-response`);
        return json.success && json.data?.response ? (json.data.response as SurveyResponse) : null;
    } catch (error) {
        console.error(`Failed to fetch my response for survey ${surveyId}:`, error);
        return null;
    }
}
export interface SurveyResponse {
    response_id: string;
    submitted_at: string;
    is_complete: boolean;
    answers: AnswerItem[];
}

export interface QuestionStats {
    question_id: string;
    question_text: string;
    question_type: QuestionType;
    total_responses: number;
    distribution?: Record<string, number>; // For MULTIPLE_CHOICE, MULTI_SELECT, YES_NO
    average?: number; // For SCALE, NUMBER
    min?: number;
    max?: number;
    samples?: string[]; // For TEXT
}

export interface SurveyResults {
    survey_id: string;
    title: string;
    total_responses: number;
    status: SurveyStatus;
    questions: QuestionStats[];
}

export interface IndividualResponse {
    response_id: string;
    submitted_at: string;
    is_complete: boolean;
    alumni_id: string | null;
    alumni_name: string;
    answers: AnswerItem[];
}

export interface SurveyExportData {
    survey_id: string;
    title: string;
    total_responses: number;
    responses: IndividualResponse[];
}

/**
 * Fetch aggregated statistics for a survey.
 * Calls GET /surveys/{survey_id}/results
 */
export async function fetchSurveyResults(surveyId: string): Promise<SurveyResults | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/results`);
        if (json.success && json.data) {
            const d = json.data;
            return {
                survey_id: d.survey_id,
                title: d.title,
                total_responses: d.total_responses,
                status: d.status || 'ACTIVE',
                questions: (d.question_summaries || []).map((q: any) => ({
                    question_id: q.question_id,
                    question_text: q.question_text,
                    question_type: q.question_type as QuestionType,
                    total_responses: q.total_answers || 0,
                    distribution: q.choice_distribution || q.distribution,
                    average: q.average,
                    min: q.min_value || q.min,
                    max: q.max_value || q.max,
                    samples: q.sample_answers || q.samples || []
                }))
            };
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch results for survey ${surveyId}:`, error);
        return null;
    }
}

/**
 * Fetch raw survey responses for export.
 * Calls GET /surveys/{survey_id}/export
 */
export async function fetchSurveyExport(surveyId: string): Promise<SurveyExportData | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/export`);
        return json.success ? (json.data as SurveyExportData) : null;
    } catch (error) {
        console.error(`Failed to export survey ${surveyId}:`, error);
        return null;
    }
}
