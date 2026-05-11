import PageHeader from "@/components/dashboard/PageHeader";
import CareerTrackCard from "../_components/CareerTrackCard";
import CareerTrackDistribution from "./_components/CareerTrackDistribution";
import CareerTrackInsights from "./_components/CareerTrackInsights";
import CareerInputFactors from "./_components/CareerInputFactors";
import { cookies } from "next/headers";
import {
    triggerCareerTrackPrediction,
    getMyCareerTrackPredictions,
} from "../_lib/api";
import { getMyProfile } from "../profile/_lib/api";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default async function CareerTrackPage() {
    // 1. Get auth token
    const cookieStore = await cookies();
    const token = cookieStore.get("pace_session")?.value;

    let profileData = null;
    let latestPrediction = null;
    let history: any[] = [];

    if (token) {
        // Fetch profile first to get alumni_id
        profileData = await getMyProfile(token);

        if (profileData?.alumni_id) {
            // 1. Fetch history first to see if we have a recent valid prediction
            history = await getMyCareerTrackPredictions(token, 10);
            const latest = history[0];

            // 2. Determine if we need a fresh prediction (e.g. skills changed)
            const currentSkills = (profileData.skills || []).join(", ");
            const currentGwa = parseFloat(profileData.gwa || "0");

            const isStale = !latest ||
                latest.input_data.skills !== currentSkills ||
                Math.abs(latest.input_data.gwa - currentGwa) > 0.01;

            if (isStale) {
                // Only trigger if data has changed or no history exists
                latestPrediction = await triggerCareerTrackPrediction(profileData.alumni_id, token);
                // Update history to include the new one
                history = await getMyCareerTrackPredictions(token, 10);
            } else {
                // Reuse existing latest from history, mapping it to the expected UI format
                latestPrediction = {
                    prediction: latest.predicted_track,
                    probability: latest.probability,
                    all_probabilities: latest.prediction_result.all_probabilities,
                    input_data: latest.input_data
                };
            }
        }
    }

    // Handle empty state (no profile or no skills)
    if (!latestPrediction) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Career Track"
                    description="AI-powered analysis of your most likely career path based on your current skill set."
                    currentPage="Career Track"
                />

                <div className="rounded-2xl bg-card border border-border overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-5">
                            <Compass
                                className="h-7 w-7 text-muted-foreground/40"
                                strokeWidth={1.5}
                            />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-1.5">
                            No Track Data Available
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-sm text-center mb-6 leading-relaxed">
                            Complete your profile skills and academic records
                            to unlock your AI-powered career path analysis.
                        </p>
                        <Link
                            href="/dashboard/alumni/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors duration-200"
                        >
                            Update Profile Skills
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Career Track"
                description="AI-powered analysis of your most likely career path based on your current skill set."
                currentPage="Career Track"
            />

            {/* Hero — full width */}
            <CareerTrackCard data={latestPrediction} />

            {/* Bento grid: distribution + insights */}
            <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                <CareerTrackDistribution
                    predicted={latestPrediction.prediction}
                    allProbabilities={latestPrediction.all_probabilities}
                />
                <CareerTrackInsights
                    predicted={latestPrediction.prediction}
                    userSkills={latestPrediction.input_data.skills}
                />
            </div>

            {/* Input factors — full width */}
            <CareerInputFactors data={latestPrediction.input_data} />

        </div>
    );
}
