"use client";

import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";

const recentApplications = [
    { id: 1, name: "Alice Johnson", role: "Software Engineer", status: "Review", time: "2 hours ago" },
    { id: 2, name: "Michael Smith", role: "Product Manager", status: "New", time: "5 hours ago" },
    { id: 3, name: "Emma Davis", role: "UX Designer", status: "Interviewing", time: "1 day ago" },
    { id: 4, name: "James Wilson", role: "Data Analyst", status: "Rejected", time: "2 days ago" },
];

export default function EmployerRecentApplications() {
    return (
        <div className="group/card flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <Users className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Recent Applications</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Evaluate latest candidate entries</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/employer/applications"
                    className="group flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all"
                >
                    View all
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Applied</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {recentApplications.map((app) => (
                            <tr key={app.id} className="group transition-all duration-200 hover:bg-slate-50/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 flex-none rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs ring-1 ring-black/5">
                                            {app.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {app.name}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-semibold text-emerald-700">{app.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${app.status === 'New' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                        app.status === 'Review' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                                            app.status === 'Interviewing' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                'bg-slate-50 text-slate-600 ring-slate-500/10'
                                        }`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-[10px] font-medium text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        {app.time}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

