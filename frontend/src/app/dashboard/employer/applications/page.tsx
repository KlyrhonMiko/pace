"use client";

import { useState, useMemo, useEffect } from "react";
import { Mail } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import EmployerApplicationList from "./_components/EmployerApplicationList";
import ApplicationFilters from "./_components/ApplicationFilters";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import ApplicationDetailsDrawer from "./_components/ApplicationDetailsDrawer";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { CheckCircle2, XCircle } from "lucide-react";

interface Application {
    id: string;
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
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string, status: "Accepted" | "Rejected", applicantName: string } | null>(null);
    const [modalAction, setModalAction] = useState<{ id: string, status: "Accepted" | "Rejected", applicantName: string }>({ id: "", status: "Accepted", applicantName: "" });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (confirmAction) setModalAction(confirmAction);
    }, [confirmAction]);

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

    const handleContactCandidate = (email: string) => {
        window.location.href = `mailto:${email}`;
    };

    const handleUpdateStatus = async (id: string, status: "Accepted" | "Rejected") => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            const result = await apiFetch<any>(`/employers/applications/${id}/status?status=${status}`, {
                method: "PATCH"
            });
            if (result.success) {
                toast.success(`Application marked as ${status.toLowerCase()}!`);
                setApplications(prev => prev.map(app =>
                    app.id === id ? { ...app, status } : app
                ));
            } else {
                toast.error(result.message || "Failed to update status");
            }
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsUpdating(false);
            setConfirmAction(null);
        }
    };

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
                        onContact={handleContactCandidate}
                        onApprove={(id: string) => {
                            const app = applications.find(a => a.id === id);
                            if (app) setConfirmAction({ id, status: "Accepted", applicantName: app.applicant });
                        }}
                        onReject={(id: string) => {
                            const app = applications.find(a => a.id === id);
                            if (app) setConfirmAction({ id, status: "Rejected", applicantName: app.applicant });
                        }}
                        onViewDetails={(id: string) => setSelectedAppId(id)}
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

            <ApplicationDetailsDrawer
                applicationId={selectedAppId}
                onClose={() => setSelectedAppId(null)}
                onStatusChange={(id, newStatus) => {
                    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app))
                }}
            />

            <ConfirmationModal
                isOpen={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => handleUpdateStatus(modalAction.id, modalAction.status)}
                title={modalAction.status === "Accepted" ? "Approve Application" : "Reject Application"}
                description={
                    modalAction.status === "Accepted"
                        ? `Are you sure you want to approve ${modalAction.applicantName}'s application? This will mark them as accepted for this role.`
                        : `Are you sure you want to reject ${modalAction.applicantName}'s application? This will mark them as rejected for this role.`
                }
                confirmText={modalAction.status === "Accepted" ? "Approve" : "Reject"}
                variant={modalAction.status === "Accepted" ? "success" : "danger"}
                isLoading={isUpdating}
                icon={modalAction.status === "Accepted" ? CheckCircle2 : XCircle}
            />
        </div>
    );
}
