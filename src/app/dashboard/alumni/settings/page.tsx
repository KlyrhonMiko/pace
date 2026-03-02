"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Bell,
    Shield,
    Mail,
    Download,
    AlertTriangle,
    Check,
    FileText,
    Eye,
    EyeOff,
    Briefcase,
    MessageSquare,
    Sparkles,
    CalendarDays,
    ChevronsUpDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// ─── Toggle Component ──────────────────────────────────────────────────────────

function Toggle({
    enabled,
    onChange,
    label,
    description,
}: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 group">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => onChange(!enabled)}
                className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2
                    ${enabled ? "bg-emerald-600" : "bg-gray-200"}
                `}
            >
                <span
                    className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
                        transition-transform duration-200 ease-in-out mt-0.5
                        ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}
                    `}
                />
            </button>
        </div>
    );
}

// ─── Select Component ──────────────────────────────────────────────────────────

function SelectField({
    label,
    value,
    onChange,
    options,
    description,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    description?: string;
}) {
    const selectedLabel = options.find((opt) => opt.value === value)?.label || "Select option...";
    const [open, setOpen] = useState(false);

    return (
        <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                    )}
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full sm:w-40 justify-between rounded-xl border-gray-300 text-sm font-normal text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <span className="truncate">{selectedLabel}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] sm:w-40 p-0 rounded-xl" align="end">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    {options.map((opt) => (
                                        <CommandItem
                                            key={opt.value}
                                            value={opt.value}
                                            onSelect={(currentValue) => {
                                                onChange(currentValue);
                                                setOpen(false);
                                            }}
                                            className="text-sm cursor-pointer rounded-lg"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === opt.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {opt.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

// ─── Section Card ──────────────────────────────────────────────────────────────

function SettingsCard({
    title,
    subtitle,
    icon,
    iconContainerClass,
    children,
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    iconContainerClass?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${iconContainerClass || "bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20"}`}
                >
                    {icon}
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-900">{title}</h2>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-2">{children}</div>
        </div>
    );
}

// ─── Save Indicator ────────────────────────────────────────────────────────────

function SaveIndicator({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Saved
        </span>
    );
}

// ─── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
    return <div className="border-t border-gray-100" />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    // ── Notification Preferences ──
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [systemUpdates, setSystemUpdates] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [notificationFrequency, setNotificationFrequency] = useState("daily");

    // ── Privacy Settings ──
    const [profileVisibility, setProfileVisibility] = useState("alumni");
    const [showEmail, setShowEmail] = useState(false);
    const [showEmployment, setShowEmployment] = useState(true);

    // ── Communication Preferences ──
    const [newsletter, setNewsletter] = useState(true);
    const [eventInvitations, setEventInvitations] = useState(true);
    const [mentorship, setMentorship] = useState(false);

    // ── Save flash states ──
    const [savedSection, setSavedSection] = useState<string | null>(null);

    const flashSaved = (section: string) => {
        setSavedSection(section);
        setTimeout(() => setSavedSection(null), 2000);
    };

    // ── Deactivate modal ──
    const [showDeactivate, setShowDeactivate] = useState(false);

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-4">
                        <Link
                            href="/dashboard/alumni"
                            className="hover:text-gray-600 transition-colors"
                        >
                            Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                        <span className="text-gray-600">Settings</span>
                    </nav>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                                Settings
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your notifications, privacy, preferences, and account settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Settings Grid ── */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* ─── Left Column ─── */}
                <div className="flex flex-col gap-6">
                    {/* 1. Notification Preferences */}
                    <SettingsCard
                        title="Notification Preferences"
                        subtitle="Control how and when you receive notifications"
                        icon={<Bell size={18} />}
                        iconContainerClass="bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20"
                    >
                        <Toggle
                            label="Email Notifications"
                            description="Receive notifications via email"
                            enabled={emailNotifications}
                            onChange={(v) => {
                                setEmailNotifications(v);
                                flashSaved("notifications");
                            }}
                        />
                        <Divider />
                        <div className={`pl-4 border-l-2 border-gray-100 space-y-0 transition-opacity duration-200 ${emailNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                            <Toggle
                                label="Event Reminders"
                                description="Upcoming events and registration deadlines"
                                enabled={eventReminders}
                                onChange={(v) => {
                                    setEventReminders(v);
                                    flashSaved("notifications");
                                }}
                            />
                            <Toggle
                                label="System Updates"
                                description="Platform updates and announcements"
                                enabled={systemUpdates}
                                onChange={(v) => {
                                    setSystemUpdates(v);
                                    flashSaved("notifications");
                                }}
                            />
                        </div>
                        <Divider />
                        <Toggle
                            label="Push Notifications"
                            description="Receive browser push notifications"
                            enabled={pushNotifications}
                            onChange={(v) => {
                                setPushNotifications(v);
                                flashSaved("notifications");
                            }}
                        />
                        <Divider />
                        <SelectField
                            label="Notification Frequency"
                            description="How often you want to receive email digests"
                            value={notificationFrequency}
                            onChange={(v) => {
                                setNotificationFrequency(v);
                                flashSaved("notifications");
                            }}
                            options={[
                                { value: "instant", label: "Instant" },
                                { value: "daily", label: "Daily Digest" },
                                { value: "weekly", label: "Weekly Digest" },
                            ]}
                        />
                        <div className="flex justify-end py-2">
                            <SaveIndicator show={savedSection === "notifications"} />
                        </div>
                    </SettingsCard>

                    {/* 5. Data & Export */}
                    <SettingsCard
                        title="Data & Export"
                        subtitle="Download or export your account data"
                        icon={<Download size={18} />}
                        iconContainerClass="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
                    >
                        <div className="flex flex-col sm:flex-row gap-3 py-3">
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex-1">
                                <Download size={16} className="text-gray-500" />
                                Download My Data
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex-1">
                                <FileText size={16} className="text-gray-500" />
                                Export Profile as PDF
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 pb-3 leading-relaxed">
                            Your data will be compiled and available for download. This may take a few moments.
                        </p>
                    </SettingsCard>
                </div>

                {/* ─── Right Column ─── */}
                <div className="flex flex-col gap-6">
                    {/* 2. Privacy Settings */}
                    <SettingsCard
                        title="Privacy Settings"
                        subtitle="Control who can see your information"
                        icon={<Shield size={18} />}
                        iconContainerClass="bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
                    >
                        <SelectField
                            label="Profile Visibility"
                            description="Who can view your profile information"
                            value={profileVisibility}
                            onChange={(v) => {
                                setProfileVisibility(v);
                                flashSaved("privacy");
                            }}
                            options={[
                                { value: "public", label: "Public" },
                                { value: "alumni", label: "Alumni Only" },
                                { value: "private", label: "Private" },
                            ]}
                        />
                        <Divider />
                        <div className="flex items-center gap-2 py-3">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${showEmail ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                                {showEmail ? <Eye size={14} /> : <EyeOff size={14} />}
                            </div>
                            <div className="flex-1">
                                <Toggle
                                    label="Show Email Address"
                                    description="Allow other alumni to see your email"
                                    enabled={showEmail}
                                    onChange={(v) => {
                                        setShowEmail(v);
                                        flashSaved("privacy");
                                    }}
                                />
                            </div>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2 py-0">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${showEmployment ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                                <Briefcase size={14} />
                            </div>
                            <div className="flex-1">
                                <Toggle
                                    label="Show Employment Status"
                                    description="Display your current employment on your profile"
                                    enabled={showEmployment}
                                    onChange={(v) => {
                                        setShowEmployment(v);
                                        flashSaved("privacy");
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end py-2">
                            <SaveIndicator show={savedSection === "privacy"} />
                        </div>
                    </SettingsCard>

                    {/* 4. Communication Preferences */}
                    <SettingsCard
                        title="Communication Preferences"
                        subtitle="Manage the types of communications you receive"
                        icon={<Mail size={18} />}
                        iconContainerClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
                    >
                        <div className="flex items-center gap-2 py-0">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${newsletter ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                                <MessageSquare size={14} />
                            </div>
                            <div className="flex-1">
                                <Toggle
                                    label="Alumni Newsletter"
                                    description="Monthly updates from the alumni community"
                                    enabled={newsletter}
                                    onChange={(v) => {
                                        setNewsletter(v);
                                        flashSaved("communication");
                                    }}
                                />
                            </div>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2 py-0">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${eventInvitations ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                                <CalendarDays size={14} />
                            </div>
                            <div className="flex-1">
                                <Toggle
                                    label="Event Invitations"
                                    description="Invitations to alumni events and reunions"
                                    enabled={eventInvitations}
                                    onChange={(v) => {
                                        setEventInvitations(v);
                                        flashSaved("communication");
                                    }}
                                />
                            </div>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2 py-0">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${mentorship ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                                <Sparkles size={14} />
                            </div>
                            <div className="flex-1">
                                <Toggle
                                    label="Mentorship Opportunities"
                                    description="Invitations to mentor or be mentored"
                                    enabled={mentorship}
                                    onChange={(v) => {
                                        setMentorship(v);
                                        flashSaved("communication");
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end py-2">
                            <SaveIndicator show={savedSection === "communication"} />
                        </div>
                    </SettingsCard>
                </div>
            </div>

            {/* 6. Danger Zone — Full width */}
            <div className="rounded-2xl bg-white border border-red-200/60 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-red-100/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/20">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Danger Zone</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Irreversible actions — proceed with caution
                        </p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Deactivate Account
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Temporarily disable your account. You can reactivate it anytime by logging in again.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeactivate(true)}
                            className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-150"
                        >
                            Deactivate Account
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Deactivation Confirmation Modal ── */}
            {showDeactivate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowDeactivate(false)}
                    />
                    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Deactivate Account?
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Are you sure you want to deactivate your account? Your profile will be hidden
                            from other alumni and recruiters. You can reactivate by logging in again.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setShowDeactivate(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowDeactivate(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors duration-150 shadow-sm"
                            >
                                Yes, Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
