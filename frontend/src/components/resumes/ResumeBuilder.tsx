"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Upload,
    Download,
    Plus,
    Trash2,
    FileText,
    Loader2,
    Save,
    User,
    Briefcase,
    GraduationCap,
    Sparkles,
    Lightbulb,
    Eye,
} from "lucide-react";
import { toast } from "sonner";
import { generateAtsDocxPdf } from "./generateAtsPdf";
import { AtsResumeTemplate, ResumeData, emptyResumeData } from "./AtsResumeTemplate";
import { getMyProfile, saveResume, getSavedResume } from "@/app/dashboard/alumni/profile/_lib/api";

// ─── Small building blocks ───────────────────────────────────────────────────

function SectionCard({
    title,
    subtitle,
    icon,
    iconClass,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    iconClass?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shrink-0 ${iconClass ?? "bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
                            }`}
                    >
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-gray-900 truncate">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            <div className="px-6 py-6">{children}</div>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {children}
        </label>
    );
}

const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 px-3.5 py-2.5 transition-all duration-150 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    className = "",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <FieldLabel>{label}</FieldLabel>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={inputBase}
            />
        </div>
    );
}

function AddButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-semibold border border-gray-200 transition-colors shrink-0 shadow-sm"
        >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            {label}
        </button>
    );
}

function ItemCard({
    index,
    label,
    onRemove,
    children,
}: {
    index: number;
    label: string;
    onRemove: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="group relative rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/70 to-white p-5 transition-all hover:border-emerald-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    {label} #{index + 1}
                </span>
                <button
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                    aria-label={`Remove ${label}`}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only sm:not-sr-only">Remove</span>
                </button>
            </div>
            {children}
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 mb-3 shadow-sm">
                {icon}
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
            <p className="text-xs text-gray-500 mb-4 max-w-xs">{description}</p>
            <button
                onClick={onAction}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors"
            >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                {actionLabel}
            </button>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ResumeBuilder() {
    const [data, setData] = useState<ResumeData>(emptyResumeData);
    const [isParsing, setIsParsing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadProfileAndResume() {
            try {
                const savedResume = await getSavedResume();
                if (savedResume) {
                    setData(savedResume);
                    setIsLoadingProfile(false);
                    return;
                }

                const profile = await getMyProfile();
                if (profile) {
                    let startYear = "";
                    const idsToTry = [profile.student_id, profile.alumni_id].filter(Boolean);

                    for (const id of idsToTry) {
                        const strId = String(id).trim();
                        const match = strId.match(/^(\d{2})/);
                        if (match) {
                            startYear = `20${match[1]}`;
                            break;
                        }
                    }

                    const defaultEdu = {
                        institution: "Pamantasan ng Lungsod ng Pasig",
                        degree: "Bachelor's Degree",
                        field: profile.course_name || "",
                        startDate: startYear,
                        endDate: profile.year_graduated?.toString() || "",
                    };

                    setData((prev) => ({
                        ...prev,
                        personal: {
                            ...prev.personal,
                            firstName: profile.first_name || "",
                            lastName: profile.last_name || "",
                            email: profile.email || "",
                        },
                        education: [defaultEdu],
                    }));
                }
            } catch (error) {
                console.error("Failed to load profile for resume:", error);
            } finally {
                setIsLoadingProfile(false);
            }
        }
        loadProfileAndResume();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Saving resume...");
        try {
            const success = await saveResume(data);
            if (success) {
                toast.success("Resume saved successfully!", { id: toastId });
            } else {
                toast.error("Failed to save resume.", { id: toastId });
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("An error occurred while saving.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPdf = () => {
        setIsGeneratingPdf(true);
        const toastId = toast.loading("Generating PDF...");

        try {
            generateAtsDocxPdf(data);
            toast.success("Resume downloaded successfully!", { id: toastId });
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF.", { id: toastId });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const toastId = toast.loading("Parsing resume...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to parse resume");
            }

            const parsed: Partial<ResumeData> = await res.json();

            setData((prev) => {
                const newPersonal = { ...prev.personal, ...(parsed.personal || {}) };
                return {
                    ...prev,
                    personal: {
                        firstName: newPersonal.firstName || "",
                        lastName: newPersonal.lastName || "",
                        email: newPersonal.email || "",
                        phone: newPersonal.phone || "",
                        location: newPersonal.location || "",
                        summary: newPersonal.summary || "",
                    },
                    education: parsed.education?.length ? parsed.education : prev.education,
                    experience: parsed.experience?.length ? parsed.experience : prev.experience,
                    skills: parsed.skills?.length
                        ? typeof parsed.skills[0] === "string"
                            ? (parsed.skills as unknown as string[]).map((s) => ({ name: s, notes: "" }))
                            : parsed.skills
                        : prev.skills,
                };
            });

            toast.success("Resume parsed successfully!", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Failed to parse resume", { id: toastId });
            console.error(error);
        } finally {
            setIsParsing(false);
            if (e.target) e.target.value = "";
        }
    };

    const handlePersonalChange = (field: keyof ResumeData["personal"], value: string) => {
        setData((prev) => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
    };

    const handleArrayAdd = (field: "education" | "experience" | "skills") => {
        setData((prev) => ({
            ...prev,
            [field]: [
                ...prev[field],
                field === "education"
                    ? { institution: "", degree: "", field: "", startDate: "", endDate: "" }
                    : field === "experience"
                        ? { company: "", position: "", title: "", startDate: "", endDate: "", description: "" }
                        : { name: "", notes: "" },
            ] as any,
        }));
    };

    const handleArrayUpdate = (
        field: "education" | "experience" | "skills",
        index: number,
        itemField: string,
        value: string,
    ) => {
        setData((prev) => {
            const newArray = [...prev[field]];
            newArray[index] = { ...newArray[index], [itemField]: value };
            return { ...prev, [field]: newArray as any };
        });
    };

    const handleArrayRemove = (field: "education" | "experience" | "skills", index: number) => {
        setData((prev) => {
            const newArray = [...prev[field]];
            newArray.splice(index, 1);
            return { ...prev, [field]: newArray as any };
        });
    };

    const summaryLen = data.personal.summary?.length ?? 0;

    return (
        <div className="space-y-6 pb-8">
            {/* ── Workspace hero / action bar ── */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 pointer-events-none"
                    aria-hidden
                />
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, rgb(15 118 110) 1px, transparent 0)",
                        backgroundSize: "22px 22px",
                    }}
                    aria-hidden
                />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 shrink-0">
                            <FileText className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-gray-900">Resume Workspace</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Build an ATS-friendly resume from scratch, or parse an existing PDF to auto-fill.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <label
                            className={`relative cursor-pointer inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 border shadow-sm ${isParsing
                                ? "bg-emerald-50 text-emerald-400 border-emerald-100 cursor-wait"
                                : "bg-white hover:bg-emerald-50 text-emerald-700 border-gray-200"
                                }`}
                        >
                            {isParsing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                            )}
                            <span>{isParsing ? "Parsing..." : "Parse ATS Resume"}</span>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                onChange={handleFileUpload}
                                disabled={isParsing}
                            />
                        </label>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" strokeWidth={2.5} />
                            )}
                            <span>{isSaving ? "Saving..." : "Save Progress"}</span>
                        </button>

                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-md shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {isGeneratingPdf ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" strokeWidth={2.5} />
                            )}
                            <span>{isGeneratingPdf ? "Generating..." : "Download PDF"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main grid: Form (7) + Preview (5) ── */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* ── Form column ── */}
                <div className="lg:col-span-7 flex flex-col gap-6 relative">
                    {isLoadingProfile && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                <p className="text-sm font-medium text-gray-600">Fetching your profile...</p>
                            </div>
                        </div>
                    )}

                    {/* ── Personal Details ── */}
                    <SectionCard
                        title="Personal Details"
                        subtitle="How recruiters will identify and reach you."
                        icon={<User className="w-5 h-5" strokeWidth={1.75} />}
                        iconClass="bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextField
                                label="First Name"
                                value={data.personal.firstName}
                                onChange={(v) => handlePersonalChange("firstName", v)}
                                placeholder="Juan"
                            />
                            <TextField
                                label="Last Name"
                                value={data.personal.lastName}
                                onChange={(v) => handlePersonalChange("lastName", v)}
                                placeholder="Dela Cruz"
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={data.personal.email}
                                onChange={(v) => handlePersonalChange("email", v)}
                                placeholder="your@email.com"
                            />
                            <TextField
                                label="Phone"
                                value={data.personal.phone}
                                onChange={(v) => handlePersonalChange("phone", v)}
                                placeholder="+63 900 000 0000"
                            />
                            <TextField
                                label="Location / Address"
                                value={data.personal.location}
                                onChange={(v) => handlePersonalChange("location", v)}
                                placeholder="Pasig City, Philippines"
                                className="sm:col-span-2"
                            />
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <FieldLabel>Professional Summary</FieldLabel>
                                    <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                                        {summaryLen} chars
                                    </span>
                                </div>
                                <textarea
                                    value={data.personal.summary}
                                    onChange={(e) => handlePersonalChange("summary", e.target.value)}
                                    placeholder="2-3 sentences about your strengths, focus areas, and what you're looking for..."
                                    className={`${inputBase} min-h-[120px] resize-none leading-relaxed`}
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Experience ── */}
                    <SectionCard
                        title="Experience"
                        subtitle="Jobs, internships, and freelance work."
                        icon={<Briefcase className="w-5 h-5" strokeWidth={1.75} />}
                        iconClass="bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
                        action={<AddButton label="Add Experience" onClick={() => handleArrayAdd("experience")} />}
                    >
                        {data.experience.length === 0 ? (
                            <EmptyState
                                icon={<Briefcase className="w-6 h-6" strokeWidth={1.5} />}
                                title="No experience added yet"
                                description="Showcase your roles, impact, and results to stand out to recruiters."
                                actionLabel="Add your first role"
                                onAction={() => handleArrayAdd("experience")}
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                                {data.experience.map((exp, index) => (
                                    <ItemCard
                                        key={index}
                                        index={index}
                                        label="Role"
                                        onRemove={() => handleArrayRemove("experience", index)}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <TextField
                                                label="Company"
                                                value={exp.company || ""}
                                                onChange={(v) => handleArrayUpdate("experience", index, "company", v)}
                                                placeholder="Acme Corp"
                                            />
                                            <TextField
                                                label="Position / Title"
                                                value={exp.position || exp.title || ""}
                                                onChange={(v) => handleArrayUpdate("experience", index, "position", v)}
                                                placeholder="Software Engineer"
                                            />
                                            <TextField
                                                label="Start Date"
                                                value={exp.startDate || ""}
                                                onChange={(v) => handleArrayUpdate("experience", index, "startDate", v)}
                                                placeholder="Jan 2023"
                                            />
                                            <TextField
                                                label="End Date"
                                                value={exp.endDate || ""}
                                                onChange={(v) => handleArrayUpdate("experience", index, "endDate", v)}
                                                placeholder="Present"
                                            />
                                            <div className="sm:col-span-2 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <FieldLabel>Key Responsibilities & Achievements</FieldLabel>
                                                    <button
                                                        onClick={() => {
                                                            const current = exp.description || "";
                                                            const lines = current.split("\n").filter(l => l.trim() !== "");
                                                            handleArrayUpdate("experience", index, "description", [...lines, ""].join("\n"));
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider hover:text-emerald-800 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" strokeWidth={3} />
                                                        Add Bullet Point
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {(exp.description || "").split("\n").map((line, lineIdx, allLines) => (
                                                        <div key={lineIdx} className="flex gap-2">
                                                            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                            <textarea
                                                                rows={1}
                                                                value={line}
                                                                onChange={(e) => {
                                                                    const newLines = [...allLines];
                                                                    newLines[lineIdx] = e.target.value;
                                                                    handleArrayUpdate("experience", index, "description", newLines.join("\n"));
                                                                }}
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        el.style.height = "auto";
                                                                        el.style.height = el.scrollHeight + "px";
                                                                    }
                                                                }}
                                                                placeholder="e.g. Led a team of 5 to deliver X project ahead of schedule"
                                                                className={`${inputBase} resize-none min-h-[40px] overflow-hidden leading-relaxed`}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        const newLines = [...allLines];
                                                                        newLines.splice(lineIdx + 1, 0, "");
                                                                        handleArrayUpdate("experience", index, "description", newLines.join("\n"));
                                                                    }
                                                                    if (e.key === "Backspace" && line === "" && allLines.length > 1) {
                                                                        e.preventDefault();
                                                                        const newLines = [...allLines];
                                                                        newLines.splice(lineIdx, 1);
                                                                        handleArrayUpdate("experience", index, "description", newLines.join("\n"));
                                                                    }
                                                                }}
                                                                autoFocus={lineIdx === allLines.length - 1 && line === ""}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newLines = [...allLines];
                                                                    newLines.splice(lineIdx, 1);
                                                                    handleArrayUpdate("experience", index, "description", newLines.join("\n") || "");
                                                                }}
                                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0 self-start"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {(!exp.description || exp.description.trim() === "") && (
                                                    <p className="text-[10px] text-gray-400 italic mt-1">
                                                        Professional resumes use bullet points to highlight impact and results.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </ItemCard>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Education ── */}
                    <SectionCard
                        title="Education"
                        subtitle="Degrees, schools, and academic programs."
                        icon={<GraduationCap className="w-5 h-5" strokeWidth={1.75} />}
                        iconClass="bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/20"
                        action={<AddButton label="Add Education" onClick={() => handleArrayAdd("education")} />}
                    >
                        {data.education.length === 0 ? (
                            <EmptyState
                                icon={<GraduationCap className="w-6 h-6" strokeWidth={1.5} />}
                                title="No education added yet"
                                description="Add your degrees and academic programs to complete your profile."
                                actionLabel="Add education"
                                onAction={() => handleArrayAdd("education")}
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                                {data.education.map((edu, index) => (
                                    <ItemCard
                                        key={index}
                                        index={index}
                                        label="Education"
                                        onRemove={() => handleArrayRemove("education", index)}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <TextField
                                                label="Institution"
                                                value={edu.institution || ""}
                                                onChange={(v) =>
                                                    handleArrayUpdate("education", index, "institution", v)
                                                }
                                                placeholder="Pamantasan ng Lungsod ng Pasig"
                                                className="sm:col-span-2"
                                            />
                                            <TextField
                                                label="Degree"
                                                value={edu.degree || ""}
                                                onChange={(v) => handleArrayUpdate("education", index, "degree", v)}
                                                placeholder="Bachelor's Degree"
                                            />
                                            <TextField
                                                label="Field of Study"
                                                value={edu.field || ""}
                                                onChange={(v) => handleArrayUpdate("education", index, "field", v)}
                                                placeholder="Computer Science"
                                            />
                                            <TextField
                                                label="Start Date"
                                                value={edu.startDate || ""}
                                                onChange={(v) => handleArrayUpdate("education", index, "startDate", v)}
                                                placeholder="2019"
                                            />
                                            <TextField
                                                label="End Date"
                                                value={edu.endDate || ""}
                                                onChange={(v) => handleArrayUpdate("education", index, "endDate", v)}
                                                placeholder="2023"
                                            />
                                        </div>
                                    </ItemCard>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Skills ── */}
                    <SectionCard
                        title="Skills"
                        subtitle="Tools, languages, and domains you know well."
                        icon={<Lightbulb className="w-5 h-5" strokeWidth={1.75} />}
                        iconClass="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
                        action={<AddButton label="Add Skill" onClick={() => handleArrayAdd("skills")} />}
                    >
                        {data.skills.length === 0 ? (
                            <EmptyState
                                icon={<Lightbulb className="w-6 h-6" strokeWidth={1.5} />}
                                title="No skills added yet"
                                description="List the tools, languages, and frameworks you're most confident with."
                                actionLabel="Add a skill"
                                onAction={() => handleArrayAdd("skills")}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.skills.map((skill, index) => (
                                    <ItemCard
                                        key={index}
                                        index={index}
                                        label="Skill"
                                        onRemove={() => handleArrayRemove("skills", index)}
                                    >
                                        <div className="flex flex-col gap-3">
                                            <TextField
                                                label="Skill Name"
                                                value={skill.name}
                                                onChange={(v) => handleArrayUpdate("skills", index, "name", v)}
                                                placeholder="e.g. React"
                                            />
                                            <div className="flex flex-col gap-1.5">
                                                <FieldLabel>Notes & Expertise</FieldLabel>
                                                <textarea
                                                    value={skill.notes}
                                                    onChange={(e) =>
                                                        handleArrayUpdate("skills", index, "notes", e.target.value)
                                                    }
                                                    placeholder="Years of experience, key projects, or proficiency level..."
                                                    className={`${inputBase} min-h-[80px] resize-none leading-relaxed`}
                                                />
                                            </div>
                                        </div>
                                    </ItemCard>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

                {/* ── Preview column ── */}
                <div className="lg:col-span-5">
                    <div className="lg:sticky lg:top-6">
                        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-100 via-emerald-50/40 to-slate-100 shadow-sm">
                            {/* Decorative dot mesh */}
                            <div
                                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                                style={{
                                    backgroundImage:
                                        "radial-gradient(circle at 1px 1px, rgb(15 23 42) 1px, transparent 0)",
                                    backgroundSize: "18px 18px",
                                }}
                                aria-hidden
                            />

                            {/* Preview header */}
                            <div className="relative flex items-center justify-between px-5 py-3 border-b border-gray-200/70 bg-white/80 backdrop-blur-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                                    <Eye className="w-3 h-3" strokeWidth={2} />
                                    <span>ATS · Letter</span>
                                </div>
                            </div>

                            {/* Preview body */}
                            <div className="relative p-4 flex items-start justify-center">
                                <div className="h-[317px] sm:h-[423px] md:h-[528px] lg:h-[581px] xl:h-[687px] 2xl:h-[845px] w-full flex justify-center overflow-hidden">
                                    <div className="scale-[0.3] sm:scale-[0.4] md:scale-[0.5] lg:scale-[0.55] xl:scale-[0.65] 2xl:scale-[0.8] transform-gpu origin-top transition-transform h-fit drop-shadow-xl">
                                        <AtsResumeTemplate data={data} printRef={componentRef} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Helpful tip */}
                        <div className="mt-4 flex items-start gap-2.5 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-4 py-3">
                            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" strokeWidth={2} />
                            <p className="leading-relaxed">
                                <span className="font-semibold">Tip:</span> Use action verbs and quantify impact
                                (e.g. &ldquo;Reduced load time by 40%&rdquo;) to make your resume stand out.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
