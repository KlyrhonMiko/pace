"use client";

import { useState, useMemo } from "react";
import { Mail } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import EmployerApplicationList from "./_components/EmployerApplicationList";
import ApplicationFilters from "./_components/ApplicationFilters";

const initialApplications = [
    { id: 1, applicant: "Alice Johnson", job: "Software Engineer", status: "Review", date: "Oct 24, 2026", email: "alice.j@example.com", matchScore: 92 },
    { id: 2, applicant: "Michael Smith", job: "Product Manager", status: "New", date: "Oct 24, 2026", email: "msmith@example.com", matchScore: 88 },
    { id: 3, applicant: "Emma Davis", job: "UI/UX Designer", status: "Interviewing", date: "Oct 23, 2026", email: "edavis@example.com", matchScore: 95 },
    { id: 4, applicant: "James Wilson", job: "Data Analyst", status: "Rejected", date: "Oct 21, 2026", email: "james.w@example.com", matchScore: 45 },
    { id: 5, applicant: "Sarah Miller", job: "Software Engineer", status: "New", date: "Oct 21, 2026", email: "sarahl@example.com", matchScore: 82 },
];

export default function EmployerApplicationsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const filteredApplications = useMemo(() => {
        return initialApplications.filter(app => {
            const matchesSearch = app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesJob = selectedJobs.length === 0 || selectedJobs.includes(app.job);
            return matchesSearch && matchesJob;
        });
    }, [searchQuery, selectedJobs]);

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
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
