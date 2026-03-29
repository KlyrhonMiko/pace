"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SurveysHeader() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-500 p-6 lg:p-8 text-white shadow-lg">
            {/* Decorative mesh */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
            </div>

            {/* Grid overlay pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '24px 24px',
            }} />

            <div className="relative">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-emerald-100/60 font-medium mb-4">
                    <Link
                        href="/dashboard/alumni"
                        className="hover:text-white transition-colors"
                    >
                        Dashboard
                    </Link>
                    <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                    <span className="text-white">Surveys &amp; Feedback</span>
                </nav>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Surveys &amp; Feedback
                        </h1>
                        <p className="text-sm text-emerald-100/80 mt-1.5 max-w-md">
                            Share your feedback and help improve programs through quick surveys
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
