"use client";

import { Briefcase, Users, Eye, CheckCircle } from "lucide-react";

const stats = [
    {
        title: "Active Job Postings",
        value: "12",
        change: "+2 this month",
        icon: Briefcase,
        color: "bg-emerald-500",
    },
    {
        title: "Total Applications",
        value: "152",
        change: "+28 this week",
        icon: Users,
        color: "bg-teal-500",
    },
    {
        title: "Profile Views",
        value: "1,245",
        change: "+12% vs last month",
        icon: Eye,
        color: "bg-purple-500",
    },
    {
        title: "Hires Made",
        value: "8",
        change: "Current year",
        icon: CheckCircle,
        color: "bg-emerald-600",
    },
];

export default function EmployerStatsGrid() {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.title}
                    className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                    <dt>
                        <div className={`absolute rounded-xl p-3 ${stat.color} shadow-lg shadow-emerald-100`}>
                            {stat.icon && <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />}
                        </div>
                        <p className="ml-20 truncate text-sm font-medium text-gray-500">
                            {stat.title}
                        </p>
                    </dt>
                    <dd className="ml-20 flex items-baseline pb-1">
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="ml-2 flex items-baseline text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {stat.change}
                        </p>
                    </dd>
                </div>
            ))}
        </div>
    );
}
