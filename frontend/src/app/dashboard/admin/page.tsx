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

    if (loading) {
        return (
            <div className="space-y-5">
                {/* Skeleton: Page Header */}
                <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                    <div className="h-8 w-64 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="h-4 w-96 rounded bg-gray-100 animate-pulse" />
                </div>

                {/* Skeleton: Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[100px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100 animate-pulse" />
                    ))}
                </div>

                {/* Skeleton: Charts Row */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="h-[320px] rounded-2xl bg-white border border-gray-100 animate-pulse">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="space-y-1.5">
                                    <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
                                    <div className="h-2.5 w-24 rounded bg-gray-100 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-40 rounded-xl bg-gray-50 animate-pulse" />
                        </div>
                    </div>
                    <div className="h-[320px] rounded-2xl bg-white border border-gray-100 animate-pulse">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
                                <div className="space-y-1.5">
                                    <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
                                    <div className="h-2.5 w-24 rounded bg-gray-100 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-40 rounded-xl bg-gray-50 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Skeleton: Registrations + Quick Actions */}
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="lg:col-span-2 h-[280px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
                    <div className="h-[280px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
                </div>

                {/* Skeleton: Health + Activity */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="h-[240px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
                    <div className="h-[240px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!stats) return null;

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
            <AdminStatsGrid stats={stats} />

            {/* Charts Row */}
            <div className="grid gap-5 lg:grid-cols-2">
                <UserGrowthChart data={stats.registration_trend} />
                <UserDistribution distribution={stats.user_distribution} />
            </div>

            {/* Registrations + Quick Actions */}
            <div className="grid gap-5 lg:grid-cols-3">
                <RecentRegistrations registrations={stats.recent_registrations} />
                <AdminQuickActions />
            </div>

            {/* Health + Activity */}
            <div className="grid gap-5 lg:grid-cols-2">
                <PlatformHealth health={stats.system_health} />
                <PlatformActivity activities={stats.activity_log} />
            </div>
        </div>
    );
}
