"use client";

import { useState, useEffect } from "react";
import { Info, Loader2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { getMyEmployerProfile, EmployerProfile } from "./_lib/api";
import { useAuth } from "@/context/AuthContext";

// Sub-components
import { ProfileHero } from "./_components/ProfileHero";
import { CompanyInfoCard } from "./_components/CompanyInfoCard";
import { AccountAccessCard } from "./_components/AccountAccessCard";
import { ContactPersonCard } from "./_components/ContactPersonCard";
import { SecurityCard } from "./_components/SecurityCard";

export default function EmployerProfilePage() {
    const [profile, setProfile] = useState<EmployerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { updateUser } = useAuth();

    const fetchProfile = async () => {
        try {
            const data = await getMyEmployerProfile();
            if (data) {
                setProfile(data);
                // Update AuthContext user state to ensure sidebar and header are in sync
                updateUser({
                    first_name: data.contact_person_first_name,
                    last_name: data.contact_person_last_name,
                    company_name: data.company_name,
                    company_logo_url: data.company_logo_url
                });
            } else {
                setError("Could not load profile data.");
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
            setError("An error occurred while loading your profile.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <Info className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Error Loading Profile</h3>
                <p className="text-gray-500 max-w-xs">{error || "Something went wrong"}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-emerald-700 font-semibold hover:underline"
                >
                    Try refreshing the page
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Company Profile"
                description="View and manage your organization's profile and contact information."
                currentPage="Profile"
                dashboardHref="/dashboard/employer"
                dashboardName="Employer Dashboard"
            />

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Main Content Grid */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <ProfileHero profile={profile} onLogoUploaded={fetchProfile} />
                    <CompanyInfoCard profile={profile} onUpdated={fetchProfile} />
                    <AccountAccessCard profile={profile} onUpdated={fetchProfile} />
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <ContactPersonCard profile={profile} onUpdated={fetchProfile} />
                    <SecurityCard profile={profile} />
                </div>

            </div>
        </div>
    );
}
