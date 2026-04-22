import { PlusCircle } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import EmployerStatsGrid from "./_components/EmployerStatsGrid";
import EmployerRecentApplications from "./_components/EmployerRecentApplications";
import EmployerHiringActivity from "./_components/EmployerHiringActivity";

export default function EmployerOverview() {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Employer Overview"
                description="Monitor your hiring pipeline and job posting performance."
                currentPage="Overview"
                dashboardHref="/dashboard/employer"
                dashboardName="Employer Dashboard"
            >
                <Link
                    href="/dashboard/employer/jobs"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 transition-all active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    Post New Job
                </Link>
            </PageHeader>

            {/* Stats Grid */}
            <EmployerStatsGrid />

            {/* Main Content Details Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <EmployerRecentApplications />
                <EmployerHiringActivity />
            </div>
        </div>
    );
}
