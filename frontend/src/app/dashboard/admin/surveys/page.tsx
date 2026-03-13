"use client";

import SurveyManagement from "../../_components/surveys/SurveyManagement";
import { ShieldCheck } from "lucide-react";

export default function AdminSurveysPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 lg:p-12 text-white shadow-2xl">
                {/* Decorative mesh */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500 blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500 blur-[100px]" />
                </div>

                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-6">
                        <ShieldCheck className="h-3 w-3" />
                        Administrative Control
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
                        Survey <span className="text-emerald-400">Management</span>
                    </h1>
                    <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
                        Create surveys, collect feedback, and manage the reusable question library for your alumni evaluations.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                <SurveyManagement />
            </div>
        </div>
    );
}
