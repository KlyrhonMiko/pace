"use client";

import { useState, useEffect } from "react";
import { Calendar, Settings2, HelpCircle, GripVertical, Trash2, LibraryBig, Loader2, ClipboardList, Check, Globe } from "lucide-react";
import { Survey, Question } from "../../_lib/surveys";
import { getDepartments, getCourses, CollegeDeptPublic, CoursePublic } from "../../_lib/academic";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (survey: Omit<Survey, "survey_id" | "question_count">) => void;
    onReset: () => void;
    initialData?: Survey | null;
    questionLibrary: Question[];
    isSaving?: boolean;
}

const defaultSurveyData: Omit<Survey, "survey_id" | "question_count"> = {
    title: "",
    description: "",
    status: "DRAFT",
    is_anonymous: false,
    allow_multiple_responses: false,
    opens_at: "",
    closes_at: "",
    target_department_abbv: null,
    target_course_abbv: null,
    questions: [],
};

export default function SurveyModal({ isOpen, onClose, onSubmit, onReset, initialData, questionLibrary, isSaving = false }: SurveyModalProps) {
    const [formData, setFormData] = useState<Omit<Survey, "survey_id" | "question_count">>(defaultSurveyData);

    // UI State for tabs within the modal (Basic Info vs Questions Builder)
    const [activeSection, setActiveSection] = useState<'details' | 'questions'>('details');

    // State for nested Question logic
    const [showLibrarySelector, setShowLibrarySelector] = useState(false);

    // Drag-and-drop reorder state (must be before early return)
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dropIdx, setDropIdx] = useState<number | null>(null);

    // Academic targeting state
    const [departments, setDepartments] = useState<CollegeDeptPublic[]>([]);
    const [courses, setCourses] = useState<CoursePublic[]>([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                // Backend returns "2026-03-04 00:00:00", date input needs "2026-03-04"
                opens_at: initialData.opens_at ? initialData.opens_at.split(/[T ]/)[0] : "",
                closes_at: initialData.closes_at ? initialData.closes_at.split(/[T ]/)[0] : "",
                target_department_abbv: initialData.target_department_abbv || null,
                target_course_abbv: initialData.target_course_abbv || null,
            });
        } else {
            setFormData(defaultSurveyData);
            setActiveSection('details');
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (isOpen) {
            getDepartments({ limit: 100 }).then(res => {
                if (res.success) setDepartments(res.data.college_depts);
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && formData.target_department_abbv) {
            getCourses({ limit: 100, college_dept_abbv: formData.target_department_abbv }).then(res => {
                if (res.success) setCourses(res.data.courses);
            });
        } else {
            setCourses([]);
        }
    }, [isOpen, formData.target_department_abbv]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // --- Question Handlers inside the Survey Builder ---
    const handleDeleteQuestion = (idx: number) => {
        const updatedQuestions = (formData.questions || []).filter((_, i) => i !== idx);
        setFormData({ ...formData, questions: updatedQuestions });
    };

    const handleAddFromLibrary = (q: Question) => {
        // Deep copy the question so edits here don't affect the library
        const newQuestion = JSON.parse(JSON.stringify(q));
        setFormData({ ...formData, questions: [...(formData.questions || []), newQuestion] });
        setShowLibrarySelector(false);
    };

    // --- Drag-and-drop reorder handlers ---

    const handleDragStart = (idx: number) => {
        setDragIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        setDropIdx(idx);
    };

    const handleDrop = (e: React.DragEvent, targetIdx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === targetIdx) {
            setDragIdx(null);
            setDropIdx(null);
            return;
        }
        const items = [...(formData.questions || [])];
        const [moved] = items.splice(dragIdx, 1);
        items.splice(targetIdx, 0, moved);
        setFormData({ ...formData, questions: items });
        setDragIdx(null);
        setDropIdx(null);
    };

    const handleDragEnd = () => {
        setDragIdx(null);
        setDropIdx(null);
    };

    const questionsArray = formData.questions || [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={!isSaving}
                className="sm:max-w-3xl p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl h-[90vh] flex flex-col"
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-900">
                                {initialData ? "Edit Survey" : "Create New Survey"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                Build your custom feedback form and manage questions.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Sub Navigation */}
                <div className="flex border-b border-slate-200 px-6 shrink-0 bg-white">
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
                        Questions Builder ({questionsArray.length})
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
                    <form id="survey-form" onSubmit={handleSubmit} className="p-6">

                        {/* ===================== DETAILS SECTION ===================== */}
                        <div className={activeSection === 'details' ? 'block' : 'hidden'}>
                            <div className="max-w-2xl mx-auto space-y-8">

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-emerald-900 uppercase tracking-[0.2em] mb-2">Basic Information</h3>

                                    <div className="space-y-1 mt-4">
                                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                                            Don&apos;t see what you&apos;re looking for? Select questions from your library to add them to this survey.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            Survey Title*
                                        </label>
                                        <Input
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                            placeholder="e.g. End of Semester Evaluation"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-emerald-600 focus:ring-emerald-700/20 outline-none text-sm transition-all font-medium resize-none"
                                            placeholder="Briefly explain the purpose of this survey..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-emerald-900 uppercase tracking-[0.2em] mb-2 pt-6 border-t border-slate-200">Target Range</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Target Department</label>
                                            <Select
                                                value={formData.target_department_abbv || "all"}
                                                onValueChange={(val) => setFormData({ 
                                                    ...formData, 
                                                    target_department_abbv: val === "all" ? null : val,
                                                    target_course_abbv: null 
                                                })}
                                            >
                                                <SelectTrigger className="h-10 bg-white border-slate-200">
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>All Alumni</span>
                                                        </div>
                                                    </SelectItem>
                                                    {departments.map(d => (
                                                        <SelectItem key={d.college_dept_id} value={d.college_dept_abbv}>
                                                            {d.college_dept_abbv} - {d.college_dept_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Target Course</label>
                                            <Select
                                                disabled={!formData.target_department_abbv}
                                                value={formData.target_course_abbv || "all"}
                                                onValueChange={(val) => setFormData({ 
                                                    ...formData, 
                                                    target_course_abbv: val === "all" ? null : val 
                                                })}
                                            >
                                                <SelectTrigger className="h-10 bg-white border-slate-200">
                                                    <SelectValue placeholder="Select Course" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Courses in Department</SelectItem>
                                                    {courses.map(c => (
                                                        <SelectItem key={c.course_id} value={c.course_abbv}>
                                                            {c.course_abbv} - {c.course_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {!formData.target_department_abbv && (
                                                <p className="text-[10px] text-slate-400">Select a department first to target specific courses.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-emerald-900 uppercase tracking-[0.2em] mb-2 pt-6 border-t border-slate-200">Settings & Rules</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

                                        <div className="flex flex-col gap-4">
                                            {/* Anonymous Toggle */}
                                            <label className="flex items-start gap-3 cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors flex-1">
                                                <div className="relative flex-shrink-0 mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={formData.is_anonymous}
                                                        onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                                                    />
                                                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-emerald-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-800">Anonymous Responses</span>
                                                    <span className="block text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">Do not record names or emails</span>
                                                </div>
                                            </label>

                                            {/* Multiple Responses Toggle */}
                                            <label className="flex items-start gap-3 cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors flex-1">
                                                <div className="relative flex-shrink-0 mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={formData.allow_multiple_responses}
                                                        onChange={(e) => setFormData({ ...formData, allow_multiple_responses: e.target.checked })}
                                                    />
                                                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-emerald-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-800">Multiple Responses</span>
                                                    <span className="block text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">Allow users to submit more than once</span>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="h-full">
                                            {/* Dates */}
                                            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 h-full flex flex-col justify-center">
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <Calendar className="w-3.5 h-3.5" /> Opens At
                                                    </label>
                                                    <DatePicker
                                                        date={formData.opens_at || ''}
                                                        onChange={(date: string) => setFormData({ ...formData, opens_at: date || null })}
                                                        placeholder="Select opening date"
                                                        className="bg-slate-50"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <Calendar className="w-3.5 h-3.5" /> Closes At
                                                    </label>
                                                    <DatePicker
                                                        date={formData.closes_at || ''}
                                                        onChange={(date: string) => setFormData({ ...formData, closes_at: date || null })}
                                                        placeholder="Select closing date"
                                                        className="bg-slate-50"
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
                            <div className="max-w-2xl mx-auto">

                                {/* Question List */}
                                <div className="space-y-4 mb-8">
                                    {questionsArray.length === 0 ? (
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
                                        questionsArray.map((q, idx) => (
                                            <div
                                                key={q.question_id || idx}
                                                draggable
                                                onDragStart={() => handleDragStart(idx)}
                                                onDragOver={(e) => handleDragOver(e, idx)}
                                                onDrop={(e) => handleDrop(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                className={`bg-white border rounded-xl p-5 shadow-sm group hover:border-emerald-300 transition-all flex gap-4 ${dragIdx === idx
                                                    ? 'opacity-40 scale-[0.97] border-emerald-300'
                                                    : dropIdx === idx
                                                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                                                        : 'border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-2 pt-1">
                                                    <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-slate-900 pr-8">
                                                            {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
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
                                                        {q.question_type.replace('_', ' ')}
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
                                            {(() => {
                                                const existingIds = new Set(questionsArray.map(q => q.question_id));
                                                const available = questionLibrary.filter(q => !existingIds.has(q.question_id));
                                                if (available.length === 0) {
                                                    return (
                                                        <div className="p-4 text-center text-slate-500 text-sm">
                                                            {questionLibrary.length === 0
                                                                ? "Library is empty."
                                                                : "Questions you create will be available to use in any survey."}
                                                        </div>
                                                    );
                                                }
                                                return available.map(libQ => (
                                                    <div key={libQ.question_id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{libQ.question_text}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{libQ.question_type.replace('_', ' ')}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddFromLibrary(libQ)}
                                                            className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                ));
                                            })()}
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

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
                    <button
                        onClick={onReset}
                        disabled={isSaving}
                        className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        {initialData ? "Reset" : "Clear"}
                    </button>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                            )}
                            {isSaving ? "Saving..." : "Save Survey"}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
