import { Search, Filter, Mail, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

const applications = [
    { id: 1, applicant: "Alice Johnson", job: "Software Engineer", status: "Review", date: "Oct 24, 2026", email: "alice.j@example.com", matchScore: 92 },
    { id: 2, applicant: "Michael Smith", job: "Product Manager", status: "New", date: "Oct 24, 2026", email: "msmith@example.com", matchScore: 88 },
    { id: 3, applicant: "Emma Davis", job: "UI/UX Designer", status: "Interviewing", date: "Oct 23, 2026", email: "edavis@example.com", matchScore: 95 },
    { id: 4, applicant: "James Wilson", job: "Data Analyst", status: "Rejected", date: "Oct 21, 2026", email: "james.w@example.com", matchScore: 45 },
    { id: 5, applicant: "Sarah Miller", job: "Software Engineer", status: "New", date: "Oct 21, 2026", email: "sarahl@example.com", matchScore: 82 },
];

export default function EmployerApplicationsPage() {
    return (
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 h-72 w-72 rounded-full bg-teal-100/30 blur-3xl" />
            </div>

            {/* Header */}
            <PageHeader
                title="Candidate Applications"
                description="Review and manage incoming candidate applications across your job postings."
                currentPage="Applications"
                dashboardHref="/dashboard/employer"
                dashboardName="Employer Dashboard"
            />

            {/* Toolbar / Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm ring-1 ring-slate-200 flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                <div className="relative flex-1 max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:leading-6"
                        placeholder="Search applicants or job titles..."
                    />
                </div>

                <div className="flex flex-shrink-0 gap-3">
                    <select className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6">
                        <option>All Jobs</option>
                        <option>Software Engineer</option>
                        <option>Product Manager</option>
                    </select>
                    <button className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">
                        <Filter size={16} className="text-emerald-600" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Applications List */}
            <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden relative z-10">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Applicant</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Applied Role</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Match Score</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-emerald-100 flex justify-center items-center font-bold text-emerald-800 text-xs ring-1 ring-emerald-200">
                                                {app.applicant.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-900 transition-colors">{app.applicant}</p>
                                                <p className="text-xs text-gray-500">{app.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 font-medium">
                                        {app.job}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${app.status === 'New' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                            app.status === 'Review' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                                                app.status === 'Interviewing' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                    app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
                                                        'bg-gray-50 text-gray-600 ring-gray-200/50'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden ring-1 ring-gray-200">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${app.matchScore >= 80 ? 'bg-emerald-500' : app.matchScore >= 60 ? 'bg-amber-500' : 'bg-gray-400'}`}
                                                    style={{ width: `${app.matchScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{app.matchScore}%</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.date}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex justify-end gap-2">
                                            <button className="text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all bg-white rounded-lg p-2 shadow-sm ring-1 ring-gray-200 hover:ring-emerald-200" title="Contact Candidate">
                                                <Mail size={16} />
                                            </button>
                                            <button className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all bg-white rounded-lg p-2 shadow-sm ring-1 ring-gray-200 hover:ring-emerald-200" title="Accept/Proceed to next step">
                                                <CheckCircle size={16} />
                                            </button>
                                            <button className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all bg-white rounded-lg p-2 shadow-sm ring-1 ring-gray-200 hover:ring-red-200" title="Reject Candidate">
                                                <XCircle size={16} />
                                            </button>
                                            <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all bg-white rounded-lg p-2 shadow-sm ring-1 ring-gray-200" title="More Actions">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
