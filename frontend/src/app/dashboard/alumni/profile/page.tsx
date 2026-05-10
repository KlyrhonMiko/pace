"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, Settings, Check, Pencil, ChevronRight, GraduationCap, CalendarDays, Lock, Clock, Info, Loader2, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/dashboard/PageHeader";
import { getMyProfile, AlumniProfile, updateMyProfile, updateMyAccount } from "./_lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SkillsInput } from "@/components/ui/skills-input";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountInfo {
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
}

interface PersonalInfo {
    lastname: string;
    firstname: string;
    middlename: string;
    gender: string;
    birthdate: string;
    age: number | string;
    skills: string[];
}

interface AcademicInfo {
    alumniId: string;
    studentId: string;
    yearGraduated: string;
    gwa: string;
    avgProfGrade: string;
    avgElecGrade: string;
    ojtGrade: string;
    leadershipPos: string;
    activeMemberPos: string;
    course: string;
}

interface EmploymentInfo {
    status: string;
    sector: string;
    salary: string | number;
    offers: string | number;
}



// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeAge(birthdate: string): number | string {
    if (!birthdate) return "—";
    const today = new Date();
    const dob = new Date(birthdate);
    if (isNaN(dob.getTime())) return "—";
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? age : "—";
}

function normalizeGender(gender: string | null | undefined): string {
    if (!gender) return "";
    return gender.trim().toUpperCase().replace("-", "_");
}

function formatGender(gender: string | null | undefined): string {
    if (!gender) return "";
    const mapping: Record<string, string> = {
        "MALE": "Male",
        "FEMALE": "Female",
        "NON_BINARY": "Non-binary",
        "PREFER_NOT_TO_SAY": "Prefer not to say"
    };
    const normalized = gender.trim().toUpperCase().replace("-", "_");
    return mapping[normalized] || gender;
}

// ─── Formatting Helpers ────────────────────────────────────────────────────────
function formatAlumniId(id: string): string {
    const digits = id.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    const firstTwo = digits.substring(0, 2);
    const rest = digits.substring(2, 7); // Handle up to 5 additional digits
    return `${firstTwo}-${rest}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
    title,
    subtitle,
    icon,
    children,
    editable = false,
    editing = false,
    onEdit,
    onSave,
    onCancel,
    skipable = false,
    onSkip,
    iconContainerClass = "",
    loading = false,
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    editable?: boolean;
    editing?: boolean;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    skipable?: boolean;
    onSkip?: () => void;
    iconContainerClass?: string;
    loading?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${iconContainerClass}`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {skipable && !editing && (
                        <button
                            onClick={onSkip}
                            className="text-xs text-gray-400 hover:text-gray-600 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                            Skip
                        </button>
                    )}
                    {editable && !editing && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-150"
                        >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-5">
                {children}

                {editing && (
                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full sm:w-auto order-2 sm:order-1 flex items-center justify-center h-[42px] px-6 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={loading}
                            className="w-full sm:flex-1 order-1 sm:order-2 flex items-center justify-center gap-2 h-[42px] px-6 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all duration-150 shadow-sm shadow-emerald-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    readOnly = false,
    editing = false,
    placeholder,
    required = false,
    options,
}: {
    label: string;
    value: string | number;
    onChange?: (v: string) => void;
    type?: string;
    readOnly?: boolean;
    editing?: boolean;
    placeholder?: string;
    required?: boolean;
    options?: string[];
}) {
    const isReadOnly = readOnly || !editing;

    const baseInput =
        "w-full h-[44px] rounded-md border text-sm px-3.5 transition-all duration-150 outline-none shadow-xs ";
    const readonlyClass =
        "bg-gray-50 border-gray-200 text-gray-500 cursor-default select-none";
    const editableClass =
        "bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            {options && !isReadOnly ? (
                <Select
                    value={value as string}
                    onValueChange={(v) => onChange?.(v)}
                >
                    <SelectTrigger className={cn(baseInput, editableClass)}>
                        <SelectValue placeholder={placeholder || `Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((o) => (
                            <SelectItem key={o} value={o}>
                                {o}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : type === "date" ? (
                <DatePicker
                    date={value as string}
                    onChange={(v) => onChange?.(v)}
                    disabled={isReadOnly}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={value as string}
                    onChange={(e) => onChange?.(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder={isReadOnly ? "—" : placeholder}
                    className={baseInput + (isReadOnly ? readonlyClass : editableClass)}
                />
            )}
        </div>
    );
}

function ReadOnlyField({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
                {label}
            </label>
            <div className="w-full h-[44px] rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 px-3.5 flex items-center shadow-xs">
                {value || <span className="text-gray-300 italic text-xs">Not provided</span>}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    // ── Account Info ──
    const [account, setAccount] = useState<AccountInfo>({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
    });
    const [accountDraft, setAccountDraft] = useState<AccountInfo>(account);
    const [editingAccount, setEditingAccount] = useState(false);

    // ── Personal Info ──
    const [personal, setPersonal] = useState<PersonalInfo>({
        lastname: "",
        firstname: "",
        middlename: "",
        gender: "",
        birthdate: "",
        age: "—",
        skills: [],
    });
    const [personalDraft, setPersonalDraft] = useState<PersonalInfo>(personal);
    const [editingPersonal, setEditingPersonal] = useState(false);

    // ── Employment Info ──
    const [employment, setEmployment] = useState<EmploymentInfo>({
        status: "Searching",
        sector: "",
        salary: 0,
        offers: 0,
    });
    const [employmentDraft, setEmploymentDraft] = useState<EmploymentInfo>(employment);
    const [editingEmployment, setEditingEmployment] = useState(false);

    // ── Academic Info ──
    const [academic, setAcademic] = useState<AcademicInfo>({
        alumniId: "",
        studentId: "",
        yearGraduated: "",
        gwa: "",
        avgProfGrade: "",
        avgElecGrade: "",
        ojtGrade: "",
        leadershipPos: "",
        activeMemberPos: "",
        course: "",
    });
    const [academicDraft, setAcademicDraft] = useState<AcademicInfo>(academic);
    const [editingAcademic, setEditingAcademic] = useState(false);


    const [isLoading, setIsLoading] = useState(true);
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [isSavingEmployment, setIsSavingEmployment] = useState(false);
    const [isSavingAcademic, setIsSavingAcademic] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const { updateUser } = useAuth();

    const [userId, setUserId] = useState<string | null>(null);
    const [alumniId, setAlumniId] = useState<string | null>(null);

    // ── Fetch Data ──
    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await getMyProfile();
                if (data) {
                    setUserId(data.user_id);
                    setAlumniId(data.alumni_id);

                    // Update AuthContext user state
                    updateUser({
                        first_name: data.first_name,
                        last_name: data.last_name,
                    });
                    setAccount({
                        username: data.username,
                        password: "",
                        confirmPassword: "",
                        email: data.email,
                    });
                    setAccountDraft({
                        username: data.username,
                        password: "",
                        confirmPassword: "",
                        email: data.email,
                    });
                    setPersonal({
                        lastname: data.last_name,
                        firstname: data.first_name,
                        middlename: data.middle_name || "",
                        gender: normalizeGender(data.gender),
                        birthdate: data.birthdate || "",
                        age: data.age,
                        skills: data.skills || [],
                    });
                    setPersonalDraft({
                        lastname: data.last_name,
                        firstname: data.first_name,
                        middlename: data.middle_name || "",
                        gender: normalizeGender(data.gender),
                        birthdate: data.birthdate || "",
                        age: data.age,
                        skills: data.skills || [],
                    });
                    setEmployment({
                        status: data.employment_status || "Searching",
                        sector: data.employment_sector || "",
                        salary: data.salary_package || 0,
                        offers: data.offers_received || 0,
                    });
                    setEmploymentDraft({
                        status: data.employment_status || "Searching",
                        sector: data.employment_sector || "",
                        salary: data.salary_package || 0,
                        offers: data.offers_received || 0,
                    });
                    setAcademic({
                        alumniId: data.alumni_id,
                        studentId: data.student_id || "—",
                        yearGraduated: data.year_graduated?.toString() || "—",
                        gwa: data.gwa?.toString() || "—",
                        avgProfGrade: data.avg_prof_grade?.toString() || "—",
                        avgElecGrade: data.avg_elec_grade?.toString() || "—",
                        ojtGrade: data.ojt_grade?.toString() || "—",
                        leadershipPos: data.leadership_pos ? "Yes" : "No",
                        activeMemberPos: data.act_member_pos ? "Yes" : "No",
                        course: data.course_name || "—",
                    });
                    setAcademicDraft({
                        alumniId: data.alumni_id,
                        studentId: data.student_id || "—",
                        yearGraduated: data.year_graduated?.toString() || "—",
                        gwa: data.gwa?.toString() || "—",
                        avgProfGrade: data.avg_prof_grade?.toString() || "—",
                        avgElecGrade: data.avg_elec_grade?.toString() || "—",
                        ojtGrade: data.ojt_grade?.toString() || "—",
                        leadershipPos: data.leadership_pos ? "Yes" : "No",
                        activeMemberPos: data.act_member_pos ? "Yes" : "No",
                        course: data.course_name || "—",
                    });
                } else {
                    setError("Could not load profile data.");
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                setError("An error occurred while loading your profile.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);



    // ── Age auto-compute ──
    useEffect(() => {
         
        setPersonalDraft((prev) => ({
            ...prev,
            age: computeAge(prev.birthdate),
        }));
    }, [personalDraft.birthdate]);

    // ── Handlers: Account ──
    const handleSaveAccount = useCallback(async () => {
        if (!userId) return;
        setIsSavingAccount(true);
        const success = await updateMyAccount(userId, { email: accountDraft.email });

        if (success) {
            setAccount(accountDraft);
            setEditingAccount(false);
            toast.success("Account information updated successfully");
        } else {
            toast.error("Failed to update account information");
        }
        setIsSavingAccount(false);
    }, [accountDraft, userId]);

    const handleCancelAccount = useCallback(() => {
        setAccountDraft(account);
        setEditingAccount(false);
    }, [account]);

    // ── Handlers: Personal ──
    const handleSavePersonal = useCallback(async () => {
        if (!alumniId) return;
        setIsSavingPersonal(true);

        const updateData = {
            last_name: personalDraft.lastname,
            first_name: personalDraft.firstname,
            middle_name: personalDraft.middlename,
            gender: personalDraft.gender,
            birthdate: personalDraft.birthdate,
            age: Number(computeAge(personalDraft.birthdate)) || 0,
            skills: personalDraft.skills,
        };

        const success = await updateMyProfile(alumniId, updateData as any);

        if (success) {
            setPersonal({
                ...personalDraft,
                age: computeAge(personalDraft.birthdate),
            });
            setEditingPersonal(false);
            toast.success("Personal information updated successfully");
        } else {
            toast.error("Failed to update personal information");
        }
        setIsSavingPersonal(false);
    }, [personalDraft, alumniId]);

    const handleCancelPersonal = useCallback(() => {
        setPersonalDraft(personal);
        setEditingPersonal(false);
    }, [personal]);

    // ── Handlers: Employment ──
    const handleSaveEmployment = useCallback(async () => {
        if (!alumniId) return;
        setIsSavingEmployment(true);

        const updateData = {
            employment_status: employmentDraft.status,
            employment_sector: employmentDraft.sector,
            salary_package: Number(employmentDraft.salary) || 0,
            offers_received: Number(employmentDraft.offers) || 0,
        };

        const success = await updateMyProfile(alumniId, updateData as any);

        if (success) {
            setEmployment(employmentDraft);
            setEditingEmployment(false);
            toast.success("Employment information updated successfully");
        } else {
            toast.error("Failed to update employment information");
        }
        setIsSavingEmployment(false);
    }, [employmentDraft, alumniId]);

    const handleCancelEmployment = useCallback(() => {
        setEmploymentDraft(employment);
        setEditingEmployment(false);
    }, [employment]);

    // ── Handlers: Academic ──
    const handleSaveAcademic = useCallback(async () => {
        if (!alumniId) return;
        setIsSavingAcademic(true);

        const updateData = {
            leadership_pos: academicDraft.leadershipPos === "Yes",
            act_member_pos: academicDraft.activeMemberPos === "Yes",
        };

        const success = await updateMyProfile(alumniId, updateData as any);

        if (success) {
            setAcademic(academicDraft);
            setEditingAcademic(false);
            toast.success("Academic information updated successfully");
        } else {
            toast.error("Failed to update academic information");
        }
        setIsSavingAcademic(true);
    }, [academicDraft, alumniId]);

    const handleCancelAcademic = useCallback(() => {
        setAcademicDraft(academic);
        setEditingAcademic(false);
    }, [academic]);


    // ── State: Initials ──
    const initials =
        `${personal.firstname?.[0] ?? ""}${personal.lastname?.[0] ?? ""}`.toUpperCase() || "—";



    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Page Header */}
                <PageHeader
                    title="My Profile"
                    description="View and manage your account information, personal details, and academic records."
                    currentPage="My Profile"
                />
                {/* Bento Grid Skeleton */}
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left Column */}
                    <div className="lg:col-span-7 flex flex-col gap-6 skeleton-stagger">

                        {/* Profile Hero Skeleton */}
                        <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 skeleton-shimmer" style={{
                            background: 'linear-gradient(135deg, hsl(160 50% 30%) 0%, hsl(160 40% 35%) 50%, hsl(170 40% 40%) 100%)'
                        }}>
                            <div className="relative flex items-center gap-6">
                                <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/20" />
                                <div className="flex-1 min-w-0 space-y-3">
                                    <Skeleton className="h-3 w-12 rounded bg-white/20" />
                                    <Skeleton className="h-6 w-48 rounded-md bg-white/20" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-28 rounded-full bg-white/15" />
                                        <Skeleton className="h-6 w-32 rounded-full bg-white/15" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Section Skeleton */}
                        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl skeleton-shimmer border-none" style={{
                                        background: 'linear-gradient(135deg, hsl(220 20% 30%) 0%, hsl(220 15% 20%) 100%)'
                                    }} />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-[14px] w-40 rounded-md" />
                                        <Skeleton className="h-[11px] w-32 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="space-y-1.5">
                                        <Skeleton className="h-[12px] w-20 rounded" />
                                        <Skeleton className="h-11 w-full rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Personal Section Skeleton */}
                        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl skeleton-shimmer border-none" style={{
                                        background: 'linear-gradient(135deg, hsl(160 40% 40%) 0%, hsl(170 40% 45%) 100%)'
                                    }} />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-[14px] w-44 rounded-md" />
                                        <Skeleton className="h-[11px] w-28 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="space-y-1.5">
                                        <Skeleton className="h-[12px] w-24 rounded" />
                                        <Skeleton className="h-11 w-full rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 flex flex-col gap-6 skeleton-stagger">
                        {/* Employment Section Skeleton */}
                        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl skeleton-shimmer border-none" style={{
                                        background: 'linear-gradient(135deg, hsl(220 50% 45%) 0%, hsl(230 40% 40%) 100%)'
                                    }} />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-[14px] w-48 rounded-md" />
                                        <Skeleton className="h-[11px] w-36 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-1.5">
                                        <Skeleton className="h-[12px] w-28 rounded" />
                                        <Skeleton className="h-11 w-full rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Academic Section Skeleton */}
                        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl skeleton-shimmer border-none" style={{
                                        background: 'linear-gradient(135deg, hsl(270 40% 50%) 0%, hsl(280 35% 45%) 100%)'
                                    }} />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-[14px] w-44 rounded-md" />
                                        <Skeleton className="h-[11px] w-36 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="space-y-1.5">
                                        <Skeleton className="h-[12px] w-24 rounded" />
                                        <Skeleton className="h-11 w-full rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <Info className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Error Loading Profile</h3>
                <p className="text-gray-500 max-w-xs">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-emerald-700 font-semibold hover:underline"
                >
                    Try refreshing the page
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <PageHeader
                title="My Profile"
                description="View and manage your account information, personal details, and academic records."
                currentPage="My Profile"
            />


            {/* Main Content - Bento Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column (Account & Personal) - takes 7 cols */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* ── Profile Hero ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-500 p-6 lg:p-8 text-white">
                        {/* Decorative mesh */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
                        </div>
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                            backgroundSize: "24px 24px",
                        }} />

                        <div className="relative flex items-center gap-6">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold ring-4 ring-white/30">
                                {initials}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-emerald-100 text-xs font-medium mb-0.5">Alumni</p>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {personal.firstname} {personal.middlename ? personal.middlename[0] + ". " : ""}{personal.lastname}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium">
                                        <GraduationCap className="w-3 h-3" strokeWidth={2} />
                                        {academic.course}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium">
                                        <CalendarDays className="w-3 h-3" strokeWidth={2} />
                                        Graduated {academic.yearGraduated}
                                    </span>
                                </div>
                            </div>

                            {/* Student ID badge */}
                            <div className="hidden lg:flex flex-col items-end flex-shrink-0">
                                <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-widest mb-1">Student ID</p>
                                <p className="text-white font-mono font-bold text-lg tracking-wider">{academic.studentId}</p>
                            </div>
                        </div>
                    </div>
                    <SectionCard
                        title="Account Information"
                        subtitle="Login credentials and contact email"
                        editable
                        editing={editingAccount}
                        onEdit={() => { setAccountDraft(account); setEditingAccount(true); }}
                        onSave={handleSaveAccount}
                        onCancel={handleCancelAccount}
                        loading={isSavingAccount}
                        icon={<Settings size={18} />}
                        iconContainerClass="bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Username — always read-only */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Username <span className="text-emerald-600">*</span>
                                    <span className="ml-2 text-[10px] font-normal text-slate-400 normal-case tracking-normal">(admin-assigned)</span>
                                </label>
                                <div className="w-full h-11 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                    {account.username}
                                </div>
                            </div>

                            {/* Email */}
                            <Field
                                label="Email"
                                value={accountDraft.email}
                                onChange={(v) => setAccountDraft((p) => ({ ...p, email: v }))}
                                type="email"
                                editing={editingAccount}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </SectionCard>

                    {/* ── 2. Personal Information ── */}
                    <SectionCard
                        title="Personal Information"
                        subtitle="Basic personal details"
                        editable
                        editing={editingPersonal}
                        onEdit={() => { setPersonalDraft(personal); setEditingPersonal(true); }}
                        onSave={handleSavePersonal}
                        onCancel={handleCancelPersonal}
                        loading={isSavingPersonal}
                        icon={<User size={18} />}
                        iconContainerClass="bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="Last Name"
                                value={personalDraft.lastname}
                                onChange={(v) => setPersonalDraft((p) => ({ ...p, lastname: v }))}
                                editing={editingPersonal}
                                placeholder="Dela Cruz"
                                required
                            />
                            <Field
                                label="First Name"
                                value={personalDraft.firstname}
                                onChange={(v) => setPersonalDraft((p) => ({ ...p, firstname: v }))}
                                editing={editingPersonal}
                                placeholder="Juan"
                                required
                            />
                            <Field
                                label="Middle Name"
                                value={personalDraft.middlename}
                                onChange={(v) => setPersonalDraft((p) => ({ ...p, middlename: v }))}
                                editing={editingPersonal}
                                placeholder="Santos"
                            />
                            {/* Gender */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Gender <span className="text-emerald-600">*</span>
                                </label>
                                {editingPersonal ? (
                                    <Select
                                        value={personalDraft.gender}
                                        onValueChange={(v) => setPersonalDraft((p) => ({ ...p, gender: v }))}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-md border border-gray-300 bg-white text-sm text-gray-900 px-3.5 transition-all duration-150 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                            <SelectItem value="NON_BINARY">Non-binary</SelectItem>
                                            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="w-full h-11 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 flex items-center">
                                        {formatGender(personal.gender) || <span className="text-gray-300 italic text-xs">Not provided</span>}
                                    </div>
                                )}
                            </div>

                            {/* Birthdate */}
                            <Field
                                label="Birthdate"
                                value={personalDraft.birthdate}
                                onChange={(v) => setPersonalDraft((p) => ({ ...p, birthdate: v, age: computeAge(v) }))}
                                type="date"
                                editing={editingPersonal}
                                required
                            />

                            {/* Age — always computed */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Age
                                    <span className="ml-1.5 text-[10px] font-normal text-slate-400 normal-case tracking-normal">(auto-computed)</span>
                                </label>
                                <div className="w-full h-[44px] rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 px-3.5 flex items-center gap-2 shadow-xs">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                    {editingPersonal ? personalDraft.age : personal.age}
                                    {((editingPersonal ? personalDraft.age : personal.age) !== "—") && (
                                        <span className="text-gray-400 text-xs">years old</span>
                                    )}
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                                    Skills
                                </label>
                                <SkillsInput
                                    skills={editingPersonal ? personalDraft.skills : personal.skills}
                                    onChange={(v) => setPersonalDraft((p) => ({ ...p, skills: v }))}
                                    disabled={!editingPersonal}
                                />
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Right Column (Academic) - takes 5 cols */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* ── 3. Employment Information ── */}
                    <SectionCard
                        title="Employment Information"
                        subtitle="Current career and placement status"
                        editable
                        editing={editingEmployment}
                        onEdit={() => { setEmploymentDraft(employment); setEditingEmployment(true); }}
                        onSave={handleSaveEmployment}
                        onCancel={handleCancelEmployment}
                        loading={isSavingEmployment}
                        icon={<Briefcase size={18} />}
                        iconContainerClass="bg-gradient-to-br from-blue-600 to-indigo-500 shadow-blue-500/20"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Employment Status */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Employment Status <span className="text-emerald-600">*</span>
                                </label>
                                {editingEmployment ? (
                                    <Select
                                        value={employmentDraft.status}
                                        onValueChange={(v) => setEmploymentDraft((p) => ({ ...p, status: v }))}
                                    >
                                        <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white text-sm text-gray-900 px-3.5 h-[42px] transition-all duration-150 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Employed">Employed</SelectItem>
                                            <SelectItem value="Interviewing">Interviewing</SelectItem>
                                            <SelectItem value="Searching">Searching</SelectItem>
                                            <SelectItem value="Not Looking">Not Looking</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="w-full h-11 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 flex items-center">
                                        {employment.status}
                                    </div>
                                )}
                            </div>

                            <Field
                                label="Employment Sector"
                                value={employmentDraft.sector}
                                onChange={(v) => setEmploymentDraft((p) => ({ ...p, sector: v }))}
                                editing={editingEmployment}
                                placeholder="e.g. Information Technology"
                            />

                            <Field
                                label="Salary Package (Monthly)"
                                value={employmentDraft.salary}
                                type="number"
                                onChange={(v) => setEmploymentDraft((p) => ({ ...p, salary: v }))}
                                editing={editingEmployment}
                                placeholder="0.00"
                            />

                            <Field
                                label="Job Offers Received"
                                value={employmentDraft.offers}
                                type="number"
                                onChange={(v) => setEmploymentDraft((p) => ({ ...p, offers: v }))}
                                editing={editingEmployment}
                                placeholder="0"
                            />
                        </div>
                    </SectionCard>

                    {/* ── 3. Academic Information ── */}
                    <SectionCard
                        title="Academic Information"
                        subtitle="Academic records — managed by the registrar"
                        editable
                        editing={editingAcademic}
                        onEdit={() => { setAcademicDraft(academic); setEditingAcademic(true); }}
                        onSave={handleSaveAcademic}
                        onCancel={handleCancelAcademic}
                        loading={isSavingAcademic}
                        icon={<GraduationCap className="w-5 h-5" strokeWidth={1.75} />}
                        iconContainerClass="bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
                    >
                        <>
                            {/* Info notice */}
                            <div className="flex items-start gap-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-md px-4 py-3 mb-5">
                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" strokeWidth={2} />
                                <p>Core academic records are managed by the Registrar&apos;s Office. However, you can update your extracurricular and leadership status.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <ReadOnlyField label="Student ID *" value={academic.studentId} />
                                </div>
                                <Field
                                    label="Leadership Position"
                                    value={academicDraft.leadershipPos}
                                    onChange={(v) => setAcademicDraft((p) => ({ ...p, leadershipPos: v }))}
                                    editing={editingAcademic}
                                    options={["Yes", "No"]}
                                />
                                <Field
                                    label="Active Member Position"
                                    value={academicDraft.activeMemberPos}
                                    onChange={(v) => setAcademicDraft((p) => ({ ...p, activeMemberPos: v }))}
                                    editing={editingAcademic}
                                    options={["Yes", "No"]}
                                />
                                <ReadOnlyField label="Course *" value={academic.course} />
                                <ReadOnlyField label="Year Graduated *" value={academic.yearGraduated} />
                            </div>
                        </>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
