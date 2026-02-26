import InsightsHeader from "./_components/InsightsHeader";
import ScoreOverview from "./_components/ScoreOverview";
import TopFactors from "./_components/TopFactors";
import ImprovementSuggestions from "./_components/ImprovementSuggestions";
import SkillBreakdown from "./_components/SkillBreakdown";
import { createClient } from "@/lib/supabase/server";
import { getLatestPrediction, fetchDemoPrediction } from "../_lib/api";
import Link from "next/link";

export default async function InsightsPage() {
    // 1. Get current logged-in user
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 2. Fetch the latest employability prediction
    let predictionData = null;
    let isDemoData = false;

    if (user?.id) {
        predictionData = await getLatestPrediction(user.id);
    }

    // 3. Fallback to demo prediction if no data exists
    if (!predictionData) {
        predictionData = await fetchDemoPrediction();
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
                            <svg
                                className="h-7 w-7 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                />
                            </svg>
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
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <InsightsHeader isDemo={isDemoData} />

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
