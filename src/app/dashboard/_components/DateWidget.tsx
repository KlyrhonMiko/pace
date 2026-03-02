"use client";

import { useEffect, useState } from "react";

export default function DateWidget() {
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDate(new Date());
    }, []);

    if (!date) {
        return (
            <div className="hidden md:flex items-center gap-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm animate-pulse">
                <div className="w-11 h-11 bg-gray-200" />
                <div className="w-24 h-11 bg-white" />
            </div>
        );
    }

    const day = date.getDate();
    const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    const weekday = date.toLocaleString('default', { weekday: 'long' });

    return (
        <div className="hidden md:flex items-center gap-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="flex items-center justify-center w-11 h-11 bg-emerald-700 text-white">
                <span className="text-lg font-bold">{day}</span>
            </div>
            <div className="flex flex-col justify-center px-3 py-1 bg-white">
                <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">{monthYear}</span>
                <span className="text-[10px] text-gray-400 font-medium">{weekday}</span>
            </div>
        </div>
    );
}
