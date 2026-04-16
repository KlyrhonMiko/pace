"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: string;
    currentPage: string;
    dashboardHref?: string;
    dashboardName?: string;
    children?: React.ReactNode;
}

export default function PageHeader({
    title,
    description,
    currentPage,
    dashboardHref = "/dashboard/alumni",
    dashboardName = "Dashboard",
    children
}: PageHeaderProps) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-8 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-3">
                            <Link
                                href={dashboardHref}
                                className="hover:text-gray-600 transition-colors"
                            >
                                {dashboardName}
                            </Link>
                            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                            <span className="text-gray-600">{currentPage}</span>
                        </nav>

                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                                {title}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {description}
                            </p>
                        </div>
                    </div>

                    {children && (
                        <div className="flex-shrink-0 animate-in fade-in zoom-in duration-500">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
