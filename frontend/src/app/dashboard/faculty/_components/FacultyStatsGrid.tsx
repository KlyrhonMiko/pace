"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, CalendarDays, Target, Briefcase, Loader2 } from "lucide-react";
import { fetchFacultyStats, FacultyStats } from "../../_lib/dashboard";

export default function FacultyStatsGrid() {
    const [stats, setStats] = useState<FacultyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            const data = await fetchFacultyStats();
            if (data) setStats(data);
            setLoading(false);
        }
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-h-[140px]">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl bg-white border border-gray-100 p-5 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                    </div>
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: "Alumni",
            value: (stats?.alumni_advised ?? 0).toLocaleString(),
            subValue: "+8",
            icon: Users,
            color: "emerald",
            sparkline: [3, 5, 4, 7, 6, 8, 9, 7, 10, 12]
        },
        {
            label: "Events Organized",
            value: (stats?.events_organized ?? 0).toLocaleString(),
            subValue: "+3",
            icon: CalendarDays,
            color: "blue",
            sparkline: [4, 6, 5, 8, 7, 9, 8, 10, 9, 11]
        },
        {
            label: "Job Listings",
            value: (stats?.active_jobs ?? 0).toLocaleString(),
            subValue: "+12",
            icon: Briefcase,
            color: "amber",
            sparkline: [2, 4, 6, 5, 8, 7, 9, 10, 8, 12]
        }
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card, i) => (
                <div key={i} className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-${card.color}-500 to-${card.color}-600 text-white shadow-lg shadow-${card.color}-500/25`}>
                            <card.icon className="h-5 w-5" />
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold text-${card.color}-800 bg-${card.color}-50 px-2 py-0.5 rounded-full`}>
                            <TrendingUp className="h-3 w-3" />
                            {card.subValue}
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">{card.label}</p>
                    <div className="flex items-end gap-[3px] mt-3 h-6">
                        {card.sparkline.map((v, idx) => (
                            <div key={idx} className={`flex-1 rounded-sm bg-${card.color}-100 group-hover:bg-${card.color}-200 transition-colors`} style={{ height: `${(v / 12) * 100}%` }} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
