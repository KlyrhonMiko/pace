"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Bell, X, CheckCheck, ExternalLink } from "lucide-react";
import DateWidget from "./DateWidget";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
    setSidebarOpen: (open: boolean) => void;
    roleName?: string;
    welcomePrefix?: string;
    subtitle?: string;
}

export default function DashboardHeader({
    setSidebarOpen,
    roleName = "User",
    welcomePrefix = "Welcome back",
    subtitle = "Here's what's happening today"
}: DashboardHeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.access_token || null);

    const [mounted, setMounted] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function formatTime(iso: string) {
        // If it's a naive ISO string (no Z or offset), assume UTC
        let normalizedIso = iso;
        if (iso.includes("T") && !iso.endsWith("Z") && !iso.includes("+")) {
            normalizedIso += "Z";
        }

        const d = new Date(normalizedIso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    async function handleNotificationClick(id: string, link?: string | null) {
        await markAsRead(id);
        if (link) {
            setPanelOpen(false);
            router.push(link);
        }
    }

    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150 lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <DateWidget />
                    <div className="h-8 w-px bg-gray-200 hidden md:block" />
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">
                            {mounted ? `${welcomePrefix}, ${user?.first_name || roleName}!` : "Welcome back!"}
                        </h1>
                        <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <div className="relative" ref={panelRef}>
                    <button
                        id="notification-bell"
                        className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150"
                        onClick={() => setPanelOpen((prev) => !prev)}
                        aria-label="Toggle notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-bold text-white ring-2 ring-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown Panel */}
                    {panelOpen && (
                        <div className="absolute right-0 top-11 z-50 w-96 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden"
                            style={{ animation: "slideDown 0.15s ease-out" }}>
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Bell size={15} className="text-emerald-700" />
                                    <span className="text-sm font-semibold text-gray-800">Notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck size={13} />
                                            Mark all as read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setPanelOpen(false)}
                                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Bell size={28} className="mb-2 opacity-30" />
                                        <p className="text-sm font-medium">No notifications yet</p>
                                        <p className="text-xs mt-1 opacity-70">We'll let you know when something happens.</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <button
                                            key={n.id}
                                            className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group ${!n.is_read ? "bg-emerald-50/60" : ""}`}
                                            onClick={() => handleNotificationClick(n.id, n.link)}
                                        >
                                            {/* Unread dot */}
                                            <span className={`mt-2 h-2 w-2 rounded-full flex-shrink-0 transition-all ${!n.is_read ? "bg-emerald-600" : "bg-transparent"}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${!n.is_read ? "text-gray-900" : "text-gray-700"}`}>
                                                    {n.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                <p className="text-[11px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                                            </div>
                                            {n.link && (
                                                <ExternalLink size={13} className="text-gray-300 group-hover:text-emerald-600 flex-shrink-0 mt-1 transition-colors" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </header>
    );
}
