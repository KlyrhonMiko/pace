"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/dashboard/PageHeader";
import { User, Settings, Lock, Loader2, Check, Pencil, Shield, Mail, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    iconContainerClass?: string;
    loading?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg", iconContainerClass)}>
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
    icon: Icon,
}: {
    label: string;
    value: string | number;
    onChange?: (v: string) => void;
    type?: string;
    readOnly?: boolean;
    editing?: boolean;
    placeholder?: string;
    required?: boolean;
    icon?: any;
}) {
    const isReadOnly = readOnly || !editing;

    const baseInput = "w-full rounded-xl border text-sm px-3.5 py-2.5 transition-all duration-150 outline-none flex items-center gap-2 ";
    const readonlyClass = "bg-gray-50 border-gray-200 text-gray-500 cursor-default select-none";
    const editableClass = "bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            <div className={cn(baseInput, isReadOnly ? readonlyClass : editableClass)}>
                {Icon && <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isReadOnly ? "text-gray-400" : "text-emerald-600")} strokeWidth={2} />}
                <input
                    type={type}
                    value={value as string}
                    onChange={(e) => onChange?.(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder={isReadOnly ? "—" : placeholder}
                    className="w-full bg-transparent outline-none border-none p-0 text-inherit focus:ring-0"
                />
            </div>
        </div>
    );
}

function PasswordRequirements({ password }: { password: string }) {
    const requirements = [
        { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
        { label: "At least one uppercase", test: (p: string) => /[A-Z]/.test(p) },
        { label: "At least one lowercase", test: (p: string) => /[a-z]/.test(p) },
        { label: "At least one number", test: (p: string) => /\d/.test(p) },
    ];

    return (
        <div className={cn(
            "rounded-xl p-3 border transition-all duration-300 mt-2",
            password ? "bg-emerald-50/30 border-emerald-100/50" : "bg-gray-50/50 border-gray-100"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-wider mb-2",
                password ? "text-emerald-800/60" : "text-gray-400"
            )}>Password Requirements</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {requirements.map((req, i) => {
                    const met = req.test(password);
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn(
                                "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300",
                                met ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                            )}>
                                <Check size={8} strokeWidth={4} />
                            </div>
                            <span className={cn(
                                "text-[11px] font-medium transition-colors duration-300",
                                met ? "text-emerald-700" : "text-gray-500"
                            )}>
                                {req.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [editingPersonal, setEditingPersonal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);

    const [fullUser, setFullUser] = useState<any>(null);
    const [personalDraft, setPersonalDraft] = useState({
        first_name: "",
        last_name: ""
    });
    const [accountDraft, setAccountDraft] = useState({
        email: ""
    });
    const [passwordDraft, setPasswordDraft] = useState({
        current_password: "",
        password: "",
        confirm_password: ""
    });

    useEffect(() => {
        async function fetchFullProfile() {
            if (!user?.user_id) return;
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${user.user_id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success) {
                    setFullUser(result.data);
                    setPersonalDraft({
                        first_name: result.data.first_name || "",
                        last_name: result.data.last_name || ""
                    });
                    setAccountDraft({
                        email: result.data.email || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching full profile:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchFullProfile();
    }, [user?.user_id]);

    const handleSavePersonal = async () => {
        if (!user?.user_id) return;
        setIsSavingPersonal(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${user.user_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(personalDraft)
            });
            const result = await response.json();
            if (result.success) {
                setFullUser({ ...fullUser, ...personalDraft });
                updateUser(personalDraft);
                setEditingPersonal(false);
                toast.success("Personal information updated");
            } else {
                toast.error(result.message || "Failed to update personal info");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSavingPersonal(false);
        }
    };

    const handleSaveAccount = async () => {
        if (!user?.user_id) return;
        setIsSavingAccount(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${user.user_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(accountDraft)
            });
            const result = await response.json();
            if (result.success) {
                setFullUser({ ...fullUser, ...accountDraft });
                setEditingAccount(false);
                toast.success("Account information updated");
            } else {
                toast.error(result.message || "Failed to update account info");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSavingAccount(false);
        }
    };

    const handleSavePassword = async () => {
        if (!user?.user_id) return;
        
        if (!passwordDraft.current_password) {
            toast.error("Current password is required");
            return;
        }

        if (passwordDraft.password !== passwordDraft.confirm_password) {
            toast.error("New passwords do not match");
            return;
        }

        if (passwordDraft.password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsSavingPassword(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${user.user_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passwordDraft.current_password,
                    password: passwordDraft.password
                })
            });
            const result = await response.json();
            if (result.success) {
                setEditingPassword(false);
                setPasswordDraft({ current_password: "", password: "", confirm_password: "" });
                toast.success("Password updated successfully");
            } else {
                toast.error(result.message || "Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admin Profile"
                description="View and manage your system administrator profile."
                currentPage="Profile"
            />

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column - takes 7 cols */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* ── Personal Information ── */}
                    <SectionCard
                        title="Personal Information"
                        subtitle="Basic profile details"
                        editable
                        editing={editingPersonal}
                        onEdit={() => setEditingPersonal(true)}
                        onSave={handleSavePersonal}
                        onCancel={() => {
                            setEditingPersonal(false);
                            setPersonalDraft({ first_name: fullUser.first_name, last_name: fullUser.last_name });
                        }}
                        loading={isSavingPersonal}
                        icon={<User size={18} />}
                        iconContainerClass="bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="First Name"
                                value={personalDraft.first_name}
                                onChange={(v) => setPersonalDraft({ ...personalDraft, first_name: v })}
                                editing={editingPersonal}
                                placeholder="Enter first name"
                                required
                            />
                            <Field
                                label="Last Name"
                                value={personalDraft.last_name}
                                onChange={(v) => setPersonalDraft({ ...personalDraft, last_name: v })}
                                editing={editingPersonal}
                                placeholder="Enter last name"
                                required
                            />
                        </div>
                    </SectionCard>

                    {/* ── Security & Password ── */}
                    <SectionCard
                        title="Security & Password"
                        subtitle="Manage your account security"
                        editable
                        editing={editingPassword}
                        onEdit={() => setEditingPassword(true)}
                        onSave={handleSavePassword}
                        onCancel={() => {
                            setEditingPassword(false);
                            setPasswordDraft({ current_password: "", password: "", confirm_password: "" });
                        }}
                        loading={isSavingPassword}
                        icon={<Lock size={18} />}
                        iconContainerClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/20"
                    >
                        <div className="space-y-4">
                            <Field
                                label="Current Password"
                                value={passwordDraft.current_password}
                                onChange={(v) => setPasswordDraft({ ...passwordDraft, current_password: v })}
                                type="password"
                                editing={editingPassword}
                                placeholder="••••••••"
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field
                                    label="New Password"
                                    value={passwordDraft.password}
                                    onChange={(v) => setPasswordDraft({ ...passwordDraft, password: v })}
                                    type="password"
                                    editing={editingPassword}
                                    placeholder="••••••••"
                                    required
                                />
                                <Field
                                    label="Confirm New Password"
                                    value={passwordDraft.confirm_password}
                                    onChange={(v) => setPasswordDraft({ ...passwordDraft, confirm_password: v })}
                                    type="password"
                                    editing={editingPassword}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {editingPassword && <PasswordRequirements password={passwordDraft.password} />}
                        </div>
                    </SectionCard>
                </div>

                {/* Right Column - takes 5 cols */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* ── Account Information ── */}
                    <SectionCard
                        title="Account Information"
                        subtitle="System access and security"
                        editable
                        editing={editingAccount}
                        onEdit={() => setEditingAccount(true)}
                        onSave={handleSaveAccount}
                        onCancel={() => {
                            setEditingAccount(false);
                            setAccountDraft({ email: fullUser.email });
                        }}
                        loading={isSavingAccount}
                        icon={<Settings size={18} />}
                        iconContainerClass="bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20"
                    >
                        <div className="space-y-4">
                            <Field
                                label="Email Address"
                                value={accountDraft.email}
                                onChange={(v) => setAccountDraft({ email: v })}
                                editing={editingAccount}
                                placeholder="admin@example.com"
                                icon={Mail}
                                required
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Username
                                </label>
                                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 py-2.5 flex items-center gap-2">
                                    <Fingerprint className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                    {fullUser?.username}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    User ID
                                </label>
                                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 py-2.5 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                    {fullUser?.user_id}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Access Level
                                </label>
                                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-emerald-600 font-medium px-3.5 py-2.5 flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                                    Full System Access
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
