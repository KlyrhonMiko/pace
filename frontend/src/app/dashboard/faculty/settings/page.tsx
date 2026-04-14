import PageHeader from "@/components/dashboard/PageHeader";

import { NotificationPreferences } from "./components/NotificationPreferences";
import { ProfileSettings } from "./components/ProfileSettings";
import { AccountSecurity } from "./components/AccountSecurity";
import { PrivacySettings } from "./components/PrivacySettings";
import { DangerZone } from "./components/DangerZone";

export default function FacultySettingsPage() {
    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <PageHeader
                title="Settings"
                description="Manage your professional profile, notifications, and account security."
                currentPage="Settings"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            />

            {/* ── Settings Grid ── */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* ─── Left Column ─── */}
                <div className="flex flex-col gap-6">
                    <ProfileSettings />
                    <NotificationPreferences />
                </div>

                {/* ─── Right Column ─── */}
                <div className="flex flex-col gap-6">
                    <AccountSecurity />
                    <PrivacySettings />
                </div>
            </div>

            {/* Danger Zone — Full width */}
            <DangerZone />
        </div>
    );
}
