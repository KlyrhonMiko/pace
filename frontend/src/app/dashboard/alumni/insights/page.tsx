import PageHeader from "@/components/dashboard/PageHeader";
import ScoreOverview from "./_components/ScoreOverview";
import TopFactors from "./_components/TopFactors";
import ImprovementSuggestions from "./_components/ImprovementSuggestions";
import SkillBreakdown from "./_components/SkillBreakdown";
import SkillsManager from "./_components/SkillsManager";
import { cookies } from "next/headers";
import { getLatestPrediction } from "../_lib/api";
import { getMyProfile } from "../profile/_lib/api";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import AskAIButton from "./_components/AskAIButton";
import CareerAdvisorChat from "./_components/CareerAdvisorChat";

export default async function InsightsPage() {
    // 1. Get the session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // 2. Always fetch the profile — we need it for SkillsManager regardless of prediction status
    let profile = null;
    let predictionData = null;

    if (token) {
        profile = await getMyProfile(token);
        if (profile?.alumni_id) {
            predictionData = await getLatestPrediction(token, profile.alumni_id);
        }
    }

    const alumniId = profile?.alumni_id ?? "";
    const courseName = profile?.course_name ?? "";

    // 3. No prediction yet — still show SkillsManager as the primary action + a CTA
    if (!predictionData) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Employability Insights"
                    description="AI-powered analysis of your career potential and growth areas."
                    currentPage="Employability Insights"
                />

                {/* Skills Manager — always visible, even without a prediction */}
                {alumniId && (
                    <SkillsManager alumniId={alumniId} course={courseName} />
                )}

                <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 mb-5">
                            <Sparkles className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
                            No Prediction Data Yet
                        </h2>
                        <p className="text-sm text-gray-500 max-w-sm text-center mb-6 leading-relaxed">
                            Once you&apos;ve added your skill scores above, your employability
                            prediction will appear here automatically. You can also complete
                            your academic profile to improve the analysis.
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
            <PageHeader
                title="Employability Insights"
                description="AI-powered analysis of your career potential and growth areas."
                currentPage="Employability Insights"
            >
                <AskAIButton insightsData={predictionData} />
            </PageHeader>

            {/* Skills Manager — always visible, above prediction cards */}
            {alumniId && (
                <SkillsManager alumniId={alumniId} course={courseName} />
            )}

            {/* Core Metrics — Score Overview + Top Factors */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Score Overview - takes 2 cols */}
                <div className="lg:col-span-2">
                    <ScoreOverview data={predictionData} />
                </div>

                {/* Top Factors - takes 3 cols */}
                <div className="lg:col-span-3">
                    <TopFactors
                        factors={predictionData.top_factors}
                        suggestions={predictionData.improvement_suggestions}
                    />
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

            {/* AI Career Advisor Chat (Floating) */}
            <CareerAdvisorChat insightsData={predictionData} />
        </div>
    );
}
