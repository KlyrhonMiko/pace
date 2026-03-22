import InsightsHeader from "./_components/InsightsHeader";
import ScoreOverview from "./_components/ScoreOverview";
import TopFactors from "./_components/TopFactors";
import ImprovementSuggestions from "./_components/ImprovementSuggestions";
import SkillBreakdown from "./_components/SkillBreakdown";
import { cookies } from "next/headers";
import { getLatestPrediction, fetchDemoPrediction } from "../_lib/api";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function InsightsPage() {
    // 1. Get the session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // 2. Fetch the latest employability prediction using the token
    let predictionData = null;
    let isDemoData = false;

    if (token) {
        predictionData = await getLatestPrediction(token);
    }

    // 3. Fallback to demo prediction if no data exists
    if (!predictionData) {
        predictionData = await fetchDemoPrediction(token);
        isDemoData = true;
    }

    // 4. Handle case where no prediction data is available at all
    if (!predictionData) {
        return (
            <div className="space-y-6">
                <InsightsHeader isDemo={false} />

                <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 mb-5">
                            <Sparkles className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
                            No Prediction Data Available
                        </h2>
                        <p className="text-sm text-gray-500 max-w-sm text-center mb-6 leading-relaxed">
                            Complete your profile and academic records to generate your
                            AI-powered employability analysis.
                        </p>
                        <Link
                            href="/dashboard/alumni/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
                        >
                            Complete Your Profile
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <InsightsHeader isDemo={isDemoData} predictionData={predictionData} />

            {/* Core Metrics — Score Overview + Top Factors */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Score Overview - takes 2 cols */}
                <div className="lg:col-span-2">
                    <ScoreOverview data={predictionData} />
                </div>

                {/* Top Factors - takes 3 cols */}
                <div className="lg:col-span-3">
                    <TopFactors factors={predictionData.top_factors} />
                </div>
            </div>

            {/* Growth Analysis — Suggestions + Skill Breakdown side by side */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ImprovementSuggestions
                    suggestions={predictionData.improvement_suggestions}
                />
                <SkillBreakdown
                    suggestions={predictionData.skill_breakdown || predictionData.improvement_suggestions || []}
                />
            </div>
        </div>
    );
}
