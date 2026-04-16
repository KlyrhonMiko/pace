"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Action {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

interface ActionsCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
    actions?: Action[];
    placeholder?: string;
}

export default function ActionsCard({
    title,
    description,
    icon,
    searchQuery,
    setSearchQuery,
    actions = [],
    placeholder = "Search..."
}: ActionsCardProps) {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 h-fit">
            <div className="p-6">
                {/* Header with Icon */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {title}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Action Buttons */}
                    {actions.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                            {actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className={`flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${action.variant === 'primary'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        }`}
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Optional Search Bar */}
                    {setSearchQuery && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={placeholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
