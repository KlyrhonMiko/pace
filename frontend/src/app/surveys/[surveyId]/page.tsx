"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import SurveyResponseModal from "@/app/dashboard/alumni/surveys/_components/SurveyResponseModal";
import { fetchAlumniSurvey, fetchMySurveyResponse, submitAlumniSurveyResponse, fetchMyAlumniProfile, Survey, SurveyResponse } from "@/app/dashboard/_lib/surveys";
import { Loader2 } from "lucide-react";

export default function StandaloneSurveyPage() {
    const params = useParams();
    const router = useRouter();
    const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;

    const { user, isLoading: isAuthLoading } = useAuth();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [initialAnswers, setInitialAnswers] = useState<SurveyResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [alumniId, setAlumniId] = useState<string | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    // Auth Check — redirect unauthenticated users to login with a `redirect` query param.
    // We use a URL query parameter instead of sessionStorage because the api-client's
    // 401 handler does a hard `window.location.href` redirect that can wipe SPA state.
    useEffect(() => {
        if (!isAuthLoading) {
            if (!user) {
                toast.error("Please log in to respond to this survey.");
                const surveyPath = `/surveys/${surveyId}`;
                router.push(`/?login=true&redirect=${encodeURIComponent(surveyPath)}`);
                return;
            }
            setHasCheckedAuth(true);
        }
    }, [user, isAuthLoading, surveyId, router]);

    // Load Alumni Profile & Survey
    useEffect(() => {
        if (!hasCheckedAuth || !surveyId) return;

        const loadContent = async () => {
            setIsLoading(true);
            try {
                // Pre-fetch profile to get alumni id
                fetchMyAlumniProfile().then((profile) => {
                    if (profile) setAlumniId(profile.alumni_id);
                }).catch(() => { });

                // Fetch survey
                const fetchedSurvey = await fetchAlumniSurvey(surveyId);
                if (!fetchedSurvey || fetchedSurvey.status !== "ACTIVE") {
                    toast.error("Survey not found or is no longer active.");
                    router.push("/dashboard/alumni/surveys");
                    return;
                }
                setSurvey(fetchedSurvey);

                // Check if already responded
                const response = await fetchMySurveyResponse(surveyId);
                if (response) {
                    setIsReadOnly(true);
                    setInitialAnswers(response);
                    toast.success("You have already completed this survey.");
                }
            } catch (error) {
                toast.error("Error loading survey details.");
                router.push("/dashboard/alumni/surveys");
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, [hasCheckedAuth, surveyId, router]);

    const handleSubmit = async (id: string, payload: any) => {
        setIsSubmitting(true);
        try {
            const enrichedPayload = {
                ...payload,
                alumni_id: survey?.is_anonymous ? null : alumniId,
            };
            const result = await submitAlumniSurveyResponse(id, enrichedPayload);
            if (result.success) {
                toast.success("Response submitted successfully!");
                setIsReadOnly(true);
                // reload answers
                const response = await fetchMySurveyResponse(id);
                if (response) setInitialAnswers(response);
                return true;
            }
            toast.error(result.message || "Failed to submit response.");
            return false;
        } catch (err) {
            toast.error("Failed to submit response.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthLoading || isLoading || !hasCheckedAuth) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-slate-500 font-medium animate-pulse">Loading Survey...</p>
            </div>
        );
    }

    if (!survey) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center">
            {/* We reuse SurveyResponseModal but we force it to always be open. 
                Because it acts as a modal (fixed inset), it will take over the screen.
                This is visually perfect for a standalone survey. */}
            <SurveyResponseModal
                isOpen={true}
                onClose={() => router.push("/dashboard/alumni/surveys")}
                survey={survey}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isLoadingQuestions={false}
                readOnly={isReadOnly}
                initialAnswers={initialAnswers}
            />
        </div>
    );
}
