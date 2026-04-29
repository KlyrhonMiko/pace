"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface FilterSectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    count?: number;
}

export default function FilterSection({
    title,
    icon,
    children,
    defaultExpanded = true,
    count,
}: FilterSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="border-b border-slate-200 last:border-b-0">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full py-4 text-left hover:bg-slate-50/50 transition-colors rounded-lg px-1"
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-emerald-800">{icon}</span>}
                    <span className="text-sm font-semibold text-slate-800">{title}</span>
                    {count !== undefined && (
                        <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                            {count}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="px-1">{children}</div>
            </div>
        </div>
    );
}
