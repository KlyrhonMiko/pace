"use client";

import { Briefcase, Search, CircleSlash } from "lucide-react";
import ApplicationCard, { ApplicationStatus } from "./ApplicationCard";
import Link from "next/link";

interface Application {
    application_ref_id: string;
    job_listing_id: string;
    job_title: string;
    company: string;
    status: ApplicationStatus;
    applied_at: string;
}

interface ApplicationListProps {
    applications: Application[];
    isLoading: boolean;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalApplications: number;
    itemsPerPage: number;
    onViewDetails?: (id: string) => void;
    searchQuery: string;
}

export default function ApplicationList({
    applications,
    isLoading,
    currentPage,
    setCurrentPage,
    totalApplications,
    itemsPerPage,
    onViewDetails,
    searchQuery,
}: ApplicationListProps) {

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[100px] w-full animate-pulse rounded-xl bg-gray-100" />
                ))}
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 py-16 px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                    {searchQuery ? <Search className="h-8 w-8" /> : <Briefcase className="h-8 w-8" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                    {searchQuery ? "No matching applications" : "No applications yet"}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">
                    {searchQuery
                        ? `We couldn't find any applications matching "${searchQuery}". Try adjusting your filters.`
                        : "You haven't applied for any jobs through our platform yet. Start exploring opportunities that match your skills!"}
                </p>
                {!searchQuery && (
                    <Link
                        href="/dashboard/alumni/jobs"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95"
                    >
                        Browse Job Listings
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                {applications.map((app) => (
                    <ApplicationCard
                        key={app.application_ref_id}
                        jobTitle={app.job_title}
                        company={app.company}
                        status={app.status}
                        appliedAt={app.applied_at}
                        onClick={() => onViewDetails?.(app.job_listing_id)}
                    />
                ))}
            </div>

            {/* Pagination placeholder if needed later, otherwise simple status */}
            <div className="flex items-center justify-between px-2 pt-4">
                <span className="text-xs text-gray-400">
                    Showing <span className="font-medium text-gray-900">{applications.length}</span> of <span className="font-medium text-gray-900">{totalApplications}</span> applications
                </span>
            </div>
        </div>
    );
}
