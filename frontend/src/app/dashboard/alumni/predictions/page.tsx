import PageHeader from "@/components/dashboard/PageHeader";
import SalaryPredictionCard from "./_components/SalaryPrediction";
import JobSearchDuration from "./_components/JobSearchDuration";
import InputFactors from "./_components/InputFactors";
import PredictionHistory from "./_components/PredictionHistory";
import AskAIButton from "./_components/AskAIButton";
import PredictionAdvisorChat from "./_components/PredictionAdvisorChat";
import { cookies } from "next/headers";
import {
    getMyRegressionPredictions,
    RegressionPrediction,
} from "./_lib/api";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";

export default async function PredictionsPage() {
    // 1. Get the session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // 2. Fetch regression predictions
    let predictions: RegressionPrediction[] = [];

    if (token) {
        predictions = await getMyRegressionPredictions(token, 10);
    }

    // 3. Handle case where no prediction data is available
    if (!predictions || predictions.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Career Predictions"
                    description="AI-powered salary and job search timeline predictions based on your academic profile."
                    currentPage="Career Predictions"
                />

                <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 mb-5">
                            <TrendingUp
                                className="h-7 w-7 text-gray-300"
                                strokeWidth={1.5}
                            />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
                            No Prediction Data Available
                        </h2>
                        <p className="text-sm text-gray-500 max-w-sm text-center mb-6 leading-relaxed">
                            Complete your profile, academic records, and skills
                            assessment to generate your AI-powered career
                            predictions.
                        </p>
                        <Link
                            href="/dashboard/alumni/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
                        >
                            Complete Your Profile
                            <ArrowRight
                                className="w-4 h-4"
                                strokeWidth={2}
                            />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Extract the latest prediction
    const latest = predictions[0];
    const salaryData = latest.prediction_result.predictions.starting_salary;
    const durationData =
        latest.prediction_result.predictions.job_search_duration;
    const inputData = latest.prediction_result.input;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Career Predictions"
                description="AI-powered salary and job search timeline predictions based on your academic profile."
                currentPage="Career Predictions"
            >
                <AskAIButton predictionData={latest} />
            </PageHeader>

            {/* Salary & Duration — side by side */}
            <div className="grid gap-6 lg:grid-cols-2">
                <SalaryPredictionCard data={salaryData} />
                <JobSearchDuration data={durationData} />
            </div>

            {/* Input Factors */}
            <InputFactors data={inputData} />

            {/* Prediction History */}
            <PredictionHistory predictions={predictions} />

            {/* AI Advisor Chat (Floating) */}
            <PredictionAdvisorChat predictionData={latest} />
        </div>
    );
}

