"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";

import {
    Home,
    Briefcase,
    Calendar,
    FileText,
    ClipboardList,
    ClipboardCheck,
    Sparkles,
    TrendingUp,
    Settings,
    LogOut,
    X,
    ChevronRight,
    Compass,
    Rocket,
} from "lucide-react";
import TopHeader from "../_components/TopHeader";

type NavLeaf = {
    name: string;
    href: string;
    icon: React.ReactNode;
};

type NavGroup = {
    id: string;
    name: string;
    icon: React.ReactNode;
    items: NavLeaf[];
};

type NavEntry =
    | ({ kind: "leaf" } & NavLeaf)
    | ({ kind: "group" } & NavGroup);

const navEntries: NavEntry[] = [
    {
        kind: "leaf",
        name: "Overview",
        href: "/dashboard/alumni",
        icon: <Home size={18} />,
    },
    {
        kind: "group",
        id: "career",
        name: "Career",
        icon: <Briefcase size={18} />,
        items: [
            {
                name: "Job Listings",
                href: "/dashboard/alumni/jobs",
                icon: <Briefcase size={16} />,
            },
            {
                name: "Applications",
                href: "/dashboard/alumni/applications",
                icon: <ClipboardCheck size={16} />,
            },
            {
                name: "Resumes",
                href: "/dashboard/alumni/resumes",
                icon: <FileText size={16} />,
            },
        ],
    },
    {
        kind: "group",
        id: "growth",
        name: "Growth",
        icon: <Rocket size={18} />,
        items: [
            {
                name: "Employability Insights",
                href: "/dashboard/alumni/insights",
                icon: <Sparkles size={16} />,
            },
            {
                name: "Career Predictions",
                href: "/dashboard/alumni/predictions",
                icon: <TrendingUp size={16} />,
            },
        ],
    },
    {
        kind: "group",
        id: "engage",
        name: "Engage",
        icon: <Compass size={18} />,
        items: [
            {
                name: "Events",
                href: "/dashboard/alumni/events",
                icon: <Calendar size={16} />,
            },
            {
                name: "Surveys",
                href: "/dashboard/alumni/surveys",
                icon: <ClipboardList size={16} />,
            },
        ],
    },
];

const EXPANDED_STORAGE_KEY = "alumni:sidebar:expandedGroup";

export default function AlumniLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user, logout } = useAuth();

    // Auto-expand the group that contains the current route.
    const activeGroupId = useMemo(() => {
        for (const entry of navEntries) {
            if (entry.kind === "group") {
                if (entry.items.some((it) => pathname === it.href)) {
                    return entry.id;
                }
            }
        }
        return null;
    }, [pathname]);

    // Accordion: only one group expanded at a time so the sidebar never scrolls.
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Hydrate from localStorage; the active group always wins.
    useEffect(() => {
        setMounted(true);
        let stored: string | null = null;
        try {
            stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
        } catch {
            stored = null;
        }
        setExpandedGroup(activeGroupId ?? stored);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Whenever the route changes into a group, switch the expanded group to it.
    useEffect(() => {
        if (activeGroupId) setExpandedGroup(activeGroupId);
    }, [activeGroupId]);

    const toggleGroup = (id: string) => {
        setExpandedGroup((prev) => {
            const next = prev === id ? null : id;
            try {
                if (next) localStorage.setItem(EXPANDED_STORAGE_KEY, next);
                else localStorage.removeItem(EXPANDED_STORAGE_KEY);
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    const isProfileActive = pathname === "/dashboard/alumni/profile";
    const isSettingsActive = pathname === "/dashboard/alumni/settings";

    const renderLeaf = (
        href: string,
        name: string,
        icon: React.ReactNode,
        isActive: boolean,
    ) => (
        <Link
            href={href}
            className={`
                group/leaf relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-200 ease-out
                ${isActive
                    ? "bg-emerald-700 text-white shadow-md shadow-emerald-900/20"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }
            `}
        >
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full" />
            )}
            <span className={`
                flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                ${isActive
                    ? "bg-white/15 text-white"
                    : "text-gray-500 group-hover/leaf:text-emerald-700 group-hover/leaf:bg-emerald-50"
                }
            `}>
                {icon}
            </span>
            <span className="flex-1 font-medium tracking-[-0.01em]">{name}</span>
        </Link>
    );

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
                            <span className="text-[10px] text-emerald-800 font-semibold tracking-[0.12em] uppercase mt-0.5">Alumni Portal</span>
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
                <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-5">
                    {/* Navigation Label */}
                    <div className="px-3 mb-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.18em]">Navigation</span>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-0.5">
                        {navEntries.map((entry) => {
                            if (entry.kind === "leaf") {
                                const isActive = pathname === entry.href;
                                return (
                                    <div key={entry.href}>
                                        {renderLeaf(entry.href, entry.name, entry.icon, isActive)}
                                    </div>
                                );
                            }

                            // Group entry
                            const isOpen = expandedGroup === entry.id;
                            const hasActiveChild = entry.items.some((it) => pathname === it.href);

                            return (
                                <div key={entry.id} className="select-none">
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(entry.id)}
                                        aria-expanded={isOpen}
                                        className={`
                                            group/grp relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                                            transition-colors duration-200 ease-out cursor-pointer
                                            ${hasActiveChild
                                                ? "text-gray-900"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-white"
                                            }
                                        `}
                                    >
                                        <span className={`
                                            flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                                            ${hasActiveChild
                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                                : "text-gray-500 group-hover/grp:text-emerald-700 group-hover/grp:bg-emerald-50"
                                            }
                                        `}>
                                            {entry.icon}
                                        </span>
                                        <span className="flex-1 text-left font-medium tracking-[-0.01em]">{entry.name}</span>
                                        {hasActiveChild && !isOpen && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full bg-emerald-600"
                                                style={{ boxShadow: "0 0 0 3px rgba(16,185,129,0.18)" }}
                                                aria-hidden
                                            />
                                        )}
                                        <ChevronRight
                                            className={`w-4 h-4 transition-transform duration-300 ease-out
                                                ${isOpen ? "rotate-90 text-emerald-700" : "text-gray-400 group-hover/grp:text-gray-600"}
                                            `}
                                            strokeWidth={2.5}
                                        />
                                    </button>

                                    {/* Collapsible children */}
                                    <div
                                        className={`grid transition-all duration-300 ease-out
                                            ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
                                        `}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="relative mt-1 mb-1 pl-[30px] pr-1">
                                                {/* Vertical guide aligned with parent icon center */}
                                                <span
                                                    className={`absolute left-[30px] top-1 bottom-1 w-px transition-colors duration-200
                                                        ${hasActiveChild ? "bg-emerald-200" : "bg-gray-200"}
                                                    `}
                                                    aria-hidden
                                                />
                                                <div className="space-y-0.5 pl-3">
                                                    {entry.items.map((it) => {
                                                        const childActive = pathname === it.href;
                                                        return (
                                                            <Link
                                                                key={it.href}
                                                                href={it.href}
                                                                className={`
                                                                    group/sub relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium
                                                                    transition-colors duration-200 ease-out
                                                                    ${childActive
                                                                        ? "bg-emerald-100/70 text-emerald-900"
                                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                                                                    }
                                                                `}
                                                            >
                                                                <span className={`
                                                                    flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-200
                                                                    ${childActive
                                                                        ? "text-emerald-700"
                                                                        : "text-gray-400 group-hover/sub:text-emerald-700"
                                                                    }
                                                                `}>
                                                                    {it.icon}
                                                                </span>
                                                                <span className={`flex-1 truncate ${childActive ? "font-semibold" : ""}`}>
                                                                    {it.name}
                                                                </span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Preferences Section */}
                    <div className="mt-6">
                        <div className="px-3 mb-2">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.18em]">Preferences</span>
                        </div>
                        {renderLeaf("/dashboard/alumni/settings", "Settings", <Settings size={18} />, isSettingsActive)}
                    </div>
                </nav>

                {/* User Section — clickable, navigates to Profile */}
                <div className="flex-shrink-0 p-3 border-t border-gray-200/70">
                    <div
                        className={`flex items-center gap-2 rounded-xl p-2 transition-all duration-200
                            ${isProfileActive
                                ? "bg-emerald-50/80 ring-1 ring-emerald-100"
                                : "hover:bg-gray-50"
                            }
                        `}
                    >
                        {/* Avatar + name link to Profile */}
                        <Link
                            href="/dashboard/alumni/profile"
                            className="flex items-center gap-3 flex-1 min-w-0 group/profile cursor-pointer rounded-lg p-1 -m-1"
                            title="View profile"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white bg-gradient-to-br from-emerald-600 to-emerald-800 ring-2 ring-white shadow-sm transition-transform duration-200 group-hover/profile:scale-105">
                                    {mounted ? (user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") : ""}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold truncate leading-tight tracking-[-0.01em]
                                    ${isProfileActive ? "text-emerald-900" : "text-gray-900"}
                                `}>
                                    {mounted ? `${user?.first_name || ""} ${user?.last_name || ""}` : "Loading..."}
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
                    welcomePrefix="Welcome back"
                    subtitle="Here's what's happening with your career journey"
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50/80 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
