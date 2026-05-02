import { Users, ArrowUp, GraduationCap, Briefcase } from "lucide-react";
import { AdminStats } from "../../_lib/dashboard";

interface AdminStatsGridProps {
    stats?: AdminStats;
}

export default function AdminStatsGrid({ stats }: AdminStatsGridProps) {
    if (!stats) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[120px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: "Total Users",
            value: stats.total_users.toLocaleString(),
            subValue: "+48",
            icon: Users,
            color: "emerald",
            sparkline: [3, 5, 4, 7, 6, 8, 9, 7, 10, 12]
        },
        {
            label: "Verified Alumni",
            value: stats.verified_alumni.toLocaleString(),
            subValue: "+32",
            icon: GraduationCap,
            color: "blue",
            sparkline: [4, 6, 5, 8, 7, 9, 8, 10, 9, 11]
        },
        {
            label: "Active Jobs",
            value: stats.active_jobs.toLocaleString(),
            subValue: "+12",
            icon: Briefcase,
            color: "violet",
            sparkline: [2, 4, 3, 5, 4, 6, 7, 5, 8, 9]
        }
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card, i) => (
                <div key={i} className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-${card.color}-500 to-${card.color}-600 text-white shadow-lg`}>
                            <card.icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold text-${card.color}-800 bg-${card.color}-50 px-2 py-0.5 rounded-full`}>
                            <ArrowUp className="h-3 w-3" />
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
