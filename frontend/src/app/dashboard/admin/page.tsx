"use client";

import { useEffect, useState } from "react";
import { fetchAdminStats, AdminStats } from "../_lib/dashboard";
import AdminStatsGrid from "./_components/AdminStatsGrid";
import PageHeader from "@/components/dashboard/PageHeader";
import AdminQuickActions from "./_components/AdminQuickActions";
import UserGrowthChart from "./_components/UserGrowthChart";
import UserDistribution from "./_components/UserDistribution";
import RecentRegistrations from "./_components/RecentRegistrations";
import PlatformHealth from "./_components/PlatformHealth";
import PlatformActivity from "./_components/PlatformActivity";

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                const data = await fetchAdminStats();
                if (isMounted && data) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Dashboard load failed:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();
        return () => { isMounted = false; };
    }, []);


    return (
        <div className="space-y-5">
            <PageHeader
                title="Platform Overview"
                description="Monitor users, approvals, and platform performance at a glance."
                currentPage="Overview"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            />

            {/* Dark Metrics Strip */}
            <AdminStatsGrid stats={stats || undefined} />

            {/* Charts Row */}
            <div className="grid gap-5 lg:grid-cols-2">
                <UserGrowthChart data={stats?.registration_trend || []} isLoading={loading} />
                <UserDistribution distribution={stats?.user_distribution || []} isLoading={loading} />
            </div>

            {/* Registrations + Quick Actions */}
            <div className="grid gap-5 lg:grid-cols-3">
                <RecentRegistrations registrations={stats?.recent_registrations || []} isLoading={loading} />
                <AdminQuickActions />
            </div>

            {/* Health + Activity */}
            <div className="grid gap-5 lg:grid-cols-2 items-start">
                <PlatformHealth health={stats?.system_health || { uptime: '...', latency: '...', db_load: 0, cache_status: '...' }} isLoading={loading} />
                <PlatformActivity activities={stats?.activity_log || []} isLoading={loading} />
            </div>
        </div>
    );
}
