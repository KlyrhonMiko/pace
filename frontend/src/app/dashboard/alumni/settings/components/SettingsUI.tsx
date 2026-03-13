"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../../../../../lib/utils";
import { Button } from "../../../../../components/ui/button";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../../../../components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../../../../components/ui/popover";

export function Toggle({
    enabled,
    onChange,
    label,
    description,
}: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 group">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => onChange(!enabled)}
                className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2
                    ${enabled ? "bg-emerald-600" : "bg-gray-200"}
                `}
            >
                <span
                    className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
                        transition-transform duration-200 ease-in-out mt-0.5
                        ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}
                    `}
                />
            </button>
        </div>
    );
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    description,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    description?: string;
}) {
    const selectedLabel = options.find((opt) => opt.value === value)?.label || "Select option...";
    const [open, setOpen] = useState(false);

    return (
        <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                    )}
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full sm:w-40 justify-between rounded-xl border-gray-300 text-sm font-normal text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <span className="truncate">{selectedLabel}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] sm:w-40 p-0 rounded-xl" align="end">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    {options.map((opt) => (
                                        <CommandItem
                                            key={opt.value}
                                            value={opt.value}
                                            onSelect={(currentValue) => {
                                                onChange(currentValue);
                                                setOpen(false);
                                            }}
                                            className="text-sm cursor-pointer rounded-lg"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === opt.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {opt.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

export function SettingsCard({
    title,
    subtitle,
    icon,
    iconContainerClass,
    children,
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    iconContainerClass?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${iconContainerClass || "bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20"}`}
                >
                    {icon}
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-900">{title}</h2>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            <div className="px-6 py-2">{children}</div>
        </div>
    );
}

export function SaveIndicator({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Saved
        </span>
    );
}

export function Divider() {
    return <div className="border-t border-gray-100" />;
}
