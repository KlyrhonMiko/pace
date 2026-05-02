"use client";

import { useEffect, useState } from "react";
import { Wrench, ShieldCheck } from "lucide-react";

/**
 * Listens for the "pace:maintenance" custom event dispatched by apiFetch
 * whenever the backend returns a 503 MAINTENANCE_MODE response.
 * Shows a full-screen overlay instead of a broken, error-filled dashboard.
 */
export function MaintenanceOverlay() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("The platform is currently under maintenance.");

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ message?: string }>).detail;
            if (detail?.message) setMessage(detail.message);
            setVisible(true);
        };
        window.addEventListener("pace:maintenance", handler);
        return () => window.removeEventListener("pace:maintenance", handler);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-md">
            <div className="max-w-md w-full mx-4 text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-xl shadow-amber-100/50">
                            <Wrench className="w-12 h-12 text-amber-500" strokeWidth={1.5} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
                            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Under Maintenance
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                        {message} Please check back shortly or contact your system administrator.
                    </p>
                </div>

                {/* Animated dots */}
                <div className="flex items-center justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>

                {/* Footer */}
                <p className="text-[11px] text-gray-300 font-medium uppercase tracking-widest">
                    PACE — Pasig Alumni &amp; Career Employment System
                </p>
            </div>
        </div>
    );
}
