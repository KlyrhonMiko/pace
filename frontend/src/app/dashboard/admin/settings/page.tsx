import PageHeader from "@/components/dashboard/PageHeader";
import { PlatformConfiguration } from "./components/PlatformConfiguration";
import { SystemData } from "./components/SystemData";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Platform Settings"
                description="Configure global platform behavior, manage system data, and secure your administrative account."
                currentPage="Settings"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            />

            <div className="grid gap-6 lg:grid-cols-5 items-start">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <PlatformConfiguration />
                </div>
                <div className="flex flex-col gap-6 lg:col-span-3">
                    <SystemData />
                </div>
            </div>
        </div>
    );
}
