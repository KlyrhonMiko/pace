"use client";

import { ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function AdminSecurity() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false);
        setShowNew(false);
        setError("");
        setSuccess(false);
    };

    const handleOpen = () => {
        reset();
        setIsOpen(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }
        if (!user?.user_id) {
            setError("Session error — please log in again.");
            return;
        }

        setLoading(true);
        try {
            await apiFetch(`/users/${user.user_id}`, {
                method: "PATCH",
                body: {
                    current_password: currentPassword,
                    password: newPassword,
                },
            });
            setSuccess(true);
            toast.success("Password changed successfully");
            setTimeout(() => {
                setIsOpen(false);
                reset();
            }, 1500);
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : "Failed to change password";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const PasswordInput = ({
        id,
        label,
        value,
        onChange,
        show,
        onToggle,
        placeholder,
        autoComplete,
    }: {
        id: string;
        label: string;
        value: string;
        onChange: (v: string) => void;
        show: boolean;
        onToggle: () => void;
        placeholder?: string;
        autoComplete?: string;
    }) => (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-gray-500/20">
                    <ShieldCheck className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Account Security</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Protect your administrative credentials</p>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
                {/* Change Password Row */}
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 ring-1 ring-gray-100/60 group-hover:bg-gray-900 group-hover:text-white transition-all">
                            <Lock className="w-5 h-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-gray-800">Change Password</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Update your account password regularly</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpen}
                        className="text-[11px] font-bold text-gray-900 hover:text-emerald-700 transition-colors"
                    >
                        Update
                    </button>
                </div>

                {/* Inline Password Change Form */}
                {isOpen && (
                    <form
                        onSubmit={handleSubmit}
                        className="mt-1 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-4"
                    >
                        {success ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                                <p className="text-sm font-semibold text-gray-800">Password changed!</p>
                            </div>
                        ) : (
                            <>
                                <PasswordInput
                                    id="current-password"
                                    label="Current Password"
                                    value={currentPassword}
                                    onChange={setCurrentPassword}
                                    show={showCurrent}
                                    onToggle={() => setShowCurrent(!showCurrent)}
                                    placeholder="Enter your current password"
                                    autoComplete="current-password"
                                />
                                <PasswordInput
                                    id="new-password"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={setNewPassword}
                                    show={showNew}
                                    onToggle={() => setShowNew(!showNew)}
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                />
                                <PasswordInput
                                    id="confirm-password"
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    show={showNew}
                                    onToggle={() => setShowNew(!showNew)}
                                    placeholder="Repeat new password"
                                    autoComplete="new-password"
                                />

                                {error && (
                                    <p className="text-[11px] text-rose-600 font-medium rounded-lg bg-rose-50 px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gray-900 text-white text-[11px] font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                                    >
                                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        {loading ? "Updating…" : "Update Password"}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
