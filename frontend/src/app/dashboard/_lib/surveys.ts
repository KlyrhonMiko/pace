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

export async function reopenSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const json = await apiFetch<any>(`/surveys/${surveyId}/reopen`, {
            method: "POST",
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
): Promise<{ success: boolean; survey?: Survey }> {
    try {
        if (editingSurvey) {
            // 1. Update metadata if changed
            const metadataChanged =
                sData.title !== editingSurvey.title ||
                sData.description !== editingSurvey.description ||
                sData.is_anonymous !== editingSurvey.is_anonymous ||
                sData.allow_multiple_responses !== editingSurvey.allow_multiple_responses ||
                sData.opens_at !== editingSurvey.opens_at ||
                sData.closes_at !== editingSurvey.closes_at ||
                sData.status !== editingSurvey.status;

            if (metadataChanged) {
                const updated = await updateSurvey(editingSurvey.survey_id, {
                    title: sData.title,
                    description: sData.description,
                    is_anonymous: sData.is_anonymous,
                    allow_multiple_responses: sData.allow_multiple_responses,
                    opens_at: sData.opens_at,
                    closes_at: sData.closes_at,
                    status: sData.status,
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
            }

            return { success: !!created, survey: created || undefined };
        }
    } catch (error) {
        console.error("Workflow failed:", error);
        return { success: false };
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
