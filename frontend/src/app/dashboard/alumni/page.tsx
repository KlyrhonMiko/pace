import DashboardHeader from "@/app/dashboard/alumni/_components/DashboardHeader";
import PageHeader from "@/components/dashboard/PageHeader";
import EmployabilityScore from "@/app/dashboard/alumni/_components/EmployabilityScore";
import RecommendedJobs from "@/app/dashboard/alumni/jobs/_components/RecommendedJobs";
import ProfileStrength from "@/app/dashboard/alumni/_components/ProfileStrength";
import QuickActions from "@/app/dashboard/alumni/_components/QuickActions";
import UpcomingEvents from "@/app/dashboard/alumni/events/_components/UpcomingEvents";
import RecentActivity from "@/app/dashboard/alumni/_components/RecentActivity";
import { cookies } from "next/headers";
import { getLatestPrediction } from "@/app/dashboard/alumni/_lib/api";
import { getMyProfile } from "@/app/dashboard/alumni/profile/_lib/api";

export default async function AlumniDashboard() {
    // 1. Get the session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // 2. Fetch the latest employability prediction and profile data
    let predictionData = null;
    let profileData = null;

    if (token) {
        // Parallel fetch for better performance
        const [prediction, profile] = await Promise.all([
            getLatestPrediction(token),
            getMyProfile(token)
        ]);
        predictionData = prediction;
        profileData = profile;
    }

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <PageHeader
                title="Dashboard"
                description="Here's what's happening with your career journey"
                currentPage="Overview"
            />

            {/* Hero & Employability Score */}
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="h-full">
                    <DashboardHeader profile={profileData} />
                </div>
                <div className="h-full">
                    <EmployabilityScore data={predictionData} />
                </div>
            </div>

            {/* Main Content - Bento Grid */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Jobs takes 2 cols */}
                <RecommendedJobs />

                {/* Right Column */}
                <div className="flex flex-col gap-5 h-full">
                    <ProfileStrength percentage={profileData?.profile_completeness} />
                    <QuickActions className="flex-1" />
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid gap-5 lg:grid-cols-2">
                <UpcomingEvents />
                <RecentActivity />
            </div>
        </div>
    );
}
