"use client";

import { useState, useEffect } from "react";
import { Shield, Key, Loader2, Check, AlertCircle } from "lucide-react";
import { SettingsCard, Toggle, Divider, SaveIndicator } from "./SettingsUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "../../../../../lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const STORAGE_KEY = "pace_staff_security_prefs";

export function AccountSecurity() {
    const { user } = useAuth();
    const [twoFactor, setTwoFactor] = useState(false);
    const [loginAlerts, setLoginAlerts] = useState(true);
    const [saved, setSaved] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Password Change State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const savedPrefs = localStorage.getItem(STORAGE_KEY);
        if (savedPrefs) {
            try {
                const parsed = JSON.parse(savedPrefs);
                setTwoFactor(parsed.twoFactor ?? false);
                setLoginAlerts(parsed.loginAlerts ?? true);
            } catch (e) {
                console.error("Failed to parse security prefs", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            const prefs = { twoFactor, loginAlerts };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            flashSaved();
        }
    }, [twoFactor, loginAlerts, isLoaded]);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handlePasswordUpdate = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsUpdating(true);
        try {
            const res = await apiFetch<any>(`/users/${user?.user_id}`, {
                method: "PATCH",
                body: {
                    current_password: currentPassword,
                    password: newPassword
                }
            });

            if (res.success) {
                toast.success("Password updated successfully");
                setIsChangingPassword(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(res.message || "Failed to update password");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred while updating password");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <SettingsCard
            title="Account Security"
            subtitle="Manage your password and security settings"
            icon={<Shield size={18} />}
            iconContainerClass="bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-emerald-500/20"
        >
            <div className="py-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Password</p>
                        <p className="text-xs text-gray-500 mt-0.5">Secure your account with a strong password</p>
                    </div>
                    {!isChangingPassword && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsChangingPassword(true)}
                            className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                        >
                            <Key size={14} className="mr-2" />
                            Change Password
                        </Button>
                    )}
                </div>

                {isChangingPassword && (
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                            <Input 
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="h-10 bg-white border-slate-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                                <Input 
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-10 bg-white border-slate-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm New</label>
                                <Input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-10 bg-white border-slate-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsChangingPassword(false)}
                                className="text-slate-500 font-bold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handlePasswordUpdate}
                                disabled={isUpdating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5"
                            >
                                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : "Update Password"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <Divider />
            <Toggle
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                enabled={twoFactor}
                onChange={(v) => {
                    setTwoFactor(v);
                }}
            />
            <Divider />
            <Toggle
                label="Login Alerts"
                description="Get notified of new login attempts from unrecognized devices"
                enabled={loginAlerts}
                onChange={(v) => {
                    setLoginAlerts(v);
                }}
            />
            <div className="flex justify-end py-2">
                <SaveIndicator show={saved} />
            </div>
        </SettingsCard>
    );
}
