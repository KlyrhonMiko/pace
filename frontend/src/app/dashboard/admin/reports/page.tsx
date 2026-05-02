"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { Download, FileText, Server, Users, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAdminStats, AdminStats } from "../../_lib/dashboard";

export default function AdminReportsPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function load() {
            try {
                const data = await fetchAdminStats();
                if (isMounted && data) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to load reports:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false; };
    }, []);

    const downloadCSV = (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;
        const keys = Object.keys(data[0]);
        const csvContent = [
            keys.join(","),
            ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-24 bg-gray-100 rounded-2xl w-full" />
                <div className="h-32 bg-gray-100 rounded-2xl w-full" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-gray-100 rounded-2xl w-full" />
                    <div className="lg:col-span-2 h-64 bg-gray-100 rounded-2xl w-full" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Failed to load reports</h3>
                <p className="text-sm text-gray-500">We couldn't retrieve the system data at this time. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-[-1]">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-100 opacity-20 blur-3xl" />
            </div>

            <PageHeader
                title="System Data & Reports"
                description="Detailed tabular data, system health metrics, and user activity fetched directly from the database."
                currentPage="Reports"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            >
                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        onClick={() => downloadCSV("platform_activity_log.csv", stats.activity_log)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm h-11 px-8 rounded-xl font-bold gap-2.5 shadow-lg shadow-emerald-700/20 active:scale-95 transition-all">
                        <Download size={16} />
                        Export Full Report (CSV)
                    </Button>
                </div>
            </PageHeader>

            {/* System Health Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Server className="h-5 w-5 text-emerald-600" />
                            Live System Health
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Real-time metrics from the application server and database.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Online
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-gray-50/30">
                    <div className="p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Server Uptime</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.system_health.uptime}</p>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Database Latency</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.system_health.latency}</p>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Platform Jobs</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.active_jobs.toLocaleString()}</p>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Cache Status</p>
                        <p className="text-2xl font-black text-emerald-600 tracking-tight">{stats.system_health.cache_status}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* User Distribution Details */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Role Distribution
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Breakdown of the {stats.total_users.toLocaleString()} total users.</p>
                    </div>
                    <div className="p-0 flex-1">
                        <ul className="divide-y divide-gray-50 h-full flex flex-col">
                            {stats.user_distribution.map((item, idx) => (
                                <li key={idx} className="p-6 flex-1 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-3.5 w-3.5 rounded-full bg-${item.color}-500 shadow-sm`} />
                                        <span className="font-semibold text-gray-900">{item.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 text-lg">{item.value.toLocaleString()}</div>
                                        <div className="text-xs font-medium text-gray-400">{item.percentage}% of total</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recent Registrations Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Recent Registrations</h3>
                            <p className="text-sm text-gray-500 mt-1">Latest users who joined the platform.</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-9 text-xs font-bold border-gray-200" onClick={() => downloadCSV("recent_registrations.csv", stats.recent_registrations)}>
                            <Download className="mr-2 h-3.5 w-3.5" /> Export Data
                        </Button>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-[11px] text-gray-500 bg-gray-50/80 border-b border-gray-100 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Assigned Role</th>
                                    <th className="px-6 py-4">Account Status</th>
                                    <th className="px-6 py-4">Registration Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {stats.recent_registrations.map((user, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${user.color} shadow-sm`}>
                                                    {user.initials}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-gray-500 font-medium">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{user.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                                                user.status === 'verified' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                                                : 'bg-amber-50 text-amber-700 border-amber-200/50'
                                            }`}>
                                                {user.status === 'verified' ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {new Date(user.joined_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                {stats.recent_registrations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No recent registrations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* System Activity Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-violet-600" />
                            Detailed System Activity Log
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Chronological record of recent platform events and transactions.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 bg-gray-50/80 border-b border-gray-100 uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4 w-56">Timestamp</th>
                                <th className="px-6 py-4 w-40">Event Type</th>
                                <th className="px-6 py-4">Event Description</th>
                                <th className="px-6 py-4 w-40 text-right">Reference ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {stats.activity_log.map((activity, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap flex items-center gap-2 font-medium">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        {new Date(activity.created_at).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
                                            {activity.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {activity.description}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right truncate max-w-[120px]">
                                        {activity.id.split('-')[0]}
                                    </td>
                                </tr>
                            ))}
                            {stats.activity_log.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No recent activity found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

