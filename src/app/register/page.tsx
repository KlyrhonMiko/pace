"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    User,
    Settings,
    Check,
    ChevronRight,
    GraduationCap,
    CalendarDays,
    Lock,
    Clock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { id: 1, name: "Account", icon: <Settings className="w-4 h-4" /> },
        { id: 2, name: "Personal", icon: <User className="w-4 h-4" /> },
        { id: 3, name: "Academic", icon: <GraduationCap className="w-4 h-4" /> },
    ];

    return (
        <div className="flex items-center justify-center w-full mb-8">
            <div className="flex items-center w-full max-w-md">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center relative">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= step.id
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                    : "bg-gray-100 text-gray-400"
                                    }`}
                            >
                                {currentStep > step.id ? <Check className="w-5 h-5" strokeWidth={3} /> : step.icon}
                            </div>
                            <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep >= step.id ? "text-emerald-700" : "text-gray-400"
                                }`}>
                                {step.name}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mx-4 bg-gray-100 relative overflow-hidden">
                                <div
                                    className="absolute inset-0 bg-emerald-500 transition-all duration-500 ease-in-out"
                                    style={{ width: currentStep > step.id ? "100%" : "0%" }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function FormSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

function InputField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required = false,
    icon,
    className = "",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                {label}
                {required && <span className="text-emerald-600">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full rounded-xl border border-gray-200 bg-white text-sm px-3.5 py-2.5 transition-all duration-150 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 ${icon ? "pl-10" : ""
                        }`}
                />
            </div>
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    required = false,
    className = "",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white text-sm px-3.5 py-2.5 transition-all duration-150 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            >
                <option value="">Select {label}</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // ── Form States ──
    const [account, setAccount] = useState<AccountInfo>({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
    });

    const [personal, setPersonal] = useState<PersonalInfo>({
        lastname: "",
        firstname: "",
        middlename: "",
        gender: "",
        birthdate: "",
        age: "—",
    });

    const [academic, setAcademic] = useState<AcademicInfo>({
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

    // ── Age auto-compute ──
    useEffect(() => {
        setPersonal((prev) => ({
            ...prev,
            age: computeAge(prev.birthdate),
        }));
    }, [personal.birthdate]);

    // ── Handlers ──
    const validateStep = (stepNumber: number) => {
        if (stepNumber === 1) {
            if (!account.username.trim()) { toast.error("Username is required"); return false; }
            if (!account.email.trim()) { toast.error("Email is required"); return false; }
            if (!account.email.includes("@")) { toast.error("Please enter a valid email address"); return false; }
            if (!account.password) { toast.error("Password is required"); return false; }
            if (!account.confirmPassword) { toast.error("Please confirm your password"); return false; }
            if (account.password !== account.confirmPassword) { toast.error("Passwords do not match"); return false; }
        } else if (stepNumber === 2) {
            if (!personal.firstname.trim()) { toast.error("Firstname is required"); return false; }
            if (!personal.lastname.trim()) { toast.error("Lastname is required"); return false; }
            if (!personal.gender) { toast.error("Gender is required"); return false; }
            if (!personal.birthdate) { toast.error("Birthdate is required"); return false; }
        } else if (stepNumber === 3) {
            if (!academic.studentId.trim()) { toast.error("Student ID is required"); return false; }
            if (!academic.yearGraduated.trim()) { toast.error("Graduation year is required"); return false; }
            if (!academic.gwa.trim()) { toast.error("GWA/CGPA is required"); return false; }
            if (!academic.ojtGrade.trim()) { toast.error("OJT Grade is required"); return false; }
            if (!academic.course) { toast.error("Please select your course"); return false; }
        }
        return true;
    };

    const nextStep = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (validateStep(step)) {
            setStep((s) => Math.min(s + 1, 3));
        }
    };

    const prevStep = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setStep((s) => Math.max(s - 1, 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If user hits Enter on step 1 or 2, just try to go to next step
        if (step < 3) {
            if (validateStep(step)) {
                setStep((s) => s + 1);
            }
            return;
        }

        // Final step validation
        if (!validateStep(3)) return;

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsComplete(true);
        } catch (error) {
            toast.error("An error occurred during registration. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipAcademic = () => {
        // Validation for Step 2 should have been done to reach Step 3
        setIsSubmitting(true);
        // Simulate API call with partial data
        setTimeout(() => {
            setIsSubmitting(false);
            setIsComplete(true);
        }, 1500);
    };

    if (isComplete) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-100/50 border border-emerald-50 p-10 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h1>
                    <p className="text-slate-500 mb-8">
                        Welcome to the PLP Alumni community. Your account has been created and is pending verification.
                    </p>
                    <Link href="/dashboard/alumni">
                        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white h-12 rounded-xl text-base font-semibold transition-all shadow-lg shadow-emerald-200">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header / Logo */}
            <div className="py-8 px-6 flex justify-center">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/plp-logo.png" alt="PLP Logo" className="h-12 w-12 object-contain" />
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 leading-none">Pamantasan ng Lungsod ng Pasig</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Alumni Portal</span>
                    </div>
                </Link>
            </div>

            <main className="flex-grow flex items-center justify-center px-6 pb-20">
                <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative">

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-tr-full -z-0 opacity-50" />

                    <div className="relative z-10 p-8 md:p-12">
                        <StepIndicator currentStep={step} />

                        <form onSubmit={handleSubmit} className="mt-12">
                            {/* Step 1: Account Information */}
                            {step === 1 && (
                                <FormSection
                                    title="Account Information"
                                    subtitle="Set up your login credentials"
                                >
                                    <InputField
                                        label="Username"
                                        value={account.username}
                                        onChange={(v) => setAccount(p => ({ ...p, username: v }))}
                                        placeholder="jdelacruz2024"
                                        required
                                        icon={<User className="w-4 h-4" />}
                                    />
                                    <InputField
                                        label="Email"
                                        value={account.email}
                                        onChange={(v) => setAccount(p => ({ ...p, email: v }))}
                                        type="email"
                                        placeholder="juan.delacruz@email.com"
                                        required
                                        icon={<Settings className="w-4 h-4" />}
                                    />
                                    <InputField
                                        label="Password"
                                        value={account.password}
                                        onChange={(v) => setAccount(p => ({ ...p, password: v }))}
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        icon={<Lock className="w-4 h-4" />}
                                    />
                                    <InputField
                                        label="Confirm Password"
                                        value={account.confirmPassword}
                                        onChange={(v) => setAccount(p => ({ ...p, confirmPassword: v }))}
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        icon={<Lock className="w-4 h-4" />}
                                    />
                                </FormSection>
                            )}

                            {/* Step 2: Personal Information */}
                            {step === 2 && (
                                <FormSection
                                    title="Personal Information"
                                    subtitle="Tell us more about yourself"
                                >
                                    <InputField
                                        label="Firstname"
                                        value={personal.firstname}
                                        onChange={(v) => setPersonal(p => ({ ...p, firstname: v }))}
                                        placeholder="Juan"
                                        required
                                    />
                                    <InputField
                                        label="Lastname"
                                        value={personal.lastname}
                                        onChange={(v) => setPersonal(p => ({ ...p, lastname: v }))}
                                        placeholder="Dela Cruz"
                                        required
                                    />
                                    <InputField
                                        label="Middlename"
                                        value={personal.middlename}
                                        onChange={(v) => setPersonal(p => ({ ...p, middlename: v }))}
                                        placeholder="Santos"
                                    />
                                    <SelectField
                                        label="Gender"
                                        value={personal.gender}
                                        onChange={(v) => setPersonal(p => ({ ...p, gender: v }))}
                                        options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                                        required
                                    />
                                    <InputField
                                        label="Birthdate"
                                        type="date"
                                        value={personal.birthdate}
                                        onChange={(v) => setPersonal(p => ({ ...p, birthdate: v }))}
                                        required
                                    />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                            Age
                                            <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">(auto-computed)</span>
                                        </label>
                                        <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-900 px-3.5 py-2.5 h-[42px] flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            {personal.age} {personal.age !== "—" && "years old"}
                                        </div>
                                    </div>
                                </FormSection>
                            )}

                            {/* Step 3: Academic Information */}
                            {step === 3 && (
                                <FormSection
                                    title="Academic Information"
                                    subtitle="Help us track your career progress"
                                >
                                    <InputField
                                        label="Student ID"
                                        value={academic.studentId}
                                        onChange={(v) => setAcademic(p => ({ ...p, studentId: v }))}
                                        placeholder="2020-00000"
                                        required
                                    />
                                    <InputField
                                        label="Year Graduated"
                                        value={academic.yearGraduated}
                                        onChange={(v) => setAcademic(p => ({ ...p, yearGraduated: v }))}
                                        placeholder="2024"
                                        required
                                    />
                                    <InputField
                                        label="GWA/CGPA"
                                        value={academic.gwa}
                                        onChange={(v) => setAcademic(p => ({ ...p, gwa: v }))}
                                        placeholder="1.50"
                                        required
                                    />
                                    <InputField
                                        label="Avg. Prof Grade"
                                        value={academic.avgProfGrade}
                                        onChange={(v) => setAcademic(p => ({ ...p, avgProfGrade: v }))}
                                        placeholder="1.40"
                                    />
                                    <InputField
                                        label="Avg. Elec Grade"
                                        value={academic.avgElecGrade}
                                        onChange={(v) => setAcademic(p => ({ ...p, avgElecGrade: v }))}
                                        placeholder="1.60"
                                    />
                                    <InputField
                                        label="OJT Grade"
                                        value={academic.ojtGrade}
                                        onChange={(v) => setAcademic(p => ({ ...p, ojtGrade: v }))}
                                        placeholder="95"
                                        required
                                    />
                                    <InputField
                                        label="Leadership Position"
                                        value={academic.leadershipPos}
                                        onChange={(v) => setAcademic(p => ({ ...p, leadershipPos: v }))}
                                        placeholder="President, Org Name"
                                    />
                                    <InputField
                                        label="Active Member Position"
                                        value={academic.activeMemberPos}
                                        onChange={(v) => setAcademic(p => ({ ...p, activeMemberPos: v }))}
                                        placeholder="Member, Org Name"
                                    />
                                    <SelectField
                                        label="Course"
                                        value={academic.course}
                                        onChange={(v) => setAcademic(p => ({ ...p, course: v }))}
                                        options={[
                                            "BS Information Technology",
                                            "BS Computer Science",
                                            "BS Business Administration",
                                            "BS Accountancy",
                                            "AB Communication",
                                            "BS Psychology",
                                            "BS Nursing",
                                            "BS Engineering"
                                        ]}
                                        required
                                        className="md:col-span-2"
                                    />
                                </FormSection>
                            )}

                            {/* Form Navigation */}
                            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                                {step > 1 ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={prevStep}
                                        className="text-slate-500 hover:text-slate-700 h-12 px-6 rounded-xl flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>
                                ) : (
                                    <Link href="/">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="text-slate-500 hover:text-slate-700 h-12 px-6 rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                    </Link>
                                )}

                                <div className="flex items-center gap-3">
                                    {step === 3 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleSkipAcademic}
                                            disabled={isSubmitting}
                                            className="text-slate-400 hover:text-slate-600 h-12 px-6 rounded-xl"
                                        >
                                            Skip for now
                                        </Button>
                                    )}

                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            className="bg-emerald-700 hover:bg-emerald-800 text-white h-12 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                        >
                                            Next Step
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-emerald-700 hover:bg-emerald-800 text-white h-12 px-10 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70"
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <>
                                                    Complete Registration
                                                    <Check className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Already have an account? */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-sm text-slate-500 flex items-center gap-2 bg-white/50 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-sm">
                    Already have an account?
                    <Link href="/dashboard/alumni" className="text-emerald-700 font-bold hover:underline">
                        Sign In here
                    </Link>
                </div>
            </main>
        </div>
    );
}
