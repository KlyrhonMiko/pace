import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ProfileStrengthProps {
    percentage?: number;
}

export default function ProfileStrength({ percentage = 75 }: ProfileStrengthProps) {
    const circumference = 2 * Math.PI * 40;
    const filled = (percentage / 100) * circumference;

    return (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-700 to-teal-500 p-5 text-white relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-400/20 blur-xl" />

            <div className="relative flex items-center gap-4">
                {/* Circular Progress */}
                <div className="relative flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                        <circle
                            cx="48" cy="48" r="40" fill="none"
                            stroke="white" strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${filled} ${circumference}`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-extrabold">{percentage}%</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">Profile Strength</h3>
                    <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                        {percentage < 100 
                            ? "Add work experience and upload your resume to reach 100%."
                            : "Your profile is looking great! You're ready for opportunities."}
                    </p>
                    {percentage < 100 && (
                        <Link
                            href="/dashboard/alumni/profile"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/30 border border-white/10"
                        >
                            Complete Profile
                            <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
