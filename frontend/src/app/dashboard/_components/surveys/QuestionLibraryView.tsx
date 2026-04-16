"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    HelpCircle,
    Library,
    Hash,
    CheckCircle2,
    CircleDashed,
    LayoutGrid
} from "lucide-react";
import { Question } from "../../_lib/surveys";
import { QUESTION_TYPES } from "../../_lib/surveys";
import ActionsCard from "./ActionsCard";
import { Button } from "@/components/ui/button";

interface QuestionLibraryViewProps {
    questions: Question[];
    onCreateQuestion: () => void;
    onEditQuestion: (question: Question) => void;
    onDeleteQuestion: (id: string) => void;
}

export default function QuestionLibraryView({
    questions,
    onCreateQuestion,
    onEditQuestion,
    onDeleteQuestion
}: QuestionLibraryViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredQuestions = questions.filter(q =>
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getQuestionTypeLabel = (typeValue: string) => {
        return QUESTION_TYPES.find(qt => qt.value === typeValue)?.label || typeValue;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col-reverse lg:flex-row-reverse gap-8 items-start">
                {/* Sidebar Actions */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="flex flex-col gap-4 sticky top-24">
                        <ActionsCard
                            title="Question Library"
                            description="Manage your reusable questions"
                            icon={<Library className="h-5 w-5" />}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            placeholder="Search questions..."
                            actions={[
                                {
                                    label: "Create Question",
                                    onClick: onCreateQuestion,
                                    icon: <Plus className="h-4 w-4 stroke-2" />,
                                    variant: "primary"
                                }
                            ]}
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 min-w-0">
                    <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 flex flex-col shadow-sm">
                        {/* Header Area */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                                    <Library className="h-5 w-5" strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Question Repository
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Manage reusable templates ({filteredQuestions.length})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50/30 border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Question Content</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requirement</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {filteredQuestions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                                        <HelpCircle className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">No questions found</p>
                                                        <p className="text-xs text-slate-500 mt-1">Initialize your library by creating your first question.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQuestions.map((q) => (
                                            <tr key={q.question_id} className="group transition-all duration-200 hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                                            <Hash className="h-4.5 w-4.5" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 text-sm line-clamp-2 leading-relaxed">
                                                                {q.question_text}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider flex items-center gap-1">
                                                                ID: {q.question_id.split('-')[0]}...
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 rounded bg-slate-100 text-slate-500">
                                                            <LayoutGrid className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[13px] font-semibold text-slate-700">
                                                            {getQuestionTypeLabel(q.question_type)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {q.is_required ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wider border border-rose-100">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Required
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border border-slate-200">
                                                            <CircleDashed className="h-3 w-3" />
                                                            Optional
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onEditQuestion(q)}
                                                            className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onDeleteQuestion(q.question_id)}
                                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
