"use client";

import { useState, useMemo, useEffect } from "react";
import { Mail } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import EmployerApplicationList from "./_components/EmployerApplicationList";
import ApplicationFilters from "./_components/ApplicationFilters";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Application {
    id: number;
    applicant: string;
    job: string;
    status: string;
    date: string;
    email: string;
}

interface ApplicationResponse {
    success: boolean;
    message: string;
    data: Application[];
}

export default function EmployerApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [availableJobs, setAvailableJobs] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch applications
                const appResult = await apiFetch<ApplicationResponse>("/employers/applications");
                if (appResult.success) {
                    setApplications(appResult.data);
                }

                // Fetch jobs to populate filters
                const jobsResult = await apiFetch<any>("/jobs/search?limit=50&include_inactive=true");
                if (jobsResult.success && jobsResult.data && jobsResult.data.jobs) {
                    const uniqueJobs = Array.from(new Set(jobsResult.data.jobs.map((job: any) => job.title)));
                    setAvailableJobs(uniqueJobs as string[]);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                toast.error(error.message || "An error occurred while fetching data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesJob = selectedJobs.length === 0 || selectedJobs.includes(app.job);
            return matchesSearch && matchesJob;
        });
    }, [searchQuery, selectedJobs, applications]);

    return (
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 h-72 w-72 rounded-full bg-teal-100/30 blur-3xl" />
            </div>

            {/* Header */}
            <div className="mb-6">
                <PageHeader
                    title="Candidate Pipeline"
                    description="Review and manage incoming candidate applications across your job postings."
                    currentPage="Applications"
                    dashboardHref="/dashboard/employer"
                    dashboardName="Employer Dashboard"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                <div className="lg:col-span-2">
                    <EmployerApplicationList
                        applications={filteredApplications}
                        isLoading={isLoading}
                        totalApplications={filteredApplications.length}
                    />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <ApplicationFilters
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedJobs={selectedJobs}
                            setSelectedJobs={setSelectedJobs}
                            jobList={availableJobs}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
