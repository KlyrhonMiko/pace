import { Wrench, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Under Maintenance — PACE",
    description: "The PACE platform is temporarily under maintenance.",
};

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-2xl shadow-amber-100/60">
                            <Wrench className="w-14 h-14 text-amber-500" strokeWidth={1.5} />
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Under Maintenance
                    </h1>
                    <p className="text-gray-500 leading-relaxed">
                        The PACE platform is temporarily offline for scheduled maintenance.
                        Please check back shortly.
                    </p>
                </div>

                {/* Animated dots */}
                <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>

                {/* Back link */}
                <div className="pt-2">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        ← Return to Home
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-[11px] text-gray-300 font-medium uppercase tracking-widest pt-4">
                    PACE — Pasig Alumni &amp; Career Employment System
                </p>
            </div>
        </div>
    );
}
