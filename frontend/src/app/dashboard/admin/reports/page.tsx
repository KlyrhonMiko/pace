"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import AdminStatsGrid from "../_components/AdminStatsGrid";
import UserGrowthChart from "../_components/UserGrowthChart";
import UserDistribution from "../_components/UserDistribution";
import PlatformActivity from "../_components/PlatformActivity";
import { Download, Filter, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Platform Analytics & Reports"
                    description="Comprehensive overview of system performance, user engagement, and platform growth."
                    currentPage="Reports"
                    dashboardHref="/dashboard/admin"
                    dashboardName="Admin Dashboard"
                />
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="text-xs h-9 rounded-xl border-gray-200 gap-2">
                        <Filter size={14} />
                        Date Range: Last 30 Days
                        <ChevronDown size={14} />
                    </Button>
                    <Button variant="outline" className="text-xs h-9 rounded-xl border-gray-200 gap-2 font-medium">
                        Export as PDF
                        <FileText size={14} />
                    </Button>
                </div>
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-emerald-700/20 active:scale-95 transition-all">
                    <Download size={14} />
                    Download Full Report
                </Button>
            </div>

            {/* Core Metrics */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <div className="h-4 w-1 bg-emerald-600 rounded-full" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Key Performance Indicators</h2>
                </div>
                <AdminStatsGrid />
            </div>

            {/* Primary Analysis Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-4 w-1 bg-blue-600 rounded-full" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Growth Trends</h2>
                    </div>
                    <UserGrowthChart />
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-4 w-1 bg-violet-600 rounded-full" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">User Demographics</h2>
                    </div>
                    <UserDistribution />
                </div>
            </div>

            {/* Secondary Analysis Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-4 w-1 bg-gray-600 rounded-full" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Platform Activity Log</h2>
                    </div>
                    <PlatformActivity />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-4 w-1 bg-amber-600 rounded-full" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Resource Usage</h2>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-center h-full min-h-[300px] shadow-sm">
                        <div className="space-y-6">
                            {[
                                { label: "Job Board Capacity", percentage: 42, color: "emerald" },
                                { label: "Storage Used", percentage: 18, color: "blue" },
                                { label: "API Rate Health", percentage: 94, color: "violet" },
                                { label: "System Load", percentage: 31, color: "amber" },
                            ].map((item) => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className={`text-${item.color}-700`}>{item.percentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-${item.color}-600 rounded-full transition-all duration-1000`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white overflow-hidden relative group cursor-pointer border border-gray-800 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold">Looking for specific data?</h3>
                        <p className="text-gray-400 text-sm mt-1 max-w-lg">
                            If you need a custom report with specific data points or filters not shown above,
                            please contact the system administrator for a custom SQL export.
                        </p>
                    </div>
                    <Button variant="outline" className="border-gray-700 hover:bg-white hover:text-black text-gray-900 font-bold px-8 h-12 rounded-xl transition-all active:scale-95">
                        Request Custom Data
                    </Button>
                </div>
            </div>
        </div>
    );
}
