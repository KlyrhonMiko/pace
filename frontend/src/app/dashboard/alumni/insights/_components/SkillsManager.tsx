"use client";

import { Pencil, Check, X, Loader2, Brain, Award, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useAlumniSkills } from "../_hooks/useAlumniSkills";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getScoreColor(pct: number) {
    if (pct >= 75) return { bar: "#059669", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
    if (pct >= 50) return { bar: "#f59e0b", text: "text-amber-600", badge: "bg-amber-50 text-amber-700 ring-amber-200" };
    return { bar: "#ef4444", text: "text-red-600", badge: "bg-red-50 text-red-600 ring-red-200" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkillSlider({
    label,
    value,
    onChange,
    disabled = false,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    const pct = value;
    const colors = getScoreColor(pct);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span
                    className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-md"
                    style={{ color: colors.bar, background: `${colors.bar}18` }}
                >
                    {value}
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                    background: `linear-gradient(to right, ${colors.bar} 0%, ${colors.bar} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
                }}
            />
        </div>
    );
}

function SkillChip({ label, value }: { label: string; value: number }) {
    const colors = getScoreColor(value);
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ${colors.badge}`}
        >
            {label}
            <span className="font-bold">{value}</span>
        </span>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface SkillsManagerProps {
    alumniId: string;
    course: string;
}

export default function SkillsManager({ alumniId, course }: SkillsManagerProps) {
    const {
        skills,
        hasRecord,
        isLoading,
        programSkills,
        isEditing,
        isSaving,
        draft,
        startEditing,
        cancelEditing,
        setSoftSkillsAve,
        setHardSkillsAve,
        setSkillScore,
        handleSave,
    } = useAlumniSkills(alumniId, course);

    const [showAllSkills, setShowAllSkills] = useState(false);
    const visibleSkills = showAllSkills ? programSkills : programSkills.slice(0, 6);

    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/60">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <Brain className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">My Skills</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            These scores power your employability prediction
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {!isLoading && (
                        hasRecord ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                Skills on record ✓
                            </span>
                        ) : (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                No skills yet
                            </span>
                        )
                    )}

                    {/* Edit button */}
                    {!isEditing && !isLoading && (
                        <button
                            id="skills-manager-edit-btn"
                            onClick={startEditing}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-150"
                        >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                            {hasRecord ? "Edit" : "Add Skills"}
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Loading skills...</span>
                    </div>
                ) : isEditing ? (
                    /* ── Edit Mode ── */
                    <div className="space-y-6">
                        {/* General Skills */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                General Skills
                            </p>
                            <SkillSlider
                                label="Soft Skills Average"
                                value={draft.soft_skills_ave}
                                onChange={setSoftSkillsAve}
                                disabled={isSaving}
                            />
                            <SkillSlider
                                label="Hard Skills Average"
                                value={draft.hard_skills_ave}
                                onChange={setHardSkillsAve}
                                disabled={isSaving}
                            />
                        </div>

                        {/* Program Skills */}
                        {programSkills.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Program Skills — {course || "All Programs"}
                                </p>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4 space-y-4">
                                    {programSkills.map((skillName) => (
                                        <SkillSlider
                                            key={skillName}
                                            label={skillName}
                                            value={draft.program_skill_values[skillName] ?? 70}
                                            onChange={(v) => setSkillScore(skillName, v)}
                                            disabled={isSaving}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                            <button
                                id="skills-manager-cancel-btn"
                                onClick={cancelEditing}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <X className="h-4 w-4" strokeWidth={2} />
                                Cancel
                            </button>
                            <button
                                id="skills-manager-save-btn"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex flex-1 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                        Saving &amp; running prediction...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" strokeWidth={2.5} />
                                        Save &amp; Run Prediction
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : hasRecord && skills ? (
                    /* ── View Mode (has record) ── */
                    <div className="space-y-5">
                        {/* General skill progress bars */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Soft Skills", value: skills.soft_skills_ave ?? 0 },
                                { label: "Hard Skills", value: skills.hard_skills_ave ?? 0 },
                            ].map(({ label, value }) => {
                                const colors = getScoreColor(value);
                                return (
                                    <div key={label} className="space-y-1.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100/60">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-600">{label}</span>
                                            <span className="text-sm font-bold tabular-nums" style={{ color: colors.bar }}>
                                                {value}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${value}%`, background: colors.bar }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Program skills chip grid */}
                        {skills.program_skills && Object.keys(skills.program_skills).length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Program Skills
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {visibleSkills.map((skillName) => {
                                        const val = skills.program_skills?.[skillName] ?? 0;
                                        return <SkillChip key={skillName} label={skillName} value={val} />;
                                    })}
                                </div>
                                {programSkills.length > 6 && (
                                    <button
                                        onClick={() => setShowAllSkills((p) => !p)}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium mt-1 transition-colors"
                                    >
                                        {showAllSkills ? (
                                            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                                        ) : (
                                            <><ChevronDown className="w-3.5 h-3.5" /> Show {programSkills.length - 6} more</>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Last updated */}
                        {skills.updated_at && (
                            <p className="text-[11px] text-gray-400">
                                Last updated: {new Date(skills.updated_at).toLocaleDateString("en-PH", {
                                    year: "numeric", month: "short", day: "numeric",
                                })}
                            </p>
                        )}
                    </div>
                ) : (
                    /* ── No Record CTA ── */
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                            <Award className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Your skills haven&apos;t been recorded yet
                            </h3>
                            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                                Skill scores are required for your employability prediction.
                                Rate your proficiency honestly — this is your self-assessment.
                            </p>
                        </div>
                        <button
                            id="skills-manager-add-btn"
                            onClick={startEditing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 transition-all duration-200"
                        >
                            <Brain className="h-4 w-4" strokeWidth={2} />
                            Add My Skills
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
