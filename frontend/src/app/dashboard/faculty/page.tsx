import FacultyStatsGrid from "./_components/FacultyStatsGrid";
import PageHeader from "@/components/dashboard/PageHeader";
import FacultyQuickActions from "./_components/FacultyQuickActions";
import AlumniProgress from "./_components/AlumniProgress";
import PlacementOverview from "./_components/PlacementOverview";

import UpcomingFacultyEvents from "./_components/UpcomingFacultyEvents";
import RecentAlumniActivity from "./_components/RecentAlumniActivity";

export default function FacultyDashboard() {
    return (
        <div className="space-y-5">
            <PageHeader
                title="Faculty Overview"
                description="Track alumni progress, manage sessions, and monitor placements."
                currentPage="Overview"
                dashboardHref="/dashboard/faculty"
                dashboardName="Faculty Dashboard"
            />

            {/* Stats - mixed sizes */}
            <FacultyStatsGrid />

            {/* Two-Column Vertical Stacks - Synchronized Height */}
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 items-stretch">
                {/* Left Stack (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <AlumniProgress />
                    <div className="flex-1 min-h-0">
                        <RecentAlumniActivity />
                    </div>
                </div>

                {/* Right Stack (1/3 width) */}
                <div className="lg:col-span-1 flex flex-col gap-5">
                    <PlacementOverview />
                    <UpcomingFacultyEvents />
                    <FacultyQuickActions />
                </div>
            </div>
        </div>
    );
}
