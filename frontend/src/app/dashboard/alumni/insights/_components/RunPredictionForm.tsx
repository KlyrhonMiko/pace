"use client";

import { useState } from "react";
import {
    X,
    ChevronRight,
    ChevronLeft,
    Loader2,
    GraduationCap,
    BarChart3,
    Brain,
    CheckCircle2,
} from "lucide-react";
import {
    runPrediction,
    EmployabilityInputPayload,
    EmployabilityResult,
    Degree,
} from "../../_lib/api";

// ── Constants ─────────────────────────────────────────────────

const DEGREES: { value: Degree; label: string }[] = [
    { value: "BSIT", label: "BS Information Technology" },
    { value: "BSCS", label: "BS Computer Science" },
    { value: "BSA", label: "BS Accountancy" },
    { value: "BSBA-Entrepreneurship", label: "BSBA - Entrepreneurship" },
    { value: "BSBA-Marketing", label: "BSBA - Marketing" },
    { value: "BSEd-Filipino", label: "BSEd - Filipino" },
    { value: "BSEd-English", label: "BSEd - English" },
];

const DEGREE_SKILLS: Record<string, { key: keyof EmployabilityInputPayload; label: string }[]> = {
    BSIT: techSkills(),
    BSCS: techSkills(),
    BSA: businessSkills(),
    "BSBA-Entrepreneurship": businessSkills(),
    "BSBA-Marketing": businessSkills(),
    "BSEd-Filipino": educationSkills(),
    "BSEd-English": educationSkills(),
};

function techSkills() {
    return [
        { key: "python_programming_skills" as const, label: "Python Programming" },
        { key: "java_programming_skills" as const, label: "Java Programming" },
        { key: "database_management_skills" as const, label: "Database Management" },
        { key: "web_development_skills" as const, label: "Web Development" },
        { key: "networking_skills" as const, label: "Networking" },
        { key: "cloud_computing_skills" as const, label: "Cloud Computing" },
        { key: "software_engineering_skills" as const, label: "Software Engineering" },
        { key: "data_structures_algorithms" as const, label: "Data Structures & Algorithms" },
        { key: "machine_learning_skills" as const, label: "Machine Learning" },
        { key: "system_design_skills" as const, label: "System Design" },
        { key: "cybersecurity_skills" as const, label: "Cybersecurity" },
        { key: "artificial_intelligence_skills" as const, label: "Artificial Intelligence" },
        { key: "programming_logic_skills" as const, label: "Programming Logic" },
    ];
}

function businessSkills() {
    return [
        { key: "financial_accounting_skills" as const, label: "Financial Accounting" },
        { key: "budgeting_analysis_skills" as const, label: "Budgeting & Analysis" },
        { key: "marketing_skills" as const, label: "Marketing" },
        { key: "auditing_skills" as const, label: "Auditing" },
        { key: "financial_management_skills" as const, label: "Financial Management" },
        { key: "taxation_skills" as const, label: "Taxation" },
        { key: "strategic_planning_skills" as const, label: "Strategic Planning" },
        { key: "risk_management_skills" as const, label: "Risk Management" },
        { key: "innovation_business_planning_skills" as const, label: "Innovation & Business Planning" },
        { key: "consumer_behavior_analysis" as const, label: "Consumer Behavior Analysis" },
        { key: "sales_management_skills" as const, label: "Sales Management" },
        { key: "leadership_decision_making_skills" as const, label: "Leadership & Decision-Making" },
    ];
}

function educationSkills() {
    return [
        { key: "teaching_skills" as const, label: "Teaching" },
        { key: "classroom_management_skills" as const, label: "Classroom Management" },
        { key: "curriculum_development_skills" as const, label: "Curriculum Development" },
        { key: "educational_technology_skills" as const, label: "Educational Technology" },
        { key: "english_communication_writing_skills" as const, label: "English Communication & Writing" },
        { key: "filipino_communication_writing_skills" as const, label: "Filipino Communication & Writing" },
    ];
}

// ── Sub-components ─────────────────────────────────────────────

function SliderField({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    hint,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    hint?: string;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    const color =
        pct >= 75
            ? "#059669"
            : pct >= 50
            ? "#f59e0b"
            : "#ef4444";

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <span
                    className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-md"
                    style={{ color, background: `${color}18` }}
                >
                    {value}
                </span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
                    }}
                />
            </div>
            {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        i < current
                            ? "bg-emerald-500 w-6"
                            : i === current
                            ? "bg-emerald-400 w-8"
                            : "bg-gray-200 w-4"
                    }`}
                />
            ))}
        </div>
    );
}

// ── Default form values ────────────────────────────────────────

function defaultPayload(): EmployabilityInputPayload {
    return {
        cgpa: 2.0,
        average_prof_grade: 80,
        average_elec_grade: 80,
        ojt_grade: 80,
        leadership_pos: "No",
        act_member_pos: "No",
        soft_skills_ave: 70,
        hard_skills_ave: 70,
        degree: "BSIT",
        year_graduated: new Date().getFullYear(),
        // tech
        python_programming_skills: 0,
        java_programming_skills: 0,
        database_management_skills: 0,
        web_development_skills: 0,
        networking_skills: 0,
        cloud_computing_skills: 0,
        software_engineering_skills: 0,
        data_structures_algorithms: 0,
        machine_learning_skills: 0,
        system_design_skills: 0,
        cybersecurity_skills: 0,
        artificial_intelligence_skills: 0,
        programming_logic_skills: 0,
        // business
        financial_accounting_skills: 0,
        budgeting_analysis_skills: 0,
        marketing_skills: 0,
        auditing_skills: 0,
        financial_management_skills: 0,
        taxation_skills: 0,
        strategic_planning_skills: 0,
        risk_management_skills: 0,
        innovation_business_planning_skills: 0,
        consumer_behavior_analysis: 0,
        sales_management_skills: 0,
        leadership_decision_making_skills: 0,
        // education
        teaching_skills: 0,
        classroom_management_skills: 0,
        curriculum_development_skills: 0,
        educational_technology_skills: 0,
        english_communication_writing_skills: 0,
        filipino_communication_writing_skills: 0,
    };
}

// ── Main Component ─────────────────────────────────────────────

interface RunPredictionFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (result: EmployabilityResult) => void;
}

const STEP_LABELS = [
    { icon: GraduationCap, label: "Academic Info" },
    { icon: BarChart3, label: "Skills" },
    { icon: Brain, label: "Confirm & Run" },
];

export default function RunPredictionForm({
    open,
    onClose,
    onSuccess,
}: RunPredictionFormProps) {
    const [step, setStep] = useState(0);
    const [payload, setPayload] = useState<EmployabilityInputPayload>(defaultPayload);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = <K extends keyof EmployabilityInputPayload>(
        key: K,
        value: EmployabilityInputPayload[K]
    ) => setPayload((p) => ({ ...p, [key]: value }));

    const degreeSkills = DEGREE_SKILLS[payload.degree] ?? [];

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await runPrediction(payload);
            if (result) {
                onSuccess(result);
                onClose();
                setStep(0);
                setPayload(defaultPayload());
            } else {
                throw new Error("Failed to generate prediction.");
            }
        } catch (e: unknown) {
            const error = e as any;
            setError(error?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            Run Employability Prediction
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Step {step + 1} of {STEP_LABELS.length} —{" "}
                            {STEP_LABELS[step].label}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" strokeWidth={2} />
                    </button>
                </div>

                {/* Step progress */}
                <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-4">
                    <StepIndicator current={step} total={STEP_LABELS.length} />
                    <div className="flex items-center gap-3 ml-auto">
                        {STEP_LABELS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                        i === step
                                            ? "text-emerald-600"
                                            : i < step
                                            ? "text-gray-400"
                                            : "text-gray-300"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                                    <span className="hidden sm:inline">{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {/* ── Step 0: Academic Info ── */}
                    {step === 0 && (
                        <div className="space-y-6">
                            {/* Degree */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Degree Program <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {DEGREES.map((d) => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => set("degree", d.value)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
                                                payload.degree === d.value
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span
                                                className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                                    payload.degree === d.value
                                                        ? "bg-emerald-500"
                                                        : "bg-gray-300"
                                                }`}
                                            />
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Year Graduated */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Year Graduated <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1950}
                                    max={new Date().getFullYear()}
                                    value={payload.year_graduated}
                                    onChange={(e) =>
                                        set("year_graduated", Number(e.target.value))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                                />
                            </div>

                            {/* CGPA */}
                            <SliderField
                                label="CGPA (1.0 = Best, 5.0 = Lowest)"
                                value={payload.cgpa}
                                onChange={(v) => set("cgpa", v)}
                                min={1.0}
                                max={5.0}
                                step={0.1}
                                hint="Inverted scale: 1.0 is the highest academic standing"
                            />

                            {/* Grades */}
                            <div className="space-y-4">
                                <p className="text-sm font-semibold text-gray-700">
                                    Grade Averages
                                </p>
                                <SliderField
                                    label="Average Professional Subject Grade"
                                    value={payload.average_prof_grade}
                                    onChange={(v) => set("average_prof_grade", v)}
                                    hint="0–100 scale"
                                />
                                <SliderField
                                    label="Average Elective Grade"
                                    value={payload.average_elec_grade}
                                    onChange={(v) => set("average_elec_grade", v)}
                                    hint="0–100 scale"
                                />
                                <SliderField
                                    label="OJT / Internship Grade"
                                    value={payload.ojt_grade}
                                    onChange={(v) => set("ojt_grade", v)}
                                    hint="0–100 scale"
                                />
                            </div>

                            {/* Leadership & Org */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">
                                    Involvement
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Leadership */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500">
                                            Leadership Role
                                        </label>
                                        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                                            {(["Yes", "No"] as const).map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => set("leadership_pos", v)}
                                                    className={`flex-1 py-2 text-sm font-medium transition-all duration-150 ${
                                                        payload.leadership_pos === v
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Active Member */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500">
                                            Active Org Member
                                        </label>
                                        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                                            {(["Yes", "No"] as const).map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => set("act_member_pos", v)}
                                                    className={`flex-1 py-2 text-sm font-medium transition-all duration-150 ${
                                                        payload.act_member_pos === v
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Soft / Hard Skills */}
                            <div className="space-y-4">
                                <p className="text-sm font-semibold text-gray-700">
                                    General Skills
                                </p>
                                <SliderField
                                    label="Soft Skills Average"
                                    value={payload.soft_skills_ave}
                                    onChange={(v) => set("soft_skills_ave", v)}
                                    hint="Communication, teamwork, adaptability, etc."
                                />
                                <SliderField
                                    label="Hard Skills Average"
                                    value={payload.hard_skills_ave}
                                    onChange={(v) => set("hard_skills_ave", v)}
                                    hint="Technical and domain-specific skills"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Skills ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                <p className="text-xs text-gray-500">
                                    Rate your proficiency in each area for{" "}
                                    <span className="font-semibold text-gray-700">
                                        {DEGREES.find((d) => d.value === payload.degree)?.label}
                                    </span>
                                    . Scores are on a 0–100 scale.
                                </p>
                            </div>

                            {degreeSkills.map((skill) => (
                                <SliderField
                                    key={skill.key}
                                    label={skill.label}
                                    value={(payload[skill.key] as number) ?? 0}
                                    onChange={(v) => set(skill.key, v)}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Step 2: Review & Submit ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-300/30">
                                        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            Ready to Predict
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Review your inputs below before submitting
                                        </p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="space-y-2">
                                    {[
                                        {
                                            label: "Degree",
                                            value: DEGREES.find((d) => d.value === payload.degree)?.label,
                                        },
                                        { label: "Year Graduated", value: payload.year_graduated },
                                        { label: "CGPA", value: payload.cgpa.toFixed(1) },
                                        { label: "Prof. Grade Avg", value: `${payload.average_prof_grade}%` },
                                        { label: "Elective Grade Avg", value: `${payload.average_elec_grade}%` },
                                        { label: "OJT Grade", value: `${payload.ojt_grade}%` },
                                        { label: "Leadership Role", value: payload.leadership_pos },
                                        { label: "Active Org Member", value: payload.act_member_pos },
                                        { label: "Soft Skills Avg", value: `${payload.soft_skills_ave}%` },
                                        { label: "Hard Skills Avg", value: `${payload.hard_skills_ave}%` },
                                    ].map((row) => (
                                        <div
                                            key={row.label}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-gray-500">{row.label}</span>
                                            <span className="font-semibold text-gray-800">
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skill summary chips */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                                    Skill Snapshot
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {degreeSkills.map((skill) => {
                                        const val = (payload[skill.key] as number) ?? 0;
                                        const color =
                                            val >= 75
                                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                : val >= 50
                                                ? "bg-amber-50 text-amber-700 ring-amber-200"
                                                : "bg-red-50 text-red-600 ring-red-200";
                                        return (
                                            <span
                                                key={skill.key}
                                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ${color}`}
                                            >
                                                {skill.label}
                                                <span className="font-bold">{val}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                                    <p className="text-sm text-red-600 font-medium">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                            Back
                        </button>
                    )}

                    <div className="flex-1" />

                    {step < STEP_LABELS.length - 1 ? (
                        <button
                            onClick={() => setStep((s) => s + 1)}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Continue
                            <ChevronRight className="h-4 w-4" strokeWidth={2} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                    Running Analysis...
                                </>
                            ) : (
                                <>
                                    <Brain className="h-4 w-4" strokeWidth={2} />
                                    Run Prediction
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
