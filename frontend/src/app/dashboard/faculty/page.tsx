import FacultyStatsGrid from "./_components/FacultyStatsGrid";
import PageHeader from "@/components/dashboard/PageHeader";
import FacultyQuickActions from "./_components/FacultyQuickActions";
import AlumniProgress from "./_components/AlumniProgress";
import PlacementOverview from "./_components/PlacementOverview";
import UpcomingSessions from "./_components/UpcomingSessions";
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

            {/* Alumni Cards + Placement Donut */}
            <div className="grid gap-5 lg:grid-cols-3">
                <AlumniProgress />
                <PlacementOverview />
            </div>

            {/* Sessions + Events */}
            <div className="grid gap-5 lg:grid-cols-2">
                <UpcomingSessions />
                <UpcomingFacultyEvents />
            </div>

            {/* Activity Feed + Quick Actions */}
            <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentAlumniActivity />
                </div>
                <div>
                    <FacultyQuickActions />
                </div>
            </div>
        </div>
    );
}
