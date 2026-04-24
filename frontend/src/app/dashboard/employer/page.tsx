"use client";

import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import EmployerStatsGrid from "./_components/EmployerStatsGrid";
import EmployerRecentApplications from "./_components/EmployerRecentApplications";
import EmployerHiringActivity from "./_components/EmployerHiringActivity";
import EmployerQuickActions from "./_components/EmployerQuickActions";

import { useRouter } from "next/navigation";

export default function EmployerOverview() {
    const router = useRouter();

    return (
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-emerald-100 opacity-30 blur-3xl" />
                <div className="absolute bottom-20 right-1/4 h-48 w-48 rounded-full bg-teal-100 opacity-30 blur-3xl" />
            </div>

            <div className="relative space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Employer Overview"
                    description="Monitor your hiring pipeline and job posting performance."
                    currentPage="Overview"
                    dashboardHref="/dashboard/employer"
                    dashboardName="Employer Dashboard"
                />


                {/* Stats Grid */}
                <EmployerStatsGrid />

                {/* Main Content Details Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                    <div className="lg:col-span-2">
                        <EmployerRecentApplications />
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <EmployerQuickActions />
                        <EmployerHiringActivity />
                    </div>
                </div>
            </div>
        </div>
    );
}
