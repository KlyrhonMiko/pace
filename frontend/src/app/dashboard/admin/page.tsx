import AdminStatsGrid from "./_components/AdminStatsGrid";
import AdminQuickActions from "./_components/AdminQuickActions";
import UserGrowthChart from "./_components/UserGrowthChart";
import UserDistribution from "./_components/UserDistribution";
import RecentRegistrations from "./_components/RecentRegistrations";
import PlatformHealth from "./_components/PlatformHealth";
import PlatformActivity from "./_components/PlatformActivity";

export default function AdminDashboard() {
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-sm text-gray-500">Monitor users, approvals, and platform performance at a glance.</p>
            </div>

            {/* Dark Metrics Strip */}
            <AdminStatsGrid />

            {/* Charts Row */}
            <div className="grid gap-5 lg:grid-cols-2">
                <UserGrowthChart />
                <UserDistribution />
            </div>

            {/* Registrations + Quick Actions */}
            <div className="grid gap-5 lg:grid-cols-3">
                <RecentRegistrations />
                <AdminQuickActions />
            </div>

            {/* Health + Activity */}
            <div className="grid gap-5 lg:grid-cols-2">
                <PlatformHealth />
                <PlatformActivity />
            </div>
        </div>
    );
}
