"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Users, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatDistanceToNow, parseISO } from "date-fns";

interface Application {
    id: string;
    applicant: string;
    job: string;
    status: string;
    date: string;
    email: string;
}

interface ApplicationResponse {
    success: boolean;
    message: string;
    data: Application[];
}

export default function EmployerRecentApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecentApplications = async () => {
            try {
                setIsLoading(true);
                const response = await apiFetch<ApplicationResponse>("/employers/applications?limit=5");
                if (response.success) {
                    setApplications(response.data);
                }
            } catch (error) {
                console.error("Error fetching recent applications:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentApplications();
    }, []);

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

            <div className="flex-1 overflow-x-auto custom-scrollbar relative min-h-[300px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-xs font-medium text-gray-400">Loading applications...</p>
                        </div>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">No applications yet</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                            New applications for your job postings will appear here.
                        </p>
                    </div>
                ) : (
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
                            {applications.map((app) => (
                                <tr key={app.id} className="group transition-all duration-200 hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex-none rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs ring-1 ring-black/5">
                                                {app.applicant.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {app.applicant}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-emerald-700 truncate block max-w-[150px]">{app.job}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${app.status === 'Pending' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                            app.status === 'Reviewed' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                                                app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                    'bg-slate-50 text-slate-600 ring-slate-500/10'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-medium text-gray-400 whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(app.date), { addSuffix: true })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

