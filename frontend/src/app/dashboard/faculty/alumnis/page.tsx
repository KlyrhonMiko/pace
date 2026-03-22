"use client";

import AlumniManagement from "./_components/AlumniManagement";
import { GraduationCap, Users } from "lucide-react";

export default function FacultyAlumniPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-8 lg:p-12 text-white shadow-2xl">
                {/* Decorative mesh */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400 blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-400 blur-[100px]" />
                </div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200 mb-6">
                            <GraduationCap className="h-3 w-3" />
                            Faculty Dashboard
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
                            Alumni <span className="text-teal-300">Management</span>
                        </h1>
                        <p className="text-emerald-50/80 text-lg max-w-xl leading-relaxed">
                            View and manage alumni records, track academic performance,
                            and maintain student details for your department.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[160px] hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-teal-400/20 text-teal-300">
                                    <Users className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest">Total</span>
                            </div>
                            <div className="text-3xl font-black">8</div>
                            <div className="text-[11px] font-bold text-teal-300/60 uppercase mt-1">Alumni Records</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent opacity-50" />
                <AlumniManagement />
            </div>
        </div>
    );
}
