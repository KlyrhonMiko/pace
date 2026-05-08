"use client";

import {
    Lightbulb,
    Briefcase,
    Wrench,
    CheckCircle2,
    Circle,
    Wallet,
} from "lucide-react";
import { getTrackMeta } from "../_lib/track-meta";

interface Props {
    predicted: string;
    userSkills: string;
}

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

export default function CareerTrackInsights({ predicted, userSkills }: Props) {
    const meta = getTrackMeta(predicted);
    const Icon = meta.icon;

    const ownedSet = new Set(
        userSkills
            .split(",")
            .map((s) => normalize(s))
            .filter(Boolean)
    );

    // Skill alignment: check which key skills the user already has
    const skillsWithStatus = meta.keySkills.map((s) => ({
        name: s,
        owned: ownedSet.has(normalize(s)),
    }));

    const ownedCount = skillsWithStatus.filter((s) => s.owned).length;
    const totalKey = skillsWithStatus.length;
    const alignmentPct = totalKey > 0 ? (ownedCount / totalKey) * 100 : 0;

    return (
        <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 h-full">
            <div className="p-6 flex flex-col gap-5 h-full">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                        <Lightbulb className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">
                            About This Track
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            What it takes to thrive as a {predicted}
                        </p>
                    </div>
                </div>

                {/* Skill alignment summary */}
                <div
                    className={`rounded-xl p-4 border ${meta.softBorder} ${meta.softBg}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Icon
                                className="h-4 w-4"
                                style={{ color: meta.accent }}
                                strokeWidth={2.5}
                            />
                            <span className="text-[12px] font-bold text-foreground">
                                Skill Alignment
                            </span>
                        </div>
                        <span
                            className="text-[13px] font-black tabular-nums"
                            style={{ color: meta.accent }}
                        >
                            {ownedCount}/{totalKey}
                        </span>
                    </div>
                    <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: `${alignmentPct}%`,
                                background: `linear-gradient(90deg, ${meta.gradient.from}, ${meta.gradient.to})`,
                            }}
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                        {ownedCount === 0
                            ? "Start building these skills to align with this track."
                            : ownedCount === totalKey
                                ? "Excellent — you already cover the core skill set."
                                : `You already cover ${ownedCount} of the ${totalKey} core skills.`}
                    </p>
                </div>

                {/* Key skills checklist */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground/50" strokeWidth={2.5} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Core Skills
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {skillsWithStatus.map((s) => (
                            <span
                                key={s.name}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${s.owned
                                    ? `${meta.softBg} ${meta.softText} ${meta.softBorder}`
                                    : "bg-muted text-muted-foreground border-border"
                                    }`}
                                title={s.owned ? "You have this skill" : "Skill to develop"}
                            >
                                {s.owned ? (
                                    <CheckCircle2
                                        className="h-3 w-3"
                                        style={{ color: meta.accent }}
                                        strokeWidth={2.5}
                                    />
                                ) : (
                                    <Circle
                                        className="h-3 w-3 text-muted-foreground/50"
                                        strokeWidth={2.5}
                                    />
                                )}
                                {s.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Common roles */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground/50" strokeWidth={2.5} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Common Job Titles
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {meta.roles.map((role) => (
                            <span
                                key={role}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-card border border-border text-foreground shadow-sm"
                            >
                                {role}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Salary hint */}
                <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2.5} />
                    <span className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{meta.salaryHint}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
