"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

interface DateTimePickerProps {
    date?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    /** Earliest selectable date/time. */
    min?: Date;
    /** Latest selectable date/time. */
    max?: Date;
    /** Step in seconds for the time portion. Use 60 for whole minutes (default), 300 for 5-minute steps. */
    stepSeconds?: number;
    id?: string;
    name?: string;
}

/**
 * A date + time picker built on the browser-native `<input type="datetime-local">`.
 *
 * Why native: the popup UI is provided and optimised by the browser/OS (Chrome/Edge
 * give a combined calendar + clock picker; mobile shows the platform's native
 * wheel picker; Firefox gives segmented inputs). It is fully accessible and the
 * user is already familiar with it.
 */
export function DateTimePicker({
    date,
    onChange,
    placeholder,
    className,
    disabled = false,
    min,
    max,
    stepSeconds = 60,
    id,
    name,
}: DateTimePickerProps) {
    const value = date ? toLocalInputValue(date) : "";
    const minStr = min ? toLocalInputValue(min) : undefined;
    const maxStr = max ? toLocalInputValue(max) : undefined;
    const displayValue = date ? format(date, "MMM d, yyyy 'at' h:mm a") : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (!v) {
            onChange?.(undefined);
            return;
        }
        const next = new Date(v);
        if (!isNaN(next.getTime())) onChange?.(next);
    };

    return (
        <div
            className={cn(
                "relative w-full h-11 rounded-xl border border-slate-200 bg-white transition-all shadow-xs flex items-center overflow-hidden",
                "focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-700/20",
                disabled && "cursor-not-allowed opacity-60 bg-slate-50",
                className
            )}
        >
            <CalendarDays
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
            />

            <div className="pl-10 pr-10 text-sm text-slate-900 truncate w-full pointer-events-none">
                {displayValue || <span className="text-slate-400">{placeholder}</span>}
            </div>

            <input
                id={id}
                name={name}
                type="datetime-local"
                value={value}
                onChange={handleChange}
                disabled={disabled}
                min={minStr}
                max={maxStr}
                step={stepSeconds}
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

/** Format a Date as `YYYY-MM-DDTHH:mm` in **local** time, which is what `<input type="datetime-local">` expects. */
function toLocalInputValue(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
}
