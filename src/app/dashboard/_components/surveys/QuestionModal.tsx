"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Question, QuestionType } from "../../_lib/surveys";
import { QUESTION_TYPES } from "../../_lib/surveys";

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (question: Omit<Question, "question_id">) => void;
    initialData?: Question | null;
}

const defaultQuestionData: Omit<Question, "question_id"> = {
    question_text: "",
    question_type: "TEXT",
    is_required: false,
};

export default function QuestionModal({ isOpen, onClose, onSubmit, initialData }: QuestionModalProps) {
    const [formData, setFormData] = useState<Omit<Question, "question_id">>(defaultQuestionData);

    useEffect(() => {
        if (initialData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(initialData);
        } else {
            setFormData(defaultQuestionData);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // Helper to get options as array for rendering
    const getOptionsArray = (): string[] => {
        if (!formData.options) return [];
        if (typeof formData.options === 'string') {
            try { return JSON.parse(formData.options); } catch { return []; }
        }
        return [];
    };

    const handleTypeChange = (newType: QuestionType) => {
        const baseData = { question_text: formData.question_text, question_type: newType, is_required: formData.is_required };

        if (['MULTIPLE_CHOICE', 'MULTI_SELECT', 'YES_NO'].includes(newType)) {
            setFormData({ ...baseData, options: JSON.stringify(newType === 'YES_NO' ? ['Yes', 'No'] : ['Option 1']) });
        } else if (newType === 'SCALE') {
            setFormData({ ...baseData, scale_min: 1, scale_max: 5, scale_label_min: 'Poor', scale_label_max: 'Excellent' });
        } else {
            setFormData({ ...baseData, placeholder: '' });
        }
    };

    const handleOptionChange = (idx: number, value: string) => {
        const currentOptions = getOptionsArray();
        currentOptions[idx] = value;
        setFormData({ ...formData, options: JSON.stringify(currentOptions) });
    };

    const addOption = () => {
        const currentOptions = getOptionsArray();
        currentOptions.push(`Option ${currentOptions.length + 1}`);
        setFormData({ ...formData, options: JSON.stringify(currentOptions) });
    };

    const removeOption = (idx: number) => {
        const currentOptions = getOptionsArray().filter((_, i) => i !== idx);
        setFormData({ ...formData, options: JSON.stringify(currentOptions) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const optionsArray = getOptionsArray();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">
                        {initialData ? "Edit Question" : "Create Question"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="question-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Core Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Question Text <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formData.question_text}
                                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none text-base"
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Question Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.question_type}
                                        onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white font-medium text-slate-700 cursor-pointer"
                                    >
                                        {QUESTION_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={formData.is_required}
                                                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                            />
                                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-600 transition-colors duration-200 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                                            Required to Answer
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* --- Dynamic Options Fields --- */}
                        <div className="pt-4 border-t border-slate-100">

                            {/* MULTI/CHOICE OPTIONS */}
                            {['MULTIPLE_CHOICE', 'MULTI_SELECT', 'YES_NO'].includes(formData.question_type) && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1 text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md inline-block">
                                        Answer Options
                                    </label>

                                    <div className="space-y-2.5">
                                        {optionsArray.map((opt, idx) => (
                                            <div key={idx} className="flex gap-2 items-center group">
                                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {formData.question_type === 'MULTIPLE_CHOICE' || formData.question_type === 'YES_NO' ? '○' : '□'}
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    disabled={formData.question_type === 'YES_NO'}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                                {formData.question_type !== 'YES_NO' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOption(idx)}
                                                        disabled={optionsArray.length <= 1}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {formData.question_type !== 'YES_NO' && (
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="mt-2 text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Option
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* SCALE OPTIONS */}
                            {formData.question_type === 'SCALE' && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md inline-block mb-2">
                                        Scale Settings
                                    </label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Scale Range</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    value={formData.scale_min || 0}
                                                    onChange={(e) => setFormData({ ...formData, scale_min: parseInt(e.target.value) })}
                                                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-center"
                                                />
                                                <span className="text-slate-400 font-medium">to</span>
                                                <input
                                                    type="number"
                                                    value={formData.scale_max || 5}
                                                    onChange={(e) => setFormData({ ...formData, scale_max: parseInt(e.target.value) })}
                                                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Min Label (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.scale_label_min || ''}
                                                onChange={(e) => setFormData({ ...formData, scale_label_min: e.target.value })}
                                                placeholder="e.g. Strongly Disagree"
                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Max Label (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.scale_label_max || ''}
                                                onChange={(e) => setFormData({ ...formData, scale_label_max: e.target.value })}
                                                placeholder="e.g. Strongly Agree"
                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TEXT / DATE / NUMBER - Placeholder */}
                            {['TEXT', 'DATE', 'NUMBER'].includes(formData.question_type) && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Placeholder Text (Optional)
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">Text shown inside empty input boxes to guide the user.</p>
                                    <input
                                        type="text"
                                        value={formData.placeholder || ''}
                                        onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-slate-50/50"
                                        placeholder={`e.g. ${formData.question_type === 'DATE' ? 'Select your birthday' : formData.question_type === 'NUMBER' ? 'Enter a number...' : 'Type your answer...'}`}
                                    />
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="question-form"
                        type="submit"
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 active:scale-95"
                    >
                        {initialData ? "Save Changes" : "Save Question"}
                    </button>
                </div>
            </div>
        </div>
    );
}
