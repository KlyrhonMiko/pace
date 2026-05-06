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
                const data = await getRecommendedJobs(4);
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
                            <div className="flex flex-col gap-3 skeleton-stagger">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="relative flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-white border border-gray-100/80"
                                    >
                                        {/* Icon placeholder with warm tint */}
                                        <div className="h-11 w-11 rounded-xl flex-shrink-0 skeleton-shimmer bg-gradient-to-br" style={{
                                            background: 'linear-gradient(135deg, hsl(35 40% 90%) 0%, hsl(25 30% 88%) 100%)'
                                        }}>
                                            <div className="skeleton-shimmer h-full w-full rounded-xl" />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-3">
                                            {/* Title row + Badge */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <Skeleton className="h-[14px] w-3/5 rounded-md" />
                                                    <Skeleton className="h-[11px] w-2/5 rounded-md" />
                                                </div>
                                                <Skeleton className="h-[22px] w-[72px] rounded-full flex-shrink-0" />
                                            </div>

                                            {/* Description lines */}
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-[10px] w-full rounded" />
                                                <Skeleton className="h-[10px] w-4/6 rounded" />
                                            </div>

                                            {/* Meta row — location + salary icons */}
                                            <div className="flex items-center gap-5 pt-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Skeleton className="h-3.5 w-3.5 rounded" />
                                                    <Skeleton className="h-[10px] w-20 rounded" />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Skeleton className="h-3.5 w-3.5 rounded" />
                                                    <Skeleton className="h-[10px] w-16 rounded" />
                                                </div>
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
                                    logo={(job.logo && (job.logo.startsWith('http') || job.logo.startsWith('/'))) ? job.logo : job.company.charAt(0).toUpperCase()}
                                    className="flex-1"
                                    description={formatSnippet(job.snippet || job.description || "")}
                                    source={job.source}
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
