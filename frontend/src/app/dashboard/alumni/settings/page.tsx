import PageHeader from "@/components/dashboard/PageHeader";

import { NotificationPreferences } from "./components/NotificationPreferences";
import { DataExport } from "./components/DataExport";
import { PrivacySettings } from "./components/PrivacySettings";
import { CommunicationPreferences } from "./components/CommunicationPreferences";
import { DangerZone } from "./components/DangerZone";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <PageHeader
                title="Settings"
                description="Manage your notifications, privacy, preferences, and account settings."
                currentPage="Settings"
            />

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
