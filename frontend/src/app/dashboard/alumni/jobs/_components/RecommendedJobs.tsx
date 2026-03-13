"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import JobCard from "./JobCard";
import { JoobleJob, getRecommendedJobs } from "../_lib/api";
import { Skeleton } from "../../../../../components/ui/skeleton";
import { Sparkles, Search } from "lucide-react";

const formatSalary = (salaryStr: string) => {
    if (!salaryStr) return "Undisclosed";
    return salaryStr;
};

const formatSnippet = (text: string) => {
    if (!text) return "";
    let snippet = text.replace(/^(\s*\.\.\.\s*)+/, "").trim();
    if (snippet.length > 0) {
        snippet = snippet.charAt(0).toUpperCase() + snippet.slice(1);
    }
    return snippet;
};

export default function RecommendedJobs() {
    const [jobs, setJobs] = useState<JoobleJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommended() {
            try {
                const data = await getRecommendedJobs();
                setJobs(data);
            } catch (e) {
                console.error("Failed to fetch recommended jobs", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRecommended();
    }, []);

    return (
        <div className="lg:col-span-2 flex flex-col">
            <div className="group/card h-full flex flex-col rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/30 hover:border-amber-100/60">
                {/* Decorative top gradient bar */}


                <div className="flex-1 flex flex-col p-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Recommended For You</h2>
                                <p className="text-xs text-gray-500">Curated based on your profile &amp; skills</p>
                            </div>
                        </div>
                        <Link href="/dashboard/alumni/jobs" className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                            View All
                        </Link>
                    </div>

                    {/* Job Cards */}
                    <div className="flex-1 flex flex-col gap-3">
                        {isLoading ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100/50 animate-pulse">
                                        <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2.5">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-48" />
                                                    <Skeleton className="h-3.5 w-32" />
                                                </div>
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </div>
                                            <div className="space-y-1.5 mb-3">
                                                <Skeleton className="h-3 w-full" />
                                                <Skeleton className="h-3 w-4/5" />
                                            </div>
                                            <div className="flex gap-4">
                                                <Skeleton className="h-3.5 w-28" />
                                                <Skeleton className="h-3.5 w-24" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : jobs.length > 0 ? (
                            jobs.map((job, idx) => (
                                <JobCard
                                    key={job.id || idx}
                                    title={job.title}
                                    company={job.company}
                                    location={job.location}
                                    salary={formatSalary(job.salary || job.raw_salary || "")}
                                    type={job.type || "Full-time"}
                                    logo={job.company.charAt(0).toUpperCase()}
                                    className="flex-1"
                                    description={formatSnippet(job.snippet || job.description || "")}
                                />
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] rounded-xl bg-gradient-to-br from-gray-50/80 to-amber-50/30 border border-dashed border-gray-200">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 mb-3">
                                    <Search className="h-7 w-7 text-amber-500" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">No recommendations yet</p>
                                <p className="text-xs text-gray-400 mt-1">Complete your profile to get personalized matches</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
