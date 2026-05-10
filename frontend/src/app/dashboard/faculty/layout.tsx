"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";

import {
    Home,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    Briefcase,
    BarChart3,
    ChevronRight,
    ClipboardList,
    GraduationCap,
} from "lucide-react";
import DateWidget from "../_components/DateWidget";
import TopHeader from "../_components/TopHeader";

const navItems = [
    { name: "Overview", href: "/dashboard/faculty", icon: () => <Home size={18} /> },
    {
        name: "My Alumni",
        href: "/dashboard/faculty/alumnis",
        icon: () => <Users size={18} />,
    },
    { name: "Academic Structure", href: "/dashboard/faculty/academic", icon: () => <GraduationCap size={18} /> },
    { name: "Events", href: "/dashboard/faculty/events", icon: () => <Calendar size={18} /> },
    {
        name: "Job Board",
        href: "/dashboard/faculty/jobs",
        icon: () => <Briefcase size={18} />,
    },
    {
        name: "Reports",
        href: "/dashboard/faculty/reports",
        icon: () => <BarChart3 size={18} />,
    },
    {
        name: "Surveys",
        href: "/dashboard/faculty/surveys",
        icon: () => <ClipboardList size={18} />,
    },
];

export default function FacultyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user, logout, getDashboardUrl } = useAuth();
    const isProfileActive = pathname === "/dashboard/faculty/profile";
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user && user.user_type !== "STAFF") {
            router.replace(getDashboardUrl());
        }
    }, [user, getDashboardUrl, router]);

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
                    bg-white border-r border-gray-200/70
                    transition-all duration-300 ease-out lg:relative lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
                    flex flex-col overflow-hidden
                `}
            >
                {/* Logo Section */}
                <div className="flex-shrink-0 flex h-[72px] items-center justify-between px-6 border-b border-gray-200/70">
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
                            <span className="text-[10px] text-emerald-800 font-semibold tracking-[0.1em] uppercase mt-0.5">Faculty Portal</span>
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
                <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
                    <div className="px-3 mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Navigation</span>
                    </div>

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
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-white/95 rounded-r-full" />
                                    )}

                                    <span className={`
                                        flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? "bg-white/20 text-white"
                                            : "text-gray-500 group-hover:text-emerald-800 group-hover:bg-emerald-50"
                                        }
                                    `}>
                                        <item.icon />
                                    </span>

                                    <span className="flex-1 font-medium">{item.name}</span>

                                    {isActive && (
                                        <ChevronRight className="w-4 h-4 text-white/90" strokeWidth={2.5} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Preferences Section */}
                    <div className="mt-6">
                        <div className="px-3 mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Preferences</span>
                        </div>
                        <Link
                            href="/dashboard/faculty/settings"
                            className={`
                                group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                                transition-all duration-200 ease-out
                                ${pathname === "/dashboard/faculty/settings"
                                    ? "bg-emerald-700 text-white shadow-lg shadow-emerald-700/25"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/90 hover:shadow-sm"
                                }
                            `}
                        >
                            {pathname === "/dashboard/faculty/settings" && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-white/95 rounded-r-full" />
                            )}
                            <span className={`
                                flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                                ${pathname === "/dashboard/faculty/settings"
                                    ? "bg-white/20 text-white"
                                    : "text-gray-500 group-hover:text-emerald-800 group-hover:bg-emerald-50"
                                }
                            `}>
                                <Settings size={18} />
                            </span>
                            <span className="flex-1 font-medium">Settings</span>
                        </Link>
                    </div>


                </nav>

                {/* User Section — clickable, navigates to Profile */}
                <div className="flex-shrink-0 p-3 border-t border-emerald-100/60 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 rounded-xl p-2 transition-all duration-200 hover:bg-gray-50">
                        {/* Avatar + name link to Profile */}
                        <Link
                            href="/dashboard/faculty/profile"
                            className="flex items-center gap-3 flex-1 min-w-0 group/profile cursor-pointer rounded-lg p-1 -m-1"
                            title="View profile"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white bg-gradient-to-br from-emerald-600 to-emerald-800 ring-2 ring-white shadow-sm transition-transform duration-200 group-hover/profile:scale-105">
                                    {mounted ? (user?.first_name?.[0] || "S") + (user?.last_name?.[0] || "M") : "SM"}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white shadow-sm" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold truncate leading-tight tracking-[-0.01em]
                                    ${isProfileActive ? "text-emerald-900" : "text-gray-900"}
                                `}>
                                    {mounted ? (user?.first_name || "Staff") + " " + (user?.last_name || "Member") : "Staff Member"}
                                </p>
                                <p className={`text-[11px] truncate mt-0.5
                                    ${isProfileActive ? "text-emerald-700 font-medium" : "text-gray-500 group-hover/profile:text-emerald-700"}
                                `}>
                                    {isProfileActive ? "Viewing profile" : "View profile"}
                                </p>
                            </div>

                            <ChevronRight
                                className={`w-4 h-4 flex-shrink-0 transition-all duration-200
                                    ${isProfileActive
                                        ? "text-emerald-700 opacity-100"
                                        : "text-gray-300 opacity-0 group-hover/profile:opacity-100 group-hover/profile:text-emerald-700 group-hover/profile:translate-x-0.5"
                                    }
                                `}
                                strokeWidth={2.5}
                            />
                        </Link>

                        {/* Logout Button */}
                        <button
                            onClick={() => setIsLogoutModalOpen(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 flex-shrink-0 cursor-pointer"
                            title="Sign out"
                            aria-label="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Logout Confirmation Modal */}
                <LogoutConfirmModal
                    isOpen={isLogoutModalOpen}
                    onClose={() => setIsLogoutModalOpen(false)}
                    onConfirm={() => logout()}
                />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <TopHeader
                    setSidebarOpen={setSidebarOpen}
                    welcomePrefix="Welcome"
                    subtitle="Track alumni progress and manage your academic activities"
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50/80 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
