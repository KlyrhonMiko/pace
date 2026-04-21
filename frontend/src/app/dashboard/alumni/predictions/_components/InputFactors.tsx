"use client";

import {
    GraduationCap,
    Briefcase,
    Zap,
    Award,
    BookOpen,
} from "lucide-react";
import { RegressionInput } from "../_lib/api";

// ── Factor config ───────────────────────────────────────────────

const factorConfig = [
    {
        key: "cgpa" as const,
        label: "CGPA",
        icon: GraduationCap,
        format: (v: number) => v.toFixed(2),
        description: "Cumulative GPA (1.0 = best)",
        gradient: "from-violet-500 to-purple-500",
        shadow: "shadow-violet-500/20",
    },
    {
        key: "soft_skills_ave" as const,
        label: "Soft Skills",
        icon: Award,
        format: (v: number) => v.toFixed(1),
        description: "Communication, teamwork, leadership (0-100)",
        gradient: "from-blue-500 to-cyan-500",
        shadow: "shadow-blue-500/20",
    },
    {
        key: "hard_skills_ave" as const,
        label: "Hard Skills",
        icon: Zap,
        format: (v: number) => v.toFixed(1),
        description: "Technical & technical competencies (0-100)",
        gradient: "from-emerald-500 to-teal-500",
        shadow: "shadow-emerald-500/20",
    },
    {
        key: "program_skills_average" as const,
        label: "Program Skills",
        icon: BookOpen,
        format: (v: number) => v.toFixed(1),
        description: "Program-specific skills average (0-100)",
        gradient: "from-amber-500 to-orange-500",
        shadow: "shadow-amber-500/20",
    },
    {
        key: "internships" as const,
        label: "Internships",
        icon: Briefcase,
        format: (v: number) => (v >= 1 ? "Yes" : "No"),
        description: "Completed internship(s)",
        gradient: "from-rose-500 to-pink-500",
        shadow: "shadow-rose-500/20",
    },
];

// ── Component ───────────────────────────────────────────────────

export default function InputFactors({
    data,
}: {
    data: RegressionInput;
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg shadow-gray-900/20">
                        <GraduationCap className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            Input Factors
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Academic data used for prediction
                        </p>
                    </div>
                </div>

                {/* Factor grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {factorConfig.map((factor) => {
                        const Icon = factor.icon;
                        const value = data[factor.key];
                        return (
                            <div
                                key={factor.key}
                                className="flex flex-col items-center p-4 rounded-xl bg-gray-50/80 border border-gray-100/60 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                            >
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${factor.gradient} text-white shadow-md ${factor.shadow} mb-3`}
                                >
                                    <Icon className="h-4 w-4" strokeWidth={2} />
                                </div>
                                <span className="text-lg font-bold text-gray-900 tabular-nums">
                                    {factor.format(value)}
                                </span>
                                <span className="text-[11px] font-medium text-gray-600 mt-0.5">
                                    {factor.label}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">
                                    {factor.description}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
