"use client";

import { useState, useEffect } from "react";
import { X, Loader2, RotateCcw, Send } from "lucide-react";
import { Survey, Question } from "../../../_lib/surveys";
import { DatePicker } from "@/components/ui/date-picker";

// ------------------------------------------------------------------
// Types for building the submission payload
// ------------------------------------------------------------------

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
    alumni_id?: string | null; // null — the backend resolves identity from auth token
    answers: AnswerItem[];
}

interface SurveyResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    survey: Survey | null;
    onSubmit: (surveyId: string, payload: SurveySubmissionPayload) => Promise<boolean>;
    isSubmitting?: boolean;
    isLoadingQuestions?: boolean;
    readOnly?: boolean;
    initialAnswers?: any;
}

// ------------------------------------------------------------------
// Helper: parse options JSON safely
// ------------------------------------------------------------------
function parseOptions(raw?: string): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export default function SurveyResponseModal({
    isOpen,
    onClose,
    survey,
    onSubmit,
    isSubmitting = false,
    isLoadingQuestions = false,
    readOnly = false,
    initialAnswers = null,
}: SurveyResponseModalProps) {
    // Answer state: keyed by question_id
    const [answers, setAnswers] = useState<Record<string, AnswerItem>>({});
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

    // Reset answers when a new survey is opened
    useEffect(() => {
        if (survey && isOpen) {
            if (readOnly && initialAnswers?.answers) {
                // Convert list to record
                const rec: Record<string, AnswerItem> = {};
                initialAnswers.answers.forEach((a: any) => {
                    rec[a.question_id] = a;
                });
                setAnswers(rec);
            } else {
                setAnswers({});
            }
            setValidationErrors(new Set());
        }
    }, [survey, isOpen, readOnly, initialAnswers]);

    if (!isOpen || !survey) return null;

    const questions: Question[] = survey.questions || [];

    // ---- Answer helpers ----
    const getAnswer = (qId: string): AnswerItem => answers[qId] || { question_id: qId };

    const setAnswer = (qId: string, patch: Partial<AnswerItem>) => {
        if (readOnly) return;
        setAnswers(prev => ({
            ...prev,
            [qId]: { ...prev[qId], question_id: qId, ...patch },
        }));
        // Clear validation error when user answers
        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(qId);
            return next;
        });
    };

    // ---- Clear all ----
    const handleClear = () => {
        setAnswers({});
        setValidationErrors(new Set());
    };

    // ---- Validate & Submit ----
    const handleSubmit = async () => {
        // Validate required questions
        const errors = new Set<string>();
        questions.forEach(q => {
            if (!q.is_required) return;

            const a = answers[q.question_id];
            if (!a) { errors.add(q.question_id); return; }

            switch (q.question_type) {
                case "TEXT":
                    if (!a.answer_text?.trim()) errors.add(q.question_id);
                    break;
                case "MULTIPLE_CHOICE":
                    if (!a.answer_choice) errors.add(q.question_id);
                    break;
                case "MULTI_SELECT": {
                    const choices = a.answer_choices ? JSON.parse(a.answer_choices) : [];
                    if (choices.length === 0) errors.add(q.question_id);
                    break;
                }
                case "SCALE":
                    if (a.answer_scale == null) errors.add(q.question_id);
                    break;
                case "YES_NO":
                    if (a.answer_bool == null) errors.add(q.question_id);
                    break;
                case "DATE":
                    if (!a.answer_date) errors.add(q.question_id);
                    break;
                case "NUMBER":
                    if (a.answer_number == null || Number.isNaN(a.answer_number)) errors.add(q.question_id);
                    break;
            }
        });

        if (errors.size > 0) {
            setValidationErrors(errors);
            // Scroll to first error
            const firstErrorId = [...errors][0];
            document.getElementById(`question-${firstErrorId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        // Build payload
        const payload: SurveySubmissionPayload = {
            alumni_id: null,
            answers: questions.map(q => {
                const a = answers[q.question_id] || { question_id: q.question_id };
                return {
                    question_id: q.question_id,
                    answer_text: a.answer_text ?? null,
                    answer_choice: a.answer_choice ?? null,
                    answer_choices: a.answer_choices ?? null,
                    answer_scale: a.answer_scale ?? null,
                    answer_number: a.answer_number ?? null,
                    answer_date: a.answer_date ?? null,
                    answer_bool: a.answer_bool ?? null,
                };
            }),
        };

        await onSubmit(survey.survey_id, payload);
    };

    // ---- Render individual question ----
    const renderQuestion = (q: Question, index: number) => {
        const a = getAnswer(q.question_id);
        const hasError = validationErrors.has(q.question_id);

        return (
            <div
                key={q.question_id}
                id={`question-${q.question_id}`}
                className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${hasError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
                    }`}
            >
                {/* Question Header */}
                <div className="flex items-start gap-3 mb-5">
                    <span className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0 mt-0.5">
                        {index + 1}
                    </span>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 text-[15px] leading-snug">
                            {q.question_text}
                            {q.is_required && <span className="text-rose-500 ml-1">*</span>}
                        </h4>
                        <span className="text-xs font-medium text-slate-400 mt-1 inline-block">
                            {q.question_type.replace("_", " ")}
                        </span>
                    </div>
                </div>

                {/* Answer Area */}
                <div className="pl-10">
                    {q.question_type === "TEXT" && (
                        <textarea
                            rows={3}
                            value={a.answer_text || ""}
                            onChange={e => setAnswer(q.question_id, { answer_text: e.target.value })}
                            placeholder={readOnly ? "" : (q.placeholder || "Type your answer here...")}
                            disabled={readOnly}
                            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none text-sm ${readOnly ? "bg-slate-50 cursor-default" : ""}`}
                        />
                    )}

                    {q.question_type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2.5">
                            {parseOptions(q.options).map((opt, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setAnswer(q.question_id, { answer_choice: opt })}
                                    className="flex items-center gap-3 w-full text-left group"
                                >
                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${a.answer_choice === opt
                                        ? "border-emerald-600 bg-emerald-600"
                                        : "border-slate-300 group-hover:border-emerald-400"
                                        } ${readOnly ? "opacity-80" : ""}`}>
                                        {a.answer_choice === opt && (
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${a.answer_choice === opt ? "text-emerald-700" : "text-slate-700"}`}>{opt}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {q.question_type === "MULTI_SELECT" && (() => {
                        const selected: string[] = a.answer_choices ? JSON.parse(a.answer_choices) : [];
                        const toggleOption = (opt: string) => {
                            const next = selected.includes(opt)
                                ? selected.filter(s => s !== opt)
                                : [...selected, opt];
                            setAnswer(q.question_id, { answer_choices: JSON.stringify(next) });
                        };
                        return (
                            <div className="space-y-2.5">
                                {parseOptions(q.options).map((opt, i) => {
                                    const isChecked = selected.includes(opt);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => toggleOption(opt)}
                                            className="flex items-center gap-3 w-full text-left group"
                                        >
                                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${isChecked
                                                ? "border-emerald-600 bg-emerald-600"
                                                : "border-slate-300 group-hover:border-emerald-400"
                                                } ${readOnly ? "opacity-80" : ""}`}>
                                                {isChecked && (
                                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`text-sm font-medium ${isChecked ? "text-emerald-700" : "text-slate-700"}`}>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {q.question_type === "SCALE" && (() => {
                        const min = q.scale_min ?? 1;
                        const max = q.scale_max ?? 5;
                        const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                        return (
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {range.map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAnswer(q.question_id, { answer_scale: val })}
                                            className={`h-10 w-10 rounded-xl border-2 text-sm font-bold transition-all ${a.answer_scale === val
                                                ? "border-emerald-600 bg-emerald-600 text-white shadow-md scale-110"
                                                : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                                                } ${readOnly && a.answer_scale !== val ? "opacity-40 grayscale" : ""} ${readOnly ? "cursor-default" : ""}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                {(q.scale_label_min || q.scale_label_max) && (
                                    <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium px-1">
                                        <span>{q.scale_label_min || ""}</span>
                                        <span>{q.scale_label_max || ""}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {q.question_type === "YES_NO" && (
                        <div className="flex gap-3">
                            {[true, false].map(val => (
                                <button
                                    key={String(val)}
                                    type="button"
                                    onClick={() => setAnswer(q.question_id, { answer_bool: val })}
                                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${a.answer_bool === val
                                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                                        : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                                        } ${readOnly && a.answer_bool !== val ? "opacity-40 grayscale" : ""} ${readOnly ? "cursor-default" : ""}`}
                                >
                                    {val ? "Yes" : "No"}
                                </button>
                            ))}
                        </div>
                    )}

                    {q.question_type === "DATE" && (
                        <div className="max-w-xs">
                            <DatePicker
                                date={a.answer_date || ""}
                                onChange={(date: string) => setAnswer(q.question_id, { answer_date: date })}
                                placeholder={readOnly ? "" : "Select response date"}
                                disabled={readOnly}
                            />
                        </div>
                    )}

                    {q.question_type === "NUMBER" && (
                        <input
                            type="number"
                            value={a.answer_number ?? ""}
                            onChange={e => setAnswer(q.question_id, { answer_number: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder={readOnly ? "" : (q.placeholder || "Enter a number...")}
                            disabled={readOnly}
                            className={`w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-sm ${readOnly ? "bg-slate-50 cursor-default" : ""}`}
                        />
                    )}

                </div>

                {/* Validation Error */}
                {hasError && (
                    <p className="text-xs text-rose-500 font-medium mt-3 pl-10">
                        This question is required
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-800 leading-tight truncate">
                                {survey.title}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium truncate">
                                {questions.length} question{questions.length !== 1 ? "s" : ""} · {survey.is_anonymous ? "Anonymous" : "Identified"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <div className="max-w-2xl mx-auto p-6 space-y-6">

                        {/* Survey Description */}
                        {survey.description && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                                <p className="text-sm text-emerald-800 leading-relaxed">
                                    {survey.description}
                                </p>
                            </div>
                        )}

                        {/* Questions */}
                        {isLoadingQuestions ? (
                            /* Loading skeleton while questions fetch */
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
                                        <div className="flex items-start gap-3 mb-5">
                                            <div className="h-7 w-7 rounded-full bg-slate-200 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                                <div className="h-3 bg-slate-100 rounded w-1/4" />
                                            </div>
                                        </div>
                                        <div className="pl-10 space-y-2">
                                            <div className="h-10 bg-slate-100 rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">No Questions</h3>
                                <p className="text-slate-500 text-sm">
                                    This survey doesn&apos;t have any questions yet.
                                </p>
                            </div>
                        ) : (
                            questions.map((q, idx) => renderQuestion(q, idx))
                        )}
                    </div>
                </div>

                {/* Footer with Submit/Clear or Close */}
                {!isLoadingQuestions && questions.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                        <div className="flex items-center gap-3 max-w-2xl mx-auto">
                            {!readOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Clear Form
                                    </button>
                                    <div className="flex-1" />
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200 active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {isSubmitting ? "Submitting..." : "Submit Response"}
                                    </button>
                                </>
                            )}
                            {readOnly && (
                                <div className="w-full flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
