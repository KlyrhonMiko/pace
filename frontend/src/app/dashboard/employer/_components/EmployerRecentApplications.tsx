"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

const recentApplications = [
    { id: 1, name: "Alice Johnson", role: "Software Engineer", status: "Review", time: "2 hours ago" },
    { id: 2, name: "Michael Smith", role: "Product Manager", status: "New", time: "5 hours ago" },
    { id: 3, name: "Emma Davis", role: "UX Designer", status: "Interviewing", time: "1 day ago" },
    { id: 4, name: "James Wilson", role: "Data Analyst", status: "Rejected", time: "2 days ago" },
];

export default function EmployerRecentApplications() {
    return (
        <div className="flex flex-col h-full overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
                <h3 className="text-lg font-bold text-gray-900">Recent Applications</h3>
                <Link
                    href="/dashboard/employer/applications"
                    className="group flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-600 transition-colors"
                >
                    View all
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
            <ul className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                {recentApplications.map((app) => (
                    <li key={app.id} className="group relative flex items-center justify-between gap-4 px-6 py-5 hover:bg-emerald-50/30 transition-colors">
                        <div className="flex min-w-0 gap-4">
                            <div className="h-11 w-11 flex-none rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-800 font-bold text-sm ring-1 ring-emerald-100">
                                {app.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-auto">
                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-900 transition-colors">
                                    {app.name}
                                </p>
                                <p className="mt-1 truncate text-xs font-medium text-gray-500">
                                    Applied for <span className="text-emerald-700 font-semibold">{app.role}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold ring-1 ring-inset ${app.status === 'New' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                app.status === 'Review' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                                    app.status === 'Interviewing' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                        'bg-slate-50 text-slate-600 ring-slate-500/10'
                                }`}>
                                {app.status}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                <Clock className="w-3 h-3" />
                                {app.time}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
