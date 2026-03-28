"use client";

import { Calendar, HelpCircle, CheckCircle2, Clock } from "lucide-react";
import { Survey } from "../../../_lib/surveys";

interface AlumniSurveyCardProps {
    survey: Survey;
    isCompleted: boolean;
    onTakeSurvey: () => void;
}

export default function AlumniSurveyCard({ survey, isCompleted, onTakeSurvey }: AlumniSurveyCardProps) {
    return (
        <div className={`group relative rounded-2xl border bg-white p-5 transition-all duration-300 flex flex-col h-full ${
            isCompleted 
                ? 'border-slate-200/60 opacity-80' 
                : 'border-slate-200/80 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200'
        }`}>
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-4">
                {isCompleted ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Completed
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Active
                    </div>
                )}

                {/* Question Count Badge */}
                <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100" title="Number of Questions">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    {survey.question_count ?? 0} Qs
                </div>
            </div>

            {/* Title & Description */}
            <div className="flex-1">
                <h3 className={`text-lg font-bold line-clamp-2 mb-2 transition-colors ${
                    isCompleted 
                        ? 'text-slate-600' 
                        : 'text-slate-900 group-hover:text-emerald-700'
                }`}>
                    {survey.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-5">
                    {survey.description}
                </p>
            </div>

            {/* Details Footer */}
            <div className="space-y-4 pt-4 border-t border-slate-100 mt-auto">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Opens</span>
                            <span className="font-semibold">{survey.opens_at ? survey.opens_at.split(/[T ]/)[0] : '—'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Closes</span>
                            <span className="font-semibold">{survey.closes_at ? survey.closes_at.split(/[T ]/)[0] : '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-1">
                    {isCompleted ? (
                        <button
                            disabled
                            className="w-full py-2.5 text-sm font-bold text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed"
                        >
                            ✓ Response Submitted
                        </button>
                    ) : (
                        <button
                            onClick={onTakeSurvey}
                            className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm shadow-emerald-200 active:scale-[0.98]"
                        >
                            Take Survey
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
