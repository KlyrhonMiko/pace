"use client";

import { useEffect, useState } from "react";
import { Briefcase, Calendar, Target, UserCheck, Loader2, TrendingUp } from "lucide-react";
import { fetchAlumniStats, AlumniStats } from "../../_lib/dashboard";

export default function StatsGrid() {
    const [stats, setStats] = useState<AlumniStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            const data = await fetchAlumniStats();
            if (data) setStats(data);
            setLoading(false);
        }
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 h-full">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl bg-white border border-gray-100 p-5 flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                    </div>
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: "Events Registered",
            value: stats?.registered_events.toLocaleString() ?? "0",
            subValue: "Registered",
            icon: Calendar,
            color: "blue",
            sparkline: [4, 5, 6, 7, 8, 9, 10, 11, 10, 12]
        },
        {
            label: "Profile Completeness",
            value: `${stats?.profile_completeness ?? 0}%`,
            subValue: "Good",
            icon: UserCheck,
            color: "amber",
            sparkline: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6]
        }
    ];

    // Note: The layout uses a 2x2 grid in the Alumni dashboard Bento grid
    return (
        <div className="grid gap-4 sm:grid-cols-2 h-full">
            {statCards.map((card, i) => (
                <div key={i} className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-${card.color}-500 to-${card.color}-600 text-white shadow-lg shadow-${card.color}-500/25`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-${card.color}-800 bg-${card.color}-50 px-2 py-0.5 rounded-full`}>
                                {card.subValue}
                            </span>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{card.label}</p>
                    </div>
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
