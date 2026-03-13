"use client";

import SurveyManagement from "../../_components/surveys/SurveyManagement";
import { GraduationCap } from "lucide-react";

export default function FacultySurveysPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-8 lg:p-12 text-white shadow-2xl">
                {/* Decorative mesh */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400 blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-400 blur-[100px]" />
                </div>

                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200 mb-6">
                        <GraduationCap className="h-3 w-3" />
                        Faculty Dashboard
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
                        Survey <span className="text-teal-300">HUB</span>
                    </h1>
                    <p className="text-emerald-50/80 text-lg max-w-xl leading-relaxed">
                        Create surveys, gather student feedback, and manage your reusable question library for academic evaluations.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />
                <SurveyManagement />
            </div>
        </div>
    );
}
