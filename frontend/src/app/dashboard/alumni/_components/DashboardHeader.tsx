"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DashboardHeaderProps {
    profile?: {
        first_name: string;
        last_name: string;
        profile_completeness?: number;
    } | null;
}

// Rotating daily focus pool — one is shown per day, indexed by day of year
const DAILY_FOCUS = [
    { focus: "Skills Update", tip: "Add a new skill — employers love candidates who keep learning.", href: "/dashboard/alumni/profile" },
    { focus: "Resume Polish", tip: "Refresh your resume — small tweaks leave big impressions.", href: "/dashboard/alumni/resumes" },
    { focus: "Career Insights", tip: "Run a fresh employability prediction to see where you stand.", href: "/dashboard/alumni/insights" },
    { focus: "Future Path", tip: "Explore your salary and career timeline forecast.", href: "/dashboard/alumni/predictions" },
    { focus: "New Opportunities", tip: "Browse openings tailored to your profile today.", href: "/dashboard/alumni/jobs" },
    { focus: "Stay Connected", tip: "Discover upcoming events and grow your network.", href: "/dashboard/alumni/events" },
    { focus: "Your Voice", tip: "Share feedback and help shape the alumni community.", href: "/dashboard/alumni/surveys" },
];

function getDailyFocus() {
    const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return DAILY_FOCUS[dayOfYear % DAILY_FOCUS.length];
}

export default function DashboardHeader({ profile }: DashboardHeaderProps) {
    const firstName = profile?.first_name || "Alumni";
    const lastName = profile?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "??";
    const completeness = profile?.profile_completeness ?? 0;

    const todayFocus = getDailyFocus();
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-500 px-6 py-6 text-white h-full w-full flex flex-col">
            {/* Decorative mesh */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
            </div>

            {/* Grid overlay pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: "24px 24px",
                }}
            />

            <div className="relative flex flex-col flex-1 justify-between gap-5">
                {/* Top: Welcome */}
                <div className="flex items-center gap-5 min-w-0">
                    {/* Profile Ring */}
                    <div className="relative flex-shrink-0 hidden sm:block">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                            <circle
                                cx="40"
                                cy="40"
                                r="34"
                                fill="none"
                                stroke="white"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${(completeness / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold">
                                {initials}
                            </div>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white text-emerald-800 flex items-center justify-center text-[10px] font-bold shadow-lg">
                            {completeness}%
                        </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                        <p className="text-emerald-100 text-[13px] font-medium italic leading-none">Welcome back,</p>
                        <h1 className="text-2xl lg:text-[26px] font-bold tracking-tight truncate leading-tight">
                            {fullName}
                        </h1>
                        <p className="text-emerald-100/80 text-[13px] max-w-md leading-snug line-clamp-1">
                            Your career journey is on track.{" "}
                            {completeness < 100
                                ? "Complete your profile to unlock more opportunities."
                                : "Your profile is fully optimized."}
                        </p>
                    </div>
                </div>

                {/* Bottom: Today's Focus link */}
                <Link
                    href={todayFocus.href}
                    className="group/focus relative block transition-all duration-300"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <span className="text-[13px] text-white/95 truncate font-medium block">
                                <span className="font-semibold tracking-tight">{todayFocus.focus}:</span>{" "}
                                <span className="text-white/85 italic">{todayFocus.tip}</span>
                            </span>
                        </div>

                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover/focus:bg-white/25 group-hover/focus:translate-x-0.5 transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
