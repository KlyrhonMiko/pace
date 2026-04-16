"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date | string;
    onChange?: (date: string) => void;
    placeholder?: string;
    className?: string;
    fromYear?: number;
    toYear?: number;
    captionLayout?: "label" | "dropdown";
    disabled?: boolean;
}

export function DatePicker({
    date,
    onChange,
    placeholder = "Pick a date",
    className,
    fromYear = 1900,
    toYear = new Date().getFullYear() + 10,
    captionLayout = "dropdown",
    disabled = false,
}: DatePickerProps) {
    const dateValue = React.useMemo(() => {
        if (!date) return undefined;
        const d = new Date(date);
        return isNaN(d.getTime()) ? undefined : d;
    }, [date]);

    return (
        <Popover>
            <PopoverTrigger asChild disabled={disabled}>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal h-11 rounded-xl border-slate-200 bg-slate-50 px-3.5 focus:border-emerald-600 focus:ring-emerald-700/20",
                        !dateValue && "text-muted-foreground",
                        disabled && "opacity-100 bg-slate-50 text-slate-500 cursor-default",
                        className
                    )}
                >
                    <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />
                    {dateValue ? (
                        format(dateValue, "PPP")
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[110]" align="start">
                <Calendar
                    mode="single"
                    captionLayout={captionLayout}
                    fromYear={fromYear}
                    toYear={toYear}
                    selected={dateValue}
                    onSelect={(d) => {
                        if (d) {
                            onChange?.(format(d, "yyyy-MM-dd"));
                        }
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
