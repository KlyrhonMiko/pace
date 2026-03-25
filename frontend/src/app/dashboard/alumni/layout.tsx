"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";

import {
    Home,
    Briefcase,
    Calendar,
    User,
    Sparkles,
    Settings,
    LogOut,
    Bell,
    Menu,
    X,
    ChevronRight,
    Search,
} from "lucide-react";
import DateWidget from "../_components/DateWidget";

const navItems = [
    { name: "Overview", href: "/dashboard/alumni", icon: () => <Home size={18} /> },
    { name: "Job Listings", href: "/dashboard/alumni/jobs", icon: () => <Briefcase size={18} /> },
    { name: "Events", href: "/dashboard/alumni/events", icon: () => <Calendar size={18} /> },
    { name: "Employability Insights", href: "/dashboard/alumni/insights", icon: () => <Sparkles size={18} /> },
    { name: "Profile", href: "/dashboard/alumni/profile", icon: () => <User size={18} /> },
];

export default function AlumniLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen w-full bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-[280px] transform
                    bg-gradient-to-b from-gray-50 to-white border-r border-gray-200/80
                    transition-all duration-300 ease-out lg:relative lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
                    flex flex-col overflow-hidden
                `}
            >
                {/* Logo Section */}
                <div className="flex h-[72px] items-center justify-between px-6 border-b border-gray-200/60 bg-white/60 backdrop-blur-sm">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-10 w-10 flex-shrink-0">
                            <Image
                                src="/plp-logo.png"
                                alt="PLP Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[16px] font-bold text-gray-900 tracking-tight leading-tight">P.A.C.E.</span>
                            <span className="text-[10px] text-emerald-800 font-semibold tracking-[0.1em] uppercase mt-0.5">Alumni Portal</span>
                        </div>
                    </Link>
                    <button
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto px-3 py-6">
                    {/* Navigation Label */}
                    <div className="px-3 mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Navigation</span>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-0.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                                        transition-all duration-200 ease-out
                                        ${isActive
                                            ? "bg-emerald-700 text-white shadow-lg shadow-emerald-700/25"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-white/90 hover:shadow-sm"
                                        }
                                    `}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-white/95 rounded-r-full" />
                                    )}

                                    {/* Icon */}
                                    <span className={`
                                        flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? "bg-white/20 text-white"
                                            : "text-gray-500 group-hover:text-emerald-800 group-hover:bg-emerald-50"
                                        }
                                    `}>
                                        <item.icon />
                                    </span>

                                    {/* Label */}
                                    <span className="flex-1 font-medium">{item.name}</span>

                                    {/* Active arrow indicator */}
                                    {isActive && (
                                        <ChevronRight className="w-4 h-4 text-white/90" strokeWidth={2.5} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Preferences Section */}
                    <div className="mt-8">
                        <div className="px-3 mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Preferences</span>
                        </div>
                        <Link
                            href="/dashboard/alumni/settings"
                            className={`
                                group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                                transition-all duration-200 ease-out
                                ${pathname === "/dashboard/alumni/settings"
                                    ? "bg-emerald-700 text-white shadow-lg shadow-emerald-700/25"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/90 hover:shadow-sm"
                                }
                            `}
                        >
                            {pathname === "/dashboard/alumni/settings" && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-white/95 rounded-r-full" />
                            )}
                            <span className={`
                                flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                                ${pathname === "/dashboard/alumni/settings"
                                    ? "bg-white/20 text-white"
                                    : "text-gray-500 group-hover:text-emerald-800 group-hover:bg-emerald-50"
                                }
                            `}>
                                <Settings size={18} />
                            </span>
                            <span className="flex-1 font-medium">Settings</span>
                            {pathname === "/dashboard/alumni/settings" && (
                                <ChevronRight className="w-4 h-4 text-white/90" strokeWidth={2.5} />
                            )}
                        </Link>
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200/60 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-gray-50/80 to-white p-3.5 border border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-300/60 transition-all duration-200">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-800 text-xs font-bold text-white shadow-md ring-2 ring-white">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                            {/* Online status indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-600 rounded-full ring-2 ring-white shadow-sm" />
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">Alumni Profile</p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => setIsLogoutModalOpen(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 flex-shrink-0 cursor-pointer"
                            title="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Logout Confirmation Modal */}
                <LogoutConfirmModal
                    isOpen={isLogoutModalOpen}
                    onClose={() => setIsLogoutModalOpen(false)}
                    onConfirm={logout}
                />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
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
                                <h1 className="text-base font-semibold text-gray-900">Welcome back, {user?.first_name}!</h1>
                                <p className="text-xs text-gray-500 hidden sm:block">Here&apos;s what&apos;s happening with your career journey</p>
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
                                placeholder="Search jobs, events..."
                                className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none w-40 xl:w-48"
                            />
                            <kbd className="hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200/80 text-[10px] font-medium text-gray-500">
                                ⌘K
                            </kbd>
                        </div>

                        {/* Notifications */}
                        <button className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150">
                            <Bell size={20} />
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-bold text-white ring-2 ring-white">
                                3
                            </span>
                        </button>

                        {/* Settings */}
                        <button className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150">
                            <Settings className="h-5 w-5" strokeWidth={1.5} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50/80 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
