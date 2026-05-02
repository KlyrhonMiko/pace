"use client";

import { Settings2, ShieldAlert, Globe } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface PlatformSettings {
    maintenance_mode: boolean;
    public_registrations: boolean;
}

export function PlatformConfiguration() {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await apiFetch<{ data: PlatformSettings }>("/settings/platform");
            setSettings(res.data);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleToggle = async (key: keyof PlatformSettings) => {
        if (!settings || saving) return;
        const newValue = !settings[key];

        // Optimistic update
        setSettings((prev) => prev ? { ...prev, [key]: newValue } : prev);
        setSaving(true);

        try {
            const res = await apiFetch<{ data: PlatformSettings }>("/settings/platform", {
                method: "PATCH",
                body: { [key]: newValue },
            });
            setSettings(res.data);
            toast.success(
                key === "maintenance_mode"
                    ? newValue ? "Maintenance mode enabled" : "Maintenance mode disabled"
                    : newValue ? "Public registrations enabled" : "Public registrations disabled"
            );
        } catch (err) {
            // Revert on failure
            setSettings((prev) => prev ? { ...prev, [key]: !newValue } : prev);
            toast.error(err instanceof ApiError ? err.message : "Failed to save setting");
        } finally {
            setSaving(false);
        }
    };

    const ToggleSwitch = ({
        checked,
        onChange,
        disabled,
    }: {
        checked: boolean;
        onChange: () => void;
        disabled: boolean;
    }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                checked ? "bg-emerald-600" : "bg-gray-200"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );

    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Settings2 className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Platform Configuration</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Control global behavior and accessibility</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {loading ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-36 rounded bg-gray-100 animate-pulse" />
                                    <div className="h-2.5 w-52 rounded bg-gray-50 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-gray-100 animate-pulse" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
                                    <div className="h-2.5 w-48 rounded bg-gray-50 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-gray-100 animate-pulse" />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 ring-1 ring-amber-100/60 transition-transform group-hover:scale-110">
                                    <ShieldAlert className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-gray-800">Maintenance Mode</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Restrict platform access to administrators only</p>
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings?.maintenance_mode ?? false}
                                onChange={() => handleToggle("maintenance_mode")}
                                disabled={saving}
                            />
                        </div>

                        {/* Public Registration */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 ring-1 ring-blue-100/60 transition-transform group-hover:scale-110">
                                    <Globe className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-gray-800">Public Registrations</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Allow new users to sign up via the landing page</p>
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings?.public_registrations ?? true}
                                onChange={() => handleToggle("public_registrations")}
                                disabled={saving}
                            />
                        </div>
                    </>
                )}
            </div>

            {!loading && saving && (
                <div className="px-6 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-[11px] text-gray-400">Saving…</p>
                </div>
            )}
        </div>
    );
}
