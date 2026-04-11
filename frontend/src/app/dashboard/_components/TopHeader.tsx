"use client";

import { useState, useEffect } from "react";
import { Menu, Search, Bell, Settings } from "lucide-react";
import DateWidget from "./DateWidget";
import { useAuth } from "@/context/AuthContext";

interface DashboardHeaderProps {
    setSidebarOpen: (open: boolean) => void;
    roleName?: string;
    searchPlaceholder?: string;
    notificationCount?: number;
    welcomePrefix?: string;
    subtitle?: string;
}

export default function DashboardHeader({
    setSidebarOpen,
    roleName = "User",
    searchPlaceholder = "Search...",
    notificationCount = 0,
    welcomePrefix = "Welcome back",
    subtitle = "Here's what's happening today"
}: DashboardHeaderProps) {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                    {/* Date Badge */}
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
                {/* Search */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors duration-150 group">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none w-40 xl:w-48"
                    />
                    <kbd className="hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200/80 text-[10px] font-medium text-gray-500">
                        ⌘K
                    </kbd>
                </div>

                {/* Notifications */}
                <button className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150">
                    <Bell size={20} />
                    {notificationCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-bold text-white ring-2 ring-white">
                            {notificationCount}
                        </span>
                    )}
                </button>

                {/* Settings */}
                <button className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150">
                    <Settings className="h-5 w-5" strokeWidth={1.5} />
                </button>
            </div>
        </header>
    );
}
