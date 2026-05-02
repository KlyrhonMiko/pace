"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
    date?: Date | string;
    onChange?: (date: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
}

export function DatePicker({
    date,
    onChange,
    placeholder = "Pick a date",
    className,
    disabled = false,
    id,
    name,
}: DatePickerProps) {
    const dateValue = React.useMemo(() => {
        if (!date) return undefined;
        const d = typeof date === "string" ? new Date(date) : date;
        return isNaN(d.getTime()) ? undefined : d;
    }, [date]);

    const value = dateValue ? dateValue.toISOString().split("T")[0] : "";
    const displayValue = dateValue ? format(dateValue, "PPP") : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (!v) {
            onChange?.("");
            return;
        }
        onChange?.(v);
    };

    return (
        <div
            className={cn(
                "relative w-full h-11 border border-slate-200 transition-all flex items-center overflow-hidden",
                "rounded-md bg-white shadow-xs", // Defaults
                "focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-700/20",
                disabled && "cursor-not-allowed opacity-60 bg-slate-50",
                className
            )}
        >
            <CalendarDays
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10"
            />

            <div className="pl-10 pr-10 text-sm text-slate-900 truncate w-full pointer-events-none">
                {displayValue || <span className="text-slate-400">{placeholder}</span>}
            </div>

            <input
                id={id}
                name={name}
                type="date"
                value={value}
                onChange={handleChange}
                disabled={disabled}
                aria-label={placeholder}
                className={cn(
                    "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                    "[&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                    "disabled:cursor-not-allowed"
                )}
                onClick={(e) => {
                    if ("showPicker" in e.currentTarget) {
                        try {
                            e.currentTarget.showPicker();
                        } catch (err) {
                            console.error("showPicker failed", err);
                        }
                    }
                }}
            />
        </div>
    );
}
