"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, Settings, Check, Pencil, ChevronRight, GraduationCap, CalendarDays, Lock, Clock, Info } from "lucide-react";

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
}

interface AcademicInfo {
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

// ─── Formatting Helpers ────────────────────────────────────────────────────────
function formatStudentId(id: string): string {
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
    saved = false,
    skipable = false,
    onSkip,
    iconContainerClass = "",
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
    saved?: boolean;
    skipable?: boolean;
    onSkip?: () => void;
    iconContainerClass?: string;
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
                    {saved && !editing && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Saved
                        </span>
                    )}
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
                    {editing && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onCancel}
                                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                className="text-xs text-white bg-emerald-700 hover:bg-emerald-800 font-medium px-3.5 py-1.5 rounded-lg transition-colors duration-150 shadow-sm"
                            >
                                Save changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-5">{children}</div>
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
        "w-full rounded-xl border text-sm px-3.5 py-2.5 transition-all duration-150 outline-none ";
    const readonlyClass =
        "bg-gray-50 border-gray-200 text-gray-500 cursor-default select-none";
    const editableClass =
        "bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            {options && !isReadOnly ? (
                <select
                    value={value as string}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={baseInput + editableClass}
                >
                    <option value="">Select {label}</option>
                    {options.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
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
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
            </label>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 py-2.5 min-h-[42px] flex items-center">
                {value || <span className="text-gray-300 italic text-xs">Not provided</span>}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    // ── Account Info ──
    const [account, setAccount] = useState<AccountInfo>({
        username: "jdelacruz2024",
        password: "",
        confirmPassword: "",
        email: "juan.delacruz@plpasig.edu.ph",
    });
    const [accountDraft, setAccountDraft] = useState<AccountInfo>(account);
    const [editingAccount, setEditingAccount] = useState(false);
    const [accountSaved, setAccountSaved] = useState(false);

    // ── Personal Info ──
    const [personal, setPersonal] = useState<PersonalInfo>({
        lastname: "Dela Cruz",
        firstname: "Juan",
        middlename: "Santos",
        gender: "Male",
        birthdate: "2002-03-15",
        age: computeAge("2002-03-15"),
    });
    const [personalDraft, setPersonalDraft] = useState<PersonalInfo>(personal);
    const [editingPersonal, setEditingPersonal] = useState(false);
    const [personalSaved, setPersonalSaved] = useState(false);

    // ── Academic Info ──
    const [academic] = useState<AcademicInfo>({
        studentId: "2020-12345-MN-0",
        yearGraduated: "2024",
        gwa: "1.50",
        avgProfGrade: "1.45",
        avgElecGrade: "1.52",
        ojtGrade: "92.5",
        leadershipPos: "President, BITS Organization",
        activeMemberPos: "Member, ACM Student Chapter",
        course: "BS Information Technology",
    });
    const [academicSkipped, setAcademicSkipped] = useState(false);



    // ── Age auto-compute ──
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPersonalDraft((prev) => ({
            ...prev,
            age: computeAge(prev.birthdate),
        }));
    }, [personalDraft.birthdate]);

    // ── Handlers: Account ──
    const handleSaveAccount = useCallback(() => {
        setAccount(accountDraft);
        setEditingAccount(false);
        setAccountSaved(true);
    }, [accountDraft]);

    const handleCancelAccount = useCallback(() => {
        setAccountDraft(account);
        setEditingAccount(false);
    }, [account]);

    // ── Handlers: Personal ──
    const handleSavePersonal = useCallback(() => {
        setPersonal({
            ...personalDraft,
            age: computeAge(personalDraft.birthdate),
        });
        setEditingPersonal(false);
        setPersonalSaved(true);
    }, [personalDraft]);

    const handleCancelPersonal = useCallback(() => {
        setPersonalDraft(personal);
        setEditingPersonal(false);
    }, [personal]);

    // ── State: Initials ──
    const initials =
        `${personal.firstname?.[0] ?? ""}${personal.lastname?.[0] ?? ""}`.toUpperCase() || "—";



    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-4">
                        <Link href="/dashboard/alumni" className="hover:text-gray-600 transition-colors">
                            Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                        <span className="text-gray-600">My Profile</span>
                    </nav>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My Profile</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                View and manage your account information, personal details, and academic records.
                            </p>
                        </div>
                    </div>
                </div>
            </div>


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
                                <p className="text-white font-mono font-bold text-lg tracking-wider">{formatStudentId(academic.studentId)}</p>
                            </div>
                        </div>
                    </div>
                    <SectionCard
                        title="Account Information"
                        subtitle="Login credentials and contact email"
                        editable
                        editing={editingAccount}
                        saved={accountSaved}
                        onEdit={() => { setAccountDraft(account); setEditingAccount(true); setAccountSaved(false); }}
                        onSave={handleSaveAccount}
                        onCancel={handleCancelAccount}
                        icon={<Settings size={18} />}
                        iconContainerClass="bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Username — always read-only */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Username <span className="text-emerald-600">*</span>
                                    <span className="ml-2 text-[10px] font-normal text-gray-400 normal-case tracking-normal">(admin-assigned)</span>
                                </label>
                                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 py-2.5 flex items-center gap-2">
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
                        saved={personalSaved}
                        onEdit={() => { setPersonalDraft(personal); setEditingPersonal(true); setPersonalSaved(false); }}
                        onSave={handleSavePersonal}
                        onCancel={handleCancelPersonal}
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
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Gender <span className="text-emerald-600">*</span>
                                </label>
                                {editingPersonal ? (
                                    <select
                                        value={personalDraft.gender}
                                        onChange={(e) => setPersonalDraft((p) => ({ ...p, gender: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-300 bg-white text-sm text-gray-900 px-3.5 py-2.5 transition-all duration-150 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                ) : (
                                    <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 py-2.5">
                                        {personal.gender || <span className="text-gray-300 italic text-xs">Not provided</span>}
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
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    Age
                                    <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">(auto-computed)</span>
                                </label>
                                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 py-2.5 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                    {editingPersonal ? personalDraft.age : personal.age}
                                    {((editingPersonal ? personalDraft.age : personal.age) !== "—") && (
                                        <span className="text-gray-400 text-xs">years old</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SectionCard>


                </div>

                {/* Right Column (Academic) - takes 5 cols */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* ── 3. Academic Information ── */}
                    <SectionCard
                        title="Academic Information"
                        subtitle="Academic records — managed by the registrar"
                        skipable={!academicSkipped}
                        onSkip={() => setAcademicSkipped(true)}
                        icon={<GraduationCap className="w-5 h-5" strokeWidth={1.75} />}
                        iconContainerClass="bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
                    >
                        {academicSkipped ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                                    <Info className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm text-gray-500 mb-3">Academic section skipped</p>
                                <button
                                    onClick={() => setAcademicSkipped(false)}
                                    className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2"
                                >
                                    Show academic info
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Info notice */}
                                <div className="flex items-start gap-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl px-4 py-3 mb-5">
                                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" strokeWidth={2} />
                                    <p>These records are managed by the Registrar&apos;s Office and cannot be edited directly. Contact your registrar for corrections.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ReadOnlyField label="Student ID *" value={formatStudentId(academic.studentId)} />
                                    <ReadOnlyField label="Year Graduated *" value={academic.yearGraduated} />
                                    <ReadOnlyField label="GWA / CGPA *" value={academic.gwa} />
                                    <ReadOnlyField label="Avg. Professional Grade" value={academic.avgProfGrade} />
                                    <ReadOnlyField label="Avg. Elective Grade" value={academic.avgElecGrade} />
                                    <ReadOnlyField label="OJT Grade *" value={academic.ojtGrade} />
                                    <div className="md:col-span-2">
                                        <ReadOnlyField label="Leadership Position" value={academic.leadershipPos} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ReadOnlyField label="Active Member Position" value={academic.activeMemberPos} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ReadOnlyField label="Course *" value={academic.course} />
                                    </div>
                                </div>
                            </>
                        )}
                    </SectionCard>
                </div>
            </div>

        </div >
    );
}
