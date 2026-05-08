"use client";

import {
    GraduationCap,
    Briefcase,
    Zap,
    Tag,
    Database,
    Layers,
} from "lucide-react";

interface CareerTrackInput {
    skills: string;
    internship_duration: number;
    gwa: number;
}

// ── Helpers ─────────────────────────────────────────────────────

function gwaBand(gwa: number): { label: string; color: string; bg: string; border: string } {
    // Lower is better in PH GWA system (1.0 best, 5.0 worst)
    if (gwa <= 1.5) return { label: "Excellent", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200/60" };
    if (gwa <= 2.0) return { label: "Very Good", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200/60" };
    if (gwa <= 2.5) return { label: "Good", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200/60" };
    if (gwa <= 3.0) return { label: "Satisfactory", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200/60" };
    return { label: "Needs Work", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200/60" };
}

function internshipBand(months: number): { label: string; color: string; bg: string; border: string } {
    if (months >= 6) return { label: "Strong", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200/60" };
    if (months >= 3) return { label: "Solid", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200/60" };
    if (months > 0) return { label: "Some", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200/60" };
    return { label: "None", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200/60" };
}

// ── Component ───────────────────────────────────────────────────

export default function CareerInputFactors({ data }: { data: CareerTrackInput }) {
    const skills = data.skills.split(",").map((s) => s.trim()).filter(Boolean);
    const gwa = gwaBand(data.gwa);
    const internship = internshipBand(data.internship_duration);

    return (
        <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <Database className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">
                                Your Profile Snapshot
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Inputs the model used to generate this prediction
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                        {skills.length} skills
                    </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
                    {/* Skills column - 50% */}
                    <div className="md:col-span-1 lg:col-span-6 rounded-xl border border-border bg-muted/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30">
                                    <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </div>
                                <span className="text-[12px] font-bold text-foreground">
                                    Skills
                                </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                                <Layers className="h-3 w-3" strokeWidth={2.5} />
                                {skills.length} total
                            </span>
                        </div>
                        {skills.length === 0 ? (
                            <p className="text-[12px] text-muted-foreground italic">
                                No skills listed.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {skills.map((skill, i) => (
                                    <span
                                        key={`${skill}-${i}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground shadow-sm"
                                    >
                                        <Tag className="h-2.5 w-2.5 text-muted-foreground/40" strokeWidth={2.5} />
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* GWA Column - 25% */}
                    <div className="md:col-span-1 lg:col-span-3 flex flex-col p-4 rounded-xl bg-muted/40 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30">
                                    <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-bold text-foreground">GWA</span>
                            </div>
                            <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${gwa.bg} ${gwa.color} ${gwa.border}`}
                            >
                                {gwa.label}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="text-2xl font-black text-foreground tabular-nums leading-none">
                                {data.gwa.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 font-medium">
                                / 1.00 best
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            General Weighted Average
                        </span>
                    </div>

                    {/* Internship Column - 25% */}
                    <div className="md:col-span-1 lg:col-span-3 flex flex-col p-4 rounded-xl bg-muted/40 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30">
                                    <Briefcase className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-bold text-foreground">
                                    Internship
                                </span>
                            </div>
                            <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${internship.bg} ${internship.color} ${internship.border}`}
                            >
                                {internship.label}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="text-2xl font-black text-foreground tabular-nums leading-none">
                                {data.internship_duration}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                {data.internship_duration === 1 ? "month" : "months"}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            Hands-on industry experience
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
