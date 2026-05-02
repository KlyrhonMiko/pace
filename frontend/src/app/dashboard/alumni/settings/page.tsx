import PageHeader from "@/components/dashboard/PageHeader";

import { NotificationPreferences } from "./components/NotificationPreferences";
import { DataExport } from "./components/DataExport";
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
                </div>

                {/* ─── Right Column ─── */}
                <div className="flex flex-col gap-6">
                    <DataExport />
                    <DangerZone />
                </div>
            </div>
        </div>
    );
}
