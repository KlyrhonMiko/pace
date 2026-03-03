"use client";

// ---------------------------------------------------------------------------
// Survey & Question types — matches backend schemas exactly
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
    options?: string;        // JSON string from backend, parse with JSON.parse() for rendering
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API configuration
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Question API functions
// ---------------------------------------------------------------------------

export async function fetchQuestions(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    question_type?: string;
}): Promise<{ questions: Question[]; total: number }> {
    try {
        const searchParams = new URLSearchParams();
        searchParams.set("skip", String(params?.skip ?? 0));
        searchParams.set("limit", String(params?.limit ?? 100));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.question_type) searchParams.set("question_type", params.question_type);

        const res = await fetch(`${API_BASE_URL}/questions?${searchParams}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

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

export async function createQuestion(data: {
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    options?: string;
    scale_min?: number;
    scale_max?: number;
    scale_label_min?: string;
    scale_label_max?: string;
    placeholder?: string;
}): Promise<Question | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Create question failed:", err);
            return null;
        }
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create question:", error);
        return null;
    }
}

export async function updateQuestion(
    questionId: string,
    data: Partial<{
        question_text: string;
        question_type: QuestionType;
        is_required: boolean;
        options: string;
        scale_min: number;
        scale_max: number;
        scale_label_min: string;
        scale_label_max: string;
        placeholder: string;
    }>
): Promise<Question | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Update question failed:", err);
            return null;
        }
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to update question:", error);
        return null;
    }
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch (error) {
        console.error("Failed to delete question:", error);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Survey API functions
// ---------------------------------------------------------------------------

export async function fetchSurveys(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
}): Promise<{ surveys: Survey[]; total: number }> {
    try {
        const searchParams = new URLSearchParams();
        searchParams.set("skip", String(params?.skip ?? 0));
        searchParams.set("limit", String(params?.limit ?? 100));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status) searchParams.set("status", params.status);

        const res = await fetch(`${API_BASE_URL}/surveys?${searchParams}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

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
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

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

export async function createSurvey(data: {
    title: string;
    description?: string;
    is_anonymous?: boolean;
    allow_multiple_responses?: boolean;
    opens_at?: string | null;
    closes_at?: string | null;
}): Promise<Survey | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Create survey failed:", err);
            return null;
        }
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create survey:", error);
        return null;
    }
}

export async function updateSurvey(
    surveyId: string,
    data: Partial<{
        title: string;
        description: string;
        is_anonymous: boolean;
        allow_multiple_responses: boolean;
        opens_at: string | null;
        closes_at: string | null;
    }>
): Promise<Survey | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Update survey failed:", err);
            return null;
        }
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to update survey:", error);
        return null;
    }
}

export async function deleteSurvey(surveyId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch (error) {
        console.error("Failed to delete survey:", error);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Survey status transitions
// ---------------------------------------------------------------------------

export async function publishSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to publish survey:", error);
        return null;
    }
}

export async function closeSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to close survey:", error);
        return null;
    }
}

export async function reopenSurvey(surveyId: string): Promise<Survey | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/reopen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to reopen survey:", error);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Survey-Question association
// ---------------------------------------------------------------------------

export async function fetchSurveyQuestions(surveyId: string): Promise<SurveyQuestionWithDetails[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/questions`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
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
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/questions/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questions),
        });
        if (!res.ok) return false;
        const json = await res.json();
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
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/questions/${questionId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch (error) {
        console.error("Failed to remove question from survey:", error);
        return false;
    }
}

export async function reorderSurveyQuestions(
    surveyId: string,
    orderMap: Record<string, number> // { question_id: new_order_index }
): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/questions/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_map: orderMap }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch (error) {
        console.error("Failed to reorder survey questions:", error);
        return false;
    }
}
