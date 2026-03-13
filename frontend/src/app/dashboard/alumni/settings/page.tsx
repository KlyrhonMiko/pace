import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { NotificationPreferences } from "./components/NotificationPreferences";
import { DataExport } from "./components/DataExport";
import { PrivacySettings } from "./components/PrivacySettings";
import { CommunicationPreferences } from "./components/CommunicationPreferences";
import { DangerZone } from "./components/DangerZone";

export default function SettingsPage() {
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
                    <NotificationPreferences />
                    <DataExport />
                </div>

                {/* ─── Right Column ─── */}
                <div className="flex flex-col gap-6">
                    <PrivacySettings />
                    <CommunicationPreferences />
                </div>
            </div>

            {/* 6. Danger Zone — Full width */}
            <DangerZone />
        </div>
    );
}
