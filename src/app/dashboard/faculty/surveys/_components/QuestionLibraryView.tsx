"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Question } from "./types";
import { QUESTION_TYPES } from "./constants";

interface QuestionLibraryViewProps {
    questions: Question[];
    onCreateQuestion: () => void;
    onEditQuestion: (question: Question) => void;
    onDeleteQuestion: (id: number) => void;
}

export default function QuestionLibraryView({
    questions,
    onCreateQuestion,
    onEditQuestion,
    onDeleteQuestion
}: QuestionLibraryViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getQuestionTypeLabel = (typeValue: string) => {
        return QUESTION_TYPES.find(qt => qt.value === typeValue)?.label || typeValue;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search question library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
                <button
                    onClick={onCreateQuestion}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200"
                >
                    <Plus className="h-4 w-4" />
                    Create Question
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200/60">
                            <tr>
                                <th className="px-6 py-4">Question Text</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Required</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No questions found in the library.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuestions.map((q) => (
                                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 line-clamp-2 max-w-xl">
                                                {q.text}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                                {getQuestionTypeLabel(q.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {q.required ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/60">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200/60">
                                                    Optional
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <button
                                                    onClick={() => onEditQuestion(q)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteQuestion(q.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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
    );
}
