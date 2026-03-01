"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Settings2, HelpCircle, GripVertical, Trash2, LibraryBig } from "lucide-react";
import { Survey, Question } from "./types";
import { SURVEY_STATUSES } from "./constants";

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (survey: Omit<Survey, "id" | "responsesCount">) => void;
    initialData?: Survey | null;
    questionLibrary: Question[];
}

const defaultSurveyData: Omit<Survey, "id" | "responsesCount"> = {
    title: "",
    description: "",
    isAnonymous: false,
    allowMultipleResponses: false,
    opensAt: "",
    closesAt: "",
    status: "DRAFT",
    questions: [],
};

export default function SurveyModal({ isOpen, onClose, onSubmit, initialData, questionLibrary }: SurveyModalProps) {
    const [formData, setFormData] = useState<Omit<Survey, "id" | "responsesCount">>(defaultSurveyData);

    // UI State for tabs within the modal (Basic Info vs Questions Builder)
    const [activeSection, setActiveSection] = useState<'details' | 'questions'>('details');

    // State for nested Question logic
    const [showLibrarySelector, setShowLibrarySelector] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(defaultSurveyData);
            setActiveSection('details');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    // --- Question Handlers inside the Survey Builder ---
    const handleDeleteQuestion = (idx: number) => {
        const updatedQuestions = formData.questions.filter((_, i) => i !== idx);
        setFormData({ ...formData, questions: updatedQuestions });
    };

    const handleAddFromLibrary = (q: Question) => {
        // Deep copy the question so edits here don't affect the library
        const newQuestion = JSON.parse(JSON.stringify(q));
        newQuestion.id = Date.now();
        setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
        setShowLibrarySelector(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 leading-tight">
                                {initialData ? "Edit Survey" : "Create New Survey"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Build your custom feedback form</p>
                        </div>
                    </div>

                    <button
                        form="survey-form"
                        type="submit"
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200"
                    >
                        Save Survey
                    </button>
                </div>

                {/* Sub Navigation */}
                <div className="flex border-b border-slate-200 px-6 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveSection('details')}
                        className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition-colors mr-8 ${activeSection === 'details'
                            ? 'border-emerald-600 text-emerald-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        Survey Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('questions')}
                        className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition-colors ${activeSection === 'questions'
                            ? 'border-emerald-600 text-emerald-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <HelpCircle className="w-4 h-4" />
                        Questions Builder ({formData.questions.length})
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <form id="survey-form" onSubmit={handleSubmit} className="p-6">

                        {/* ===================== DETAILS SECTION ===================== */}
                        <div className={activeSection === 'details' ? 'block' : 'hidden'}>
                            <div className="max-w-2xl mx-auto space-y-8">

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-2">Basic Information</h3>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Survey Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                            placeholder="e.g. End of Semester Evaluation"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                                            placeholder="Briefly explain the purpose of this survey..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-2 pt-6 border-t border-slate-200">Settings & Rules</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white font-medium"
                                            >
                                                {SURVEY_STATUSES.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-4">
                                            {/* Anonymous Toggle */}
                                            <label className="flex items-start gap-3 cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors">
                                                <div className="relative flex-shrink-0 mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={formData.isAnonymous}
                                                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                                                    />
                                                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-emerald-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-800">Anonymous Responses</span>
                                                    <span className="block text-xs text-slate-500 mt-0.5">Do not record names or emails</span>
                                                </div>
                                            </label>

                                            {/* Multiple Responses Toggle */}
                                            <label className="flex items-start gap-3 cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors">
                                                <div className="relative flex-shrink-0 mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={formData.allowMultipleResponses}
                                                        onChange={(e) => setFormData({ ...formData, allowMultipleResponses: e.target.checked })}
                                                    />
                                                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-emerald-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-800">Multiple Responses</span>
                                                    <span className="block text-xs text-slate-500 mt-0.5">Allow users to submit more than once</span>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Dates */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                                <div>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Opens At *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.opensAt}
                                                        onChange={(e) => setFormData({ ...formData, opensAt: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:border-emerald-500 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Closes At *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.closesAt}
                                                        onChange={(e) => setFormData({ ...formData, closesAt: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:border-emerald-500 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================== QUESTIONS SECTION ===================== */}
                        <div className={activeSection === 'questions' ? 'block' : 'hidden'}>
                            <div className="max-w-3xl mx-auto">

                                {/* Question List */}
                                <div className="space-y-4 mb-8">
                                    {formData.questions.length === 0 ? (
                                        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                                            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                                <HelpCircle className="h-8 w-8 text-emerald-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2">No Questions Yet</h3>
                                            <p className="text-slate-500 text-sm max-w-sm">
                                                Build your survey by adding questions from scratch or importing them from your Question Library.
                                            </p>
                                        </div>
                                    ) : (
                                        formData.questions.map((q, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm group hover:border-emerald-300 transition-colors flex gap-4">
                                                <div className="flex flex-col items-center gap-2 pt-1">
                                                    <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-slate-900 pr-8">
                                                            {q.text} {q.required && <span className="text-rose-500">*</span>}
                                                        </h4>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteQuestion(idx)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-500 bg-slate-100 inline-flex px-2 py-0.5 rounded border border-slate-200">
                                                        {q.type.replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Actions */}
                                {showLibrarySelector ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-emerald-900">Select from Library</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowLibrarySelector(false)}
                                                className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden divide-y divide-emerald-50 max-h-60 overflow-y-auto">
                                            {questionLibrary.length === 0 ? (
                                                <div className="p-4 text-center text-slate-500 text-sm">Library is empty.</div>
                                            ) : (
                                                questionLibrary.map(libQ => (
                                                    <div key={libQ.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{libQ.text}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{libQ.type.replace('_', ' ')}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddFromLibrary(libQ)}
                                                            className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                                            <h4 className="font-bold text-slate-800 mb-1">Need a New Question?</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Please go to the <strong>Question Library</strong> tab on the main page to create and manage your reusable questions.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowLibrarySelector(true)}
                                            className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-4 px-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group shadow-sm"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <LibraryBig className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <span className="font-bold text-sm text-slate-800">Choose from Library</span>
                                            <span className="text-xs text-slate-500 font-medium">{questionLibrary.length} available</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
