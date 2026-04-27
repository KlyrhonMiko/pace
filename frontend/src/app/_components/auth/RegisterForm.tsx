"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
    User,
    Check,
    Lock,
    Clock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Mail,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

import {
    fetchCourses,
    sendOtp,
    resendOtp,
    verifyOtp,
    registerAlumni,
    registerEmployer,
    createStudentRecord,
    initializeAlumniSkills,
    CourseOption
} from "./api";
import { PasswordRequirements } from "./PasswordRequirements";


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
    leadershipPos: boolean | null;
    activeMemberPos: boolean | null;
    courseAbbv: string;
}

interface EmployerInfo {
    companyName: string;
    contactFirstName: string;
    contactLastName: string;
    position: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

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

function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, role, compact = false }: { currentStep: number; role?: "Alumni" | "Employer" | null; compact?: boolean }) {
    const steps = role === "Employer" ? [
        { id: 1, name: "Account" },
        { id: 2, name: "Company" },
        { id: 3, name: "Verify Email" },
    ] : [
        { id: 1, name: "Account" },
        { id: 2, name: "Personal" },
        { id: 3, name: "Academic" },
        { id: 4, name: "Verify Email" },
    ];

    const totalSteps = steps.length;
    const currentStepData = steps.find((s) => s.id === currentStep);

    if (compact) {
        return (
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        Step {currentStep} of {totalSteps}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                        {currentStepData?.name}
                    </span>
                </div>
                <div className="flex items-center w-full gap-1.5">
                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        return (
                            <div
                                key={step.id}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ease-out ${isCompleted
                                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                                    : isCurrent
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                        : "bg-slate-100"
                                    }`}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full mb-6">
            <div className="flex items-center w-full">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center relative">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= step.id
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                    : "bg-slate-100 text-slate-400"
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <Check className="w-4 h-4" strokeWidth={3} />
                                ) : (
                                    <span className="text-[12px] font-bold">{step.id}</span>
                                )}
                            </div>
                            <span className={`absolute -bottom-5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep >= step.id ? "text-emerald-700" : "text-slate-400"
                                }`}>
                                {step.name}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mx-2 bg-slate-100 relative overflow-hidden rounded-full">
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight leading-tight">{title}</h2>
                <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-3.5">
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
        <div className={`space-y-2 ${className}`}>
            <label className="text-[13px] font-semibold text-slate-700 ml-0.5">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            <div className="relative rounded-xl">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full h-11 rounded-xl border border-slate-200 bg-white text-[14px] px-3.5 shadow-sm transition-all duration-200 outline-none hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900 placeholder:text-slate-400 ${icon ? "pl-10" : ""
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
    options: Array<string | { value: string; label: string }>;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-[13px] font-semibold text-slate-700 ml-0.5">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white text-[14px] px-3.5 shadow-sm transition-all duration-200 outline-none hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900"
            >
                <option value="">Select {label}</option>
                {options.map((o) => {
                    const val = typeof o === "string" ? o : o.value;
                    const lbl = typeof o === "string" ? o : o.label;
                    return (
                        <option key={val} value={val}>
                            {lbl}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}

// ─── OTP Input Component ───────────────────────────────────────────────────────

function OTPInput({
    value,
    onChange,
    disabled = false,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    disabled?: boolean;
}) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, char: string) => {
        if (!/^\d?$/.test(char)) return;
        const newValue = [...value];
        newValue[index] = char;
        onChange(newValue);
        if (char && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;
        const newValue = [...value];
        for (let i = 0; i < OTP_LENGTH; i++) {
            newValue[i] = pasted[i] || "";
        }
        onChange(newValue);
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={disabled}
                    className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 transition-all duration-200 outline-none shadow-sm
                        ${value[i]
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-900"
                        }
                        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                />
            ))}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface RegisterFormProps {
    isModal?: boolean;
    onLoginClick?: () => void;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialRole?: "Alumni" | "Employer";
}

export function RegisterForm({ isModal, onLoginClick, onSuccess, onCancel, initialRole }: RegisterFormProps) {
    // Steps: 1=Account, 2=Personal/Company, 3=Academic (Alumni only), 4=OTP Verify
    const [role, setRole] = useState<"Alumni" | "Employer">(initialRole ?? "Alumni");
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [skippedAcademic, setSkippedAcademic] = useState(false);

    // ── OTP States ──
    const [otpCode, setOtpCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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
        leadershipPos: null,
        activeMemberPos: null,
        courseAbbv: "",
    });

    const [employerInfo, setEmployerInfo] = useState<EmployerInfo>({
        companyName: "",
        contactFirstName: "",
        contactLastName: "",
        position: "",
    });

    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [consentForSurveyMl, setConsentForSurveyMl] = useState(false);

    useEffect(() => {
        async function loadCourses() {
            try {
                const courseData = await fetchCourses();
                setCourses(courseData);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            }
        }
        loadCourses();
    }, []);


    // ── Age auto-compute ──
    useEffect(() => {
        setPersonal((prev) => ({
            ...prev,
            age: computeAge(prev.birthdate),
        }));
    }, [personal.birthdate]);

    // ── Resend cooldown timer ──
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // ── Validation ──
    const validateStep = (stepNumber: number) => {
        if (stepNumber === 1) {
            if (!account.username.trim()) { toast.error("Username is required"); return false; }
            if (!account.email.trim()) { toast.error("Email is required"); return false; }
            if (!account.email.includes("@")) { toast.error("Please enter a valid email address"); return false; }
            if (!account.password) { toast.error("Password is required"); return false; }
            if (account.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
            if (!account.confirmPassword) { toast.error("Please confirm your password"); return false; }
            if (account.password !== account.confirmPassword) { toast.error("Passwords do not match"); return false; }
        } else if (stepNumber === 2 && role === "Alumni") {
            if (!personal.firstname.trim()) { toast.error("Firstname is required"); return false; }
            if (!personal.lastname.trim()) { toast.error("Lastname is required"); return false; }
            if (!personal.gender) { toast.error("Gender is required"); return false; }
            if (!personal.birthdate) { toast.error("Birthdate is required"); return false; }
        } else if (stepNumber === 3 && role === "Alumni") {
            if (!academic.studentId.trim()) { toast.error("Student ID is required"); return false; }
            if (!academic.yearGraduated.trim()) { toast.error("Graduation year is required"); return false; }
            if (!academic.gwa.trim()) { toast.error("GWA/CGPA is required"); return false; }
            if (!academic.ojtGrade.trim()) { toast.error("OJT Grade is required"); return false; }
            if (!academic.courseAbbv) { toast.error("Please select your course"); return false; }
        } else if (stepNumber === 2 && role === "Employer") {
            if (!employerInfo.companyName.trim()) { toast.error("Company Name is required"); return false; }
            if (!employerInfo.contactFirstName.trim()) { toast.error("Contact Firstname is required"); return false; }
            if (!employerInfo.contactLastName.trim()) { toast.error("Contact Lastname is required"); return false; }
        }
        return true;
    };

    // ── OTP Handlers ──
    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            await sendOtp(account.email);
            toast.success("Verification code sent to your email!");
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            return true;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send code");
            return false;
        } finally {
            setIsSendingOtp(false);
        }
    };


    const handleVerifyAndSubmit = async () => {
        const code = otpCode.join("");
        if (code.length !== OTP_LENGTH) {
            toast.error("Please enter the complete 6-digit code");
            return;
        }

        setIsVerifyingOtp(true);
        try {
            // Step 1: Verify OTP
            const verifyData = await verifyOtp(account.email, code);

            if (!verifyData.success) {
                toast.error(verifyData.message || "Invalid verification code");
                setOtpCode(Array(OTP_LENGTH).fill(""));
                return;
            }

            toast.success("Email verified! Creating your account...");

            // Step 2: OTP verified — now commit registration to DB
            setIsSubmitting(true);

            if (role === "Employer") {
                await registerEmployer({
                    username: account.username,
                    email: account.email,
                    password: account.password,
                    company_name: employerInfo.companyName,
                    contact_person_first_name: employerInfo.contactFirstName,
                    contact_person_last_name: employerInfo.contactLastName,
                    contact_person_position: employerInfo.position || null,
                });
            } else {
                const computedAge = typeof personal.age === "number" ? personal.age : 0;

                // Register alumni + user account
                const registerRes = await registerAlumni({
                    username: account.username,
                    email: account.email,
                    password: account.password,
                    last_name: personal.lastname,
                    first_name: personal.firstname,
                    middle_name: personal.middlename || null,
                    gender: personal.gender,
                    age: computedAge,
                    birthdate: personal.birthdate || null,
                    consent_for_survey_ml: consentForSurveyMl,
                });

                const alumniId: string = registerRes.data.alumni_id;

                // Create student record (if academic info was provided)
                if (!skippedAcademic) {
                    await createStudentRecord({
                        student_id: academic.studentId,
                        year_graduated: parseInt(academic.yearGraduated, 10),
                        gwa: parseFloat(academic.gwa),
                        avg_prof_grade: academic.avgProfGrade ? parseFloat(academic.avgProfGrade) : null,
                        avg_elec_grade: academic.avgElecGrade ? parseFloat(academic.avgElecGrade) : null,
                        ojt_grade: academic.ojtGrade ? parseFloat(academic.ojtGrade) : null,
                        leadership_pos: academic.leadershipPos,
                        act_member_pos: academic.activeMemberPos,
                        course_abbv: academic.courseAbbv,
                        alumni_id: alumniId,
                    });
                }
            }

            setIsComplete(true);

            setIsComplete(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred during registration.");
        } finally {
            setIsVerifyingOtp(false);
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setIsSendingOtp(true);
        try {
            await resendOtp(account.email);
            toast.success("New verification code sent!");
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            setOtpCode(Array(OTP_LENGTH).fill(""));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to resend code");
        } finally {
            setIsSendingOtp(false);
        }
    };


    // ── Step Navigation ──
    const nextStep = async (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        if (step === 1 && validateStep(1)) {
            setStep(2);
        } else if (step === 2 && validateStep(2)) {
            if (role === "Employer") {
                const sent = await handleSendOtp();
                if (sent) {
                    setStep(3);
                }
            } else {
                setStep(3);
            }
        } else if (step === 3 && role === "Alumni") {
            // Validated by submit or skip
            if (validateStep(3)) {
                // Send OTP and move to verification
                const sent = await handleSendOtp();
                if (sent) {
                    setSkippedAcademic(false);
                    setStep(4);
                }
            }
        }
    };

    const handleSkipAcademic = async () => {
        // Skip academic, send OTP, go to verification
        const sent = await handleSendOtp();
        if (sent) {
            setSkippedAcademic(true);
            setStep(4);
        }
    };

    const prevStep = (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (step === 4 && role === "Alumni") {
            setStep(3); // Go back to academic
        } else if (step === 3 && role === "Employer") {
            setStep(2);
        } else {
            setStep((s) => Math.max(s - 1, 1));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) { if (validateStep(1)) setStep(2); return; }
        if (step === 2) {
            if (validateStep(2)) {
                role === "Employer" ? await nextStep() : setStep(3);
            }
            return;
        }
        if (step === 3 && role === "Alumni") { await nextStep(); return; }
        if ((step === 4 && role === "Alumni") || (step === 3 && role === "Employer")) {
            await handleVerifyAndSubmit();
            return;
        }
    };

    // ── Success Screen ──
    if (isComplete) {
        return (
            <div className={isModal ? "text-center py-2 animate-in fade-in zoom-in-95 duration-500" : "min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"}>
                <div className={isModal ? "w-full" : "max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-100/50 border border-emerald-50 p-10 text-center animate-in zoom-in-95 duration-500"}>
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-40" />
                        <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                        </div>
                    </div>
                    <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight mb-2">Registration Successful!</h1>
                    <p className="text-[14px] text-slate-500 mb-7 leading-relaxed">
                        {role === "Employer"
                            ? "Welcome aboard! Your employer account has been created and verified."
                            : "Welcome to the PLP Alumni community. Your account is ready to go."}
                    </p>
                    <Button
                        onClick={() => {
                            if (onSuccess) onSuccess();
                            else window.location.href = "/dashboard/alumni";
                        }}
                        className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white h-11 rounded-xl text-[14px] font-semibold transition-all shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 active:scale-[0.98]"
                    >
                        Continue to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={isModal ? "flex flex-col font-sans w-full" : "min-h-screen bg-slate-50 flex flex-col font-sans"}>
            {/* Header / Logo */}
            {!isModal && (
                <div className="py-8 px-6 flex justify-center">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/plp-logo.png" alt="PLP Logo" className="h-12 w-12 object-contain" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-slate-900 leading-none">Pamantasan ng Lungsod ng Pasig</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Alumni Portal</span>
                        </div>
                    </Link>
                </div>
            )}

            <main className={isModal ? "" : "flex-grow flex items-center justify-center px-6 pb-20"}>
                <div className={isModal ? "w-full relative" : "max-w-2xl w-full bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative"}>

                    {/* Decorative Elements */}
                    {!isModal && (
                        <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-tr-full -z-0 opacity-50" />
                        </>
                    )}

                    <div className={isModal ? "relative z-10" : "relative z-10 p-8 md:p-12"}>
                        <StepIndicator currentStep={step} role={role} compact={isModal} />

                        <form onSubmit={handleSubmit} className={isModal ? "" : "mt-8"}>
                            {/* Step 1: Account Information */}
                            {step === 1 && (
                                <FormSection title="Account Information" subtitle="Set up your login credentials">
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                                        <InputField
                                            label="Username" value={account.username}
                                            onChange={(v) => setAccount(p => ({ ...p, username: v }))}
                                            placeholder="jdelacruz2024" required icon={<User className="w-4 h-4" />}
                                            className="sm:col-span-2"
                                        />
                                        <InputField
                                            label="Email" value={account.email}
                                            onChange={(v) => setAccount(p => ({ ...p, email: v }))}
                                            type="email" placeholder="juan.delacruz@email.com" required
                                            icon={<Mail className="w-4 h-4" />}
                                            className="sm:col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InputField
                                            label="Password" value={account.password}
                                            onChange={(v) => setAccount(p => ({ ...p, password: v }))}
                                            type="password" placeholder="••••••••" required icon={<Lock className="w-4 h-4" />}
                                        />
                                        <InputField
                                            label="Confirm Password" value={account.confirmPassword}
                                            onChange={(v) => setAccount(p => ({ ...p, confirmPassword: v }))}
                                            type="password" placeholder="••••••••" required icon={<Lock className="w-4 h-4" />}
                                        />
                                    </div>
                                    <PasswordRequirements password={account.password} />
                                </FormSection>
                            )}

                            {/* Step 2: Personal Information (Alumni) */}
                            {step === 2 && role === "Alumni" && (
                                <FormSection title="Personal Information" subtitle="Tell us more about yourself">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InputField label="Firstname" value={personal.firstname}
                                            onChange={(v) => setPersonal(p => ({ ...p, firstname: v }))} placeholder="Juan" required />
                                        <InputField label="Lastname" value={personal.lastname}
                                            onChange={(v) => setPersonal(p => ({ ...p, lastname: v }))} placeholder="Dela Cruz" required />
                                    </div>
                                    <InputField label="Middlename" value={personal.middlename}
                                        onChange={(v) => setPersonal(p => ({ ...p, middlename: v }))} placeholder="Santos" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <SelectField label="Gender" value={personal.gender}
                                            onChange={(v) => setPersonal(p => ({ ...p, gender: v }))}
                                            options={["Male", "Female", "Non-binary", "Prefer not to say"]} required />
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-semibold text-slate-700 ml-0.5">
                                                Birthdate <span className="text-emerald-600">*</span>
                                            </label>
                                            <DatePicker
                                                date={personal.birthdate}
                                                onChange={(v: string) => setPersonal(p => ({ ...p, birthdate: v }))}
                                                placeholder="Select birthdate"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-700 ml-0.5 flex items-center gap-1.5">
                                            Age <span className="text-[11px] font-normal text-slate-400 normal-case tracking-normal">(auto-computed)</span>
                                        </label>
                                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-900 px-3.5 h-11 flex items-center gap-2 shadow-sm">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            {personal.age} {personal.age !== "—" && "years old"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-1">
                                        <input id="consent" type="checkbox" checked={consentForSurveyMl}
                                            onChange={(e) => setConsentForSurveyMl(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                        <label htmlFor="consent" className="text-[12px] text-slate-500 leading-relaxed">
                                            I consent to the use of my data for surveys and machine learning analysis.
                                        </label>
                                    </div>
                                </FormSection>
                            )}

                            {/* Step 2: Company Information (Employer) */}
                            {step === 2 && role === "Employer" && (
                                <FormSection title="Company Information" subtitle="Tell us about your organization">
                                    <InputField label="Company Name" value={employerInfo.companyName}
                                        onChange={(v) => setEmployerInfo(p => ({ ...p, companyName: v }))} placeholder="Acme Corp" required />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InputField label="Contact First Name" value={employerInfo.contactFirstName}
                                            onChange={(v) => setEmployerInfo(p => ({ ...p, contactFirstName: v }))} placeholder="John" required />
                                        <InputField label="Contact Last Name" value={employerInfo.contactLastName}
                                            onChange={(v) => setEmployerInfo(p => ({ ...p, contactLastName: v }))} placeholder="Doe" required />
                                    </div>
                                    <InputField label="Your Position / Title" value={employerInfo.position}
                                        onChange={(v) => setEmployerInfo(p => ({ ...p, position: v }))} placeholder="HR Manager" />

                                </FormSection>
                            )}

                            {/* Step 3: Academic Information (Alumni) */}
                            {step === 3 && role === "Alumni" && (
                                <FormSection title="Academic Information" subtitle="Help us track your career progress">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InputField label="Student ID" value={academic.studentId}
                                            onChange={(v) => setAcademic(p => ({ ...p, studentId: v }))} placeholder="2020-00000" required />
                                        <InputField label="Year Graduated" value={academic.yearGraduated}
                                            onChange={(v) => setAcademic(p => ({ ...p, yearGraduated: v }))} placeholder="2024" required />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InputField label="GWA/CGPA" value={academic.gwa}
                                            onChange={(v) => setAcademic(p => ({ ...p, gwa: v }))} placeholder="1.50" required />
                                        <InputField label="OJT Grade" value={academic.ojtGrade}
                                            onChange={(v) => setAcademic(p => ({ ...p, ojtGrade: v }))} placeholder="95" required />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InputField label="Avg. Prof Grade" value={academic.avgProfGrade}
                                            onChange={(v) => setAcademic(p => ({ ...p, avgProfGrade: v }))} placeholder="1.40" />
                                        <InputField label="Avg. Elec Grade" value={academic.avgElecGrade}
                                            onChange={(v) => setAcademic(p => ({ ...p, avgElecGrade: v }))} placeholder="1.60" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <SelectField label="Held Leadership Position?"
                                            value={academic.leadershipPos === null ? "" : academic.leadershipPos ? "yes" : "no"}
                                            onChange={(v) => setAcademic(p => ({ ...p, leadershipPos: v === "" ? null : v === "yes" }))}
                                            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                                        <SelectField label="Active Org Member?"
                                            value={academic.activeMemberPos === null ? "" : academic.activeMemberPos ? "yes" : "no"}
                                            onChange={(v) => setAcademic(p => ({ ...p, activeMemberPos: v === "" ? null : v === "yes" }))}
                                            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                                    </div>
                                    <SelectField label="Course" value={academic.courseAbbv}
                                        onChange={(v) => setAcademic(p => ({ ...p, courseAbbv: v }))}
                                        options={courses.map((c) => ({ value: c.course_abbv, label: c.course_name }))}
                                        required />
                                </FormSection>
                            )}

                            {/* Step 4: OTP Email Verification */}
                            {((step === 4 && role === "Alumni") || (step === 3 && role === "Employer")) && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="text-center">
                                        <div className="relative w-14 h-14 mx-auto mb-3.5">
                                            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse opacity-50" />
                                            <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                                <Mail className="w-6 h-6" strokeWidth={2.25} />
                                            </div>
                                        </div>
                                        <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight leading-tight">Verify your email</h2>
                                        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                                            We sent a 6-digit code to{" "}
                                            <span className="font-semibold text-slate-700">{maskEmail(account.email)}</span>
                                        </p>
                                    </div>

                                    <div className="py-3">
                                        <OTPInput value={otpCode} onChange={setOtpCode} disabled={isVerifyingOtp || isSubmitting} />
                                    </div>

                                    <div className="text-center space-y-3">
                                        <Button
                                            type="button"
                                            onClick={handleVerifyAndSubmit}
                                            disabled={isVerifyingOtp || isSubmitting || otpCode.join("").length !== OTP_LENGTH}
                                            className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 active:from-emerald-800 active:to-emerald-700 text-white h-11 rounded-xl font-semibold shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-emerald-700/25"
                                        >
                                            {isVerifyingOtp || isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {isSubmitting ? "Creating Account..." : "Verifying..."}
                                                </div>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                                    Verify &amp; Complete Registration
                                                </>
                                            )}
                                        </Button>

                                        <div className="flex items-center justify-center gap-1.5 text-[13px]">
                                            <span className="text-slate-400">Didn&apos;t receive the code?</span>
                                            {resendCooldown > 0 ? (
                                                <span className="text-slate-400 font-medium tabular-nums">Resend in {resendCooldown}s</span>
                                            ) : (
                                                <button type="button" onClick={handleResendOtp} disabled={isSendingOtp}
                                                    className="text-emerald-700 font-semibold hover:text-emerald-800 hover:underline disabled:opacity-50 transition-colors">
                                                    {isSendingOtp ? "Sending..." : "Resend Code"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form Navigation */}
                            <div className={`flex items-center justify-between ${isModal ? "mt-7 pt-5 border-t border-slate-100" : "mt-8 pt-6 border-t border-slate-100"}`}>
                                {step > 1 ? (
                                    <Button type="button" variant="ghost" onClick={prevStep}
                                        disabled={isVerifyingOtp || isSubmitting}
                                        className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-11 px-4 rounded-xl flex items-center gap-1.5 font-medium group/back">
                                        <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-0.5 transition-transform" /> Back
                                    </Button>
                                ) : (
                                    <>
                                        {onCancel ? (
                                            <Button type="button" variant="ghost" onClick={onCancel}
                                                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-11 px-4 rounded-xl font-medium">Cancel</Button>
                                        ) : (
                                            <Link href="/">
                                                <Button type="button" variant="ghost"
                                                    className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-11 px-4 rounded-xl font-medium">Cancel</Button>
                                            </Link>
                                        )}
                                    </>
                                )}

                                <div className="flex items-center gap-2">
                                    {step === 3 && role === "Alumni" && (
                                        <Button type="button" variant="ghost" onClick={handleSkipAcademic}
                                            disabled={isSendingOtp}
                                            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-11 px-4 rounded-xl font-medium">
                                            {isSendingOtp ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-slate-300/30 border-t-slate-400 rounded-full animate-spin" />
                                                    Sending...
                                                </div>
                                            ) : "Skip for now"}
                                        </Button>
                                    )}

                                    {((step < 3 && role === "Alumni") || (step < 2 && role === "Employer")) && (
                                        <Button type="button" onClick={nextStep}
                                            className="bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 active:from-emerald-800 active:to-emerald-700 text-white h-11 px-5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition-all duration-200 active:scale-[0.98] group">
                                            Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </Button>
                                    )}

                                    {((step === 3 && role === "Alumni") || (step === 2 && role === "Employer")) && (
                                        <Button type="button" onClick={nextStep} disabled={isSendingOtp}
                                            className="bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 active:from-emerald-800 active:to-emerald-700 text-white h-11 px-5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 group">
                                            {isSendingOtp ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Sending Code...
                                                </div>
                                            ) : (
                                                <>
                                                    Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>

                        {/* Already have an account? — modal */}
                        {isModal && (
                            <>
                                <div className="relative my-5">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200/80" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 bg-white">
                                            or
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[13px] text-center text-slate-500">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={onLoginClick}
                                        className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
                                    >
                                        Sign In here
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Already have an account? — full page */}
                {!isModal && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-sm text-slate-500 flex items-center gap-2 bg-white/50 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-sm">
                        Already have an account?
                        <Link href="/dashboard/alumni" className="text-emerald-700 font-bold hover:underline">
                            Sign In here
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
