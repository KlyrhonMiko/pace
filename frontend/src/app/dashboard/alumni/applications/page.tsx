"use client";

import { useState, useEffect, useMemo } from "react";
import {
    LayoutDashboard,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { getMyApplications, getJobListing, JoobleJob } from "@/app/dashboard/_lib/jobs-api";
import ApplicationList from "./_components/ApplicationList";
import ApplicationFilters from "./_components/ApplicationFilters";
import { ApplicationStatus } from "./_components/ApplicationList";
import JobDetailModal from "../jobs/_components/JobDetailModal";
import { toast } from "sonner";

interface Application {
    application_ref_id: string;
    job_listing_id: string;
    job_title: string;
    company: string;
    status: ApplicationStatus;
    applied_at: string;
    logo?: string;
    interview_date?: string | null;
    interview_link?: string | null;
}

export default function AppliedJobsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [isFetchingJob, setIsFetchingJob] = useState(false);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const data = await getMyApplications();
            setApplications(data || []);
        } catch (error) {
            console.error("Failed to fetch applications:", error);
            setApplications([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const filtered = useMemo(() => {
        return applications.filter((app) => {
            const matchesStatus =
                selectedStatus === "All" || app.status === selectedStatus;
            const matchesSearch =
                !searchQuery ||
                app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (app.company || "").toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [applications, selectedStatus, searchQuery]);


    const clearFilters = () => {
        setSearchQuery("");
        setSelectedStatus("All");
    };

    const handleViewDetails = async (jobId: string) => {
        if (isFetchingJob) return;
        setIsFetchingJob(true);
        const loadingToast = toast.loading("Fetching job details...");
        try {
            const jobData = await getJobListing(jobId);
            toast.dismiss(loadingToast);
            if (jobData) {
                // Map Backend JobListing to format expected by JobDetailModal
                const mappedJob = {
                    id: jobData.db_id || jobData.id,
                    title: jobData.title,
                    company: jobData.company || "Unknown Company",
                    location: jobData.location || "Philippines",
                    salary: 0, // Not strictly used for display if salaryDisplay is set
                    salaryDisplay: jobData.raw_salary || jobData.salary || "Undisclosed",
                    type: jobData.job_type || jobData.type || "Full-time",
                    postedDate: jobData.posted_at ? new Date(jobData.posted_at) : new Date(),
                    logo: jobData.logo || (jobData.company ? jobData.company.charAt(0) : "J"),
                    experienceLevel: jobData.experience_level || "Not specified",
                    workType: jobData.work_type || "Not specified",
                    description: jobData.description || jobData.snippet,
                    source: jobData.source || "Internal",
                    link: jobData.link
                };
                setSelectedJob(mappedJob);
            } else {
                toast.error("Could not fetch job details. It might have been removed.");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Error fetching job details:", error);
            toast.error("Failed to load job details.");
        } finally {
            setIsFetchingJob(false);
        }
    };

    return (
        <div className="relative">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-emerald-100 opacity-20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-blue-100 opacity-20 blur-3xl" />
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <PageHeader
                    title="My Applications"
                    description="Track and manage your professional opportunities"
                    currentPage="My Applications"
                />
            </div>


            {/* 2-Column Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Applications List */}
                <div className="lg:col-span-2">
                    <ApplicationList
                        applications={filtered}
                        isLoading={isLoading}
                        currentPage={1}
                        setCurrentPage={() => { }}
                        totalApplications={applications.length}
                        itemsPerPage={10}
                        searchQuery={searchQuery}
                        onViewDetails={handleViewDetails}
                    />
                </div>

                {/* Right Column: Filters */}
                <div className="lg:col-span-1">
                    <ApplicationFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        onClearFilters={clearFilters}
                    />
                </div>
            </div>

            {/* Job Detail Modal */}
            {selectedJob && (
                <JobDetailModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                />
            )}
        </div>
    );
}
