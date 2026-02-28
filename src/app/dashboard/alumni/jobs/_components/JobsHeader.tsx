"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function JobsHeader() {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-8 py-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-4">
                    <Link
                        href="/dashboard/alumni"
                        className="hover:text-gray-600 transition-colors"
                    >
                        Dashboard
                    </Link>
                    <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                    <span className="text-gray-600">Job Listings</span>
                </nav>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                            Job Listings
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Discover opportunities that match your skills and career goals
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
