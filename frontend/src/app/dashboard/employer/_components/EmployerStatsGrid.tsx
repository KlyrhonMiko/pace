"use client";

import { Briefcase, Users, Eye, CheckCircle, ArrowUp } from "lucide-react";

const stats = [
    {
        title: "Active Job Postings",
        value: "12",
        change: "+2",
        icon: Briefcase,
        color: "emerald",
        sparkline: [3, 5, 4, 7, 6, 8, 9, 7, 10, 12]
    },
    {
        title: "Total Applications",
        value: "152",
        change: "+28",
        icon: Users,
        color: "blue",
        sparkline: [4, 6, 5, 8, 7, 9, 8, 10, 9, 11]
    },
    {
        title: "Profile Views",
        value: "1,245",
        change: "+12%",
        icon: Eye,
        color: "violet",

        sparkline: [2, 4, 3, 5, 4, 6, 7, 5, 8, 9]
    },
    {
        title: "Hires Made",
        value: "8",
        change: "+1",
        icon: CheckCircle,
        color: "amber",

        sparkline: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6]
    },
];


export default function EmployerStatsGrid() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
                <div
                    key={stat.title}
                    className="group/card relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:border-emerald-200 hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 text-white shadow-lg shadow-${stat.color}-500/20`}>
                            {stat.icon && <stat.icon className="h-5 w-5" strokeWidth={2} />}
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold text-${stat.color}-700 bg-${stat.color}-50 px-2.5 py-0.5 rounded-full border border-${stat.color}-100`}>
                            <ArrowUp className="h-3 w-3" />
                            {stat.change}
                        </span>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{stat.title}</p>
                    </div>

                    {/* Sparkline Graph */}
                    <div className="flex items-end gap-[3px] mt-3 h-6">
                        {stat.sparkline.map((v, idx) => (
                            <div
                                key={idx}
                                className={`flex-1 rounded-sm bg-${stat.color}-100 group-hover:bg-${stat.color}-200 transition-colors`}
                                style={{ height: `${(v / 12) * 100}%` }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>

    );
}
