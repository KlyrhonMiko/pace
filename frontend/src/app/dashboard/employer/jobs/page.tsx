"use client";

import { toast } from "sonner";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PlusCircle, Briefcase, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchJobs } from "../../_lib/jobs-api";
import { hideJob, deleteJob } from "../../faculty/jobs/_lib/api";
import PageHeader from "@/components/dashboard/PageHeader";
import ActionsCard from "../../_components/ActionsCard";
import JobFilters from "../../alumni/jobs/_components/JobFilters";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import EmployerJobList from "./_components/EmployerJobList";
import EmployerJobFormModal from "./_components/EmployerJobFormModal";
import { UnifiedJob } from "./_lib/types";
import { convertApiJob } from "./_lib/utils";


export default function EmployerJobsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [locationSearch, setLocationSearch] = useState("");
    const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
    const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
    const [hasSalary, setHasSalary] = useState(false);
    const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500]);
    const [tempSalaryRange, setTempSalaryRange] = useState<[number, number]>([0, 500]);

    const [currentPage, setCurrentPage] = useState(1);
    const JOBS_PER_PAGE = 10;

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<UnifiedJob | null>(null);
    const [jobToDelete, setJobToDelete] = useState<UnifiedJob | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const debouncedLocationSearch = useDebounce(locationSearch, 500);

    const [apiJobs, setApiJobs] = useState<UnifiedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalApiJobs, setTotalApiJobs] = useState(0);

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await searchJobs({
                keywords: debouncedSearchQuery || undefined,
                location: debouncedLocationSearch || undefined,
                job_type: selectedTypes.length > 0 ? selectedTypes[0] : undefined,
                work_type: selectedWorkTypes.length > 0 ? selectedWorkTypes[0] : undefined,
                experience_level: selectedExperience.length > 0 ? selectedExperience[0] : undefined,
                page: currentPage,
                limit: JOBS_PER_PAGE,
                has_salary: hasSalary,
                include_inactive: true, // Employers should see their hidden jobs
            });

            if (result.error) {
                toast.error(result.error);
                setApiJobs([]);
                setTotalApiJobs(0);
            } else {
                const converted = result.jobs.map((job: any, index: number) => convertApiJob(job, index));
                setApiJobs(converted);
                setTotalApiJobs(result.totalCount);
            }
        } catch {
            toast.error("Failed to fetch jobs");
            setApiJobs([]);
            setTotalApiJobs(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchQuery, debouncedLocationSearch, selectedTypes, selectedWorkTypes, selectedExperience, currentPage, hasSalary]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Debounce salary range updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setSalaryRange(tempSalaryRange);
        }, 300);
        return () => clearTimeout(timer);
    }, [tempSalaryRange]);

    const filteredJobs = useMemo(() => {
        const isDefaultSalary = salaryRange[0] === 0 && salaryRange[1] === 500;
        return apiJobs.filter((job) => {
            const matchesSalary = isDefaultSalary || job.salary === 0 || (job.salary >= salaryRange[0] && job.salary <= salaryRange[1]);
            return matchesSalary;
        });
    }, [apiJobs, salaryRange]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedTypes([]);
        setLocationSearch("");
        setSelectedExperience([]);
        setSelectedWorkTypes([]);
        setSalaryRange([0, 500]);
        setTempSalaryRange([0, 500]);
        setHasSalary(false);
        setCurrentPage(1);
    };

    const handleEditJob = (job: UnifiedJob) => {
        setEditingJob(job);
        setIsFormModalOpen(true);
    };

    const handleToggleHide = async (job: UnifiedJob) => {
        try {
            const res = (await hideJob(job.dbId ?? job.id)) as any;
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Job visibility updated`);
                fetchJobs();
            }
        } catch {
            toast.error("An error occurred while updating job status");
        }
    };

    const handleDeleteClick = (job: UnifiedJob) => {
        setJobToDelete(job);
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;
        setIsDeleting(true);
        try {
            const res = (await deleteJob(jobToDelete.dbId ?? jobToDelete.id)) as any;
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Job posting deleted");
                setJobToDelete(null);
                fetchJobs();
            }
        } catch {
            toast.error("An error occurred while deleting the job");
        } finally {
            setIsDeleting(false);
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
                    title="Career Marketplace Management"
                    description="Review, modify, and publish your job opportunities to the alumni network."
                    currentPage="Job Postings"
                    dashboardHref="/dashboard/employer"
                    dashboardName="Employer Dashboard"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <EmployerJobList
                        filteredJobs={filteredJobs}
                        totalJobs={totalApiJobs}
                        totalPages={Math.ceil(totalApiJobs / JOBS_PER_PAGE)}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        clearFilters={clearFilters}
                        isLoading={isLoading}
                        onEdit={handleEditJob}
                        onToggleHide={handleToggleHide}
                        onDelete={handleDeleteClick}
                        onAdd={() => {
                            setEditingJob(null);
                            setIsFormModalOpen(true);
                        }}
                    />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <ActionsCard
                            title="Recruitment"
                            description="Expand your winning team"
                            icon={<Briefcase className="h-5 w-5 text-white" />}
                            actions={[
                                {
                                    label: "Post New Job",
                                    onClick: () => {
                                        setEditingJob(null);
                                        setIsFormModalOpen(true);
                                    },
                                    icon: <PlusCircle className="h-4 w-4" />,
                                    variant: "primary",
                                },
                            ]}
                        />

                        <JobFilters
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            locationSearch={locationSearch}
                            setLocationSearch={setLocationSearch}
                            selectedTypes={selectedTypes}
                            setSelectedTypes={setSelectedTypes}
                            selectedWorkTypes={selectedWorkTypes}
                            setSelectedWorkTypes={setSelectedWorkTypes}
                            selectedExperience={selectedExperience}
                            setSelectedExperience={setSelectedExperience}
                            hasSalary={hasSalary}
                            setHasSalary={setHasSalary}
                            tempSalaryRange={tempSalaryRange}
                            setTempSalaryRange={setTempSalaryRange}
                        />
                    </div>
                </div>
            </div>

            <EmployerJobFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                editingJob={editingJob}
                onSuccess={fetchJobs}
            />

            <ConfirmationModal
                isOpen={jobToDelete !== null}
                onClose={() => setJobToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Job Posting?"
                description={`This will permanently remove "${jobToDelete?.title}" from the career portal. This action cannot be reversed.`}
                confirmText="Delete Permanently"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
