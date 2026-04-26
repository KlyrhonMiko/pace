"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    XCircle,
    LayoutDashboard,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { getMyApplications } from "@/app/dashboard/_lib/jobs-api";
import ApplicationList from "./_components/ApplicationList";
import ApplicationFilters from "./_components/ApplicationFilters";
import { ApplicationStatus } from "./_components/ApplicationCard";

interface Application {
    application_ref_id: string;
    job_listing_id: string;
    job_title: string;
    company: string;
    status: ApplicationStatus;
    applied_at: string;
}

export default function AppliedJobsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");

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

    const stats = useMemo(() => {
        return {
            total: applications.length,
            pending: applications.filter((a) => a.status === "Pending").length,
            accepted: applications.filter((a) => a.status === "Accepted").length,
            rejected: applications.filter((a) => a.status === "Rejected").length,
        };
    }, [applications]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedStatus("All");
    };

    return (
        <div className="space-y-6 relative">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-emerald-100 opacity-20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-blue-100 opacity-20 blur-3xl" />
            </div>

            {/* Page Header */}
            <PageHeader
                title="My Applications"
                description="Track and manage your professional opportunities"
                currentPage="My Applications"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Applied", value: stats.total, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Under Review", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                    { label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`group relative flex items-center gap-4 rounded-2xl border ${stat.border} bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md`}
                    >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 leading-tight">
                                {isLoading ? "..." : stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Applications List */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4 text-emerald-700" />
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Active Applications</h2>
                        </div>
                        {filtered.length > 0 && (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-wider">
                                {filtered.length} found
                            </span>
                        )}
                    </div>

                    <ApplicationList
                        applications={filtered}
                        isLoading={isLoading}
                        currentPage={1}
                        setCurrentPage={() => { }}
                        totalApplications={applications.length}
                        itemsPerPage={10}
                        searchQuery={searchQuery}
                    />
                </div>

                {/* Right Column: Filters */}
                <div className="lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
                    <ApplicationFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        onClearFilters={clearFilters}
                        stats={stats}
                    />
                </div>
            </div>
        </div>
    );
}
