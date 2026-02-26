"use client";

import Link from "next/link";

export default function InsightsHeader({
    isDemo = false,
}: {
    isDemo?: boolean;
}) {
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
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="text-gray-600">Employability Insights</span>
                </nav>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                            Employability Insights
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            AI-powered analysis of your career readiness and growth areas
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
