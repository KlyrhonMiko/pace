"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, HelpCircle, Check } from "lucide-react";
import { Question, QuestionType } from "../../_lib/surveys";
import { QUESTION_TYPES } from "../../_lib/surveys";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (question: Omit<Question, "question_id">) => void;
    onReset: () => void;
    initialData?: Question | null;
    isSaving?: boolean;
}

const defaultQuestionData: Omit<Question, "question_id"> = {
    question_text: "",
    question_type: "TEXT",
    is_required: false,
};

export default function QuestionModal({ isOpen, onClose, onSubmit, onReset, initialData, isSaving = false }: QuestionModalProps) {
    const [formData, setFormData] = useState<Omit<Question, "question_id">>(defaultQuestionData);

    useEffect(() => {
        if (initialData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(initialData);
        } else {
            setFormData(defaultQuestionData);
        }
    }, [initialData, isOpen]);

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
    };

    const optionsArray = getOptionsArray();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={!isSaving}
                className="sm:max-w-2xl p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-900">
                                {initialData ? "Edit Question" : "Create New Question"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                Define question text, type, and options for your survey.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <form id="question-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Core Fields */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Question Text*
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formData.question_text}
                                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-emerald-600 focus:ring-emerald-700/20 outline-none text-sm transition-all font-medium resize-none"
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Question Type*
                                    </label>
                                    <Select
                                        value={formData.question_type}
                                        onValueChange={(v) => handleTypeChange(v as QuestionType)}
                                    >
                                        <SelectTrigger className="!w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                            {QUESTION_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end pb-1.5">
                                    <label className="flex items-center gap-3 cursor-pointer group bg-white p-2.5 px-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors h-11">
                                        <div className="relative flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={formData.is_required}
                                                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                            />
                                            <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-emerald-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Required</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* --- Dynamic Options Fields --- */}
                        <div className="pt-4 border-t border-slate-100">

                            {/* MULTI/CHOICE OPTIONS */}
                            {['MULTIPLE_CHOICE', 'MULTI_SELECT', 'YES_NO'].includes(formData.question_type) && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-md inline-block">
                                        Answer Options
                                    </label>

                                    <div className="space-y-2.5">
                                        {optionsArray.map((opt, idx) => (
                                            <div key={idx} className="flex gap-2 items-center group">
                                                <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {formData.question_type === 'MULTIPLE_CHOICE' || formData.question_type === 'YES_NO' ? '○' : '□'}
                                                </div>
                                                <Input
                                                    required
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    disabled={formData.question_type === 'YES_NO'}
                                                    className="h-10 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                                {formData.question_type !== 'YES_NO' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOption(idx)}
                                                        disabled={optionsArray.length <= 1}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
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
                                            className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-emerald-50 border border-emerald-100 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" strokeWidth={3} />
                                            Add Option
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* SCALE OPTIONS */}
                            {formData.question_type === 'SCALE' && (
                                <div className="space-y-6">
                                    <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-md inline-block">
                                        Scale Settings
                                    </label>

                                    <div className="space-y-1.5 w-48">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scale Range</label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                value={formData.scale_min || 0}
                                                onChange={(e) => setFormData({ ...formData, scale_min: parseInt(e.target.value) })}
                                                className="h-10 text-center bg-slate-50"
                                            />
                                            <span className="text-slate-400 font-bold">to</span>
                                            <Input
                                                type="number"
                                                value={formData.scale_max || 5}
                                                onChange={(e) => setFormData({ ...formData, scale_max: parseInt(e.target.value) })}
                                                className="h-10 text-center bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Label</label>
                                            <Input
                                                type="text"
                                                value={formData.scale_label_min || ''}
                                                onChange={(e) => setFormData({ ...formData, scale_label_min: e.target.value })}
                                                placeholder="e.g. Strongly Disagree"
                                                className="h-10 bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Label</label>
                                            <Input
                                                type="text"
                                                value={formData.scale_label_max || ''}
                                                onChange={(e) => setFormData({ ...formData, scale_label_max: e.target.value })}
                                                placeholder="e.g. Strongly Agree"
                                                className="h-10 bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TEXT / DATE / NUMBER - Placeholder */}
                            {['TEXT', 'DATE', 'NUMBER'].includes(formData.question_type) && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Placeholder Text (Optional)
                                    </label>
                                    <Input
                                        type="text"
                                        value={formData.placeholder || ''}
                                        onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                        placeholder={`e.g. ${formData.question_type === 'DATE' ? 'Select date' : formData.question_type === 'NUMBER' ? 'Enter a number' : 'Type your answer'}`}
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium ml-1">Shown inside the input to guide respondents.</p>
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
                    <button
                        onClick={onReset}
                        disabled={isSaving}
                        className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        {initialData ? "Reset" : "Clear"}
                    </button>
                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-200 transition-all active:scale-95 gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                            )}
                            {isSaving ? "Saving..." : (initialData ? "Save Changes" : "Save Question")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
