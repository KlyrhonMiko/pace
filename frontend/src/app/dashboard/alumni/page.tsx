import DashboardHeader from "./_components/DashboardHeader";
import StatsGrid from "./_components/StatsGrid";
import EmployabilityScore from "./_components/EmployabilityScore";
import RecommendedJobs from "./jobs/_components/RecommendedJobs";
import ProfileStrength from "./_components/ProfileStrength";
import QuickActions from "./_components/QuickActions";
import UpcomingEvents from "./events/_components/UpcomingEvents";
import RecentActivity from "./_components/RecentActivity";
import { cookies } from "next/headers";
import { getLatestPrediction, fetchDemoPrediction } from "./_lib/api";

export default async function AlumniDashboard() {
    // 1. Get the session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    // 2. Fetch the latest employability prediction using the token
    let predictionData = null;
    let isDemoData = false;

    if (token) {
        predictionData = await getLatestPrediction(token);
    }

    // 3. Fallback to demo prediction if no data exists
    if (!predictionData) {
        predictionData = await fetchDemoPrediction();
        isDemoData = true;
    }

    return (
        <div className="space-y-5">
            {/* Hero */}
            <DashboardHeader />

            {/* Employability Score & Stats */}
            <div className="grid gap-5 lg:grid-cols-4">
                <div className="lg:col-span-2 flex flex-col">
                    <EmployabilityScore data={predictionData} isDemo={isDemoData} />
                </div>
                <div className="lg:col-span-2 flex flex-col">
                    <StatsGrid />
                </div>
            </div>

            {/* Main Content - Bento Grid */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Jobs takes 2 cols */}
                <RecommendedJobs />

                {/* Right Column */}
                <div className="flex flex-col gap-5 h-full">
                    <ProfileStrength />
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
