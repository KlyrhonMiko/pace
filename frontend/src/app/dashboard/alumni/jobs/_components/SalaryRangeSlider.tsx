"use client";

import { useState, useRef, useEffect } from "react";

interface SalaryRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
}

export default function SalaryRangeSlider({
    min,
    max,
    step = 5,
    value,
    onChange,
}: SalaryRangeSliderProps) {
    const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: number) => {
        return `₱${amount}k`;
    };

    const getPercentage = (val: number) => {
        return ((val - min) / (max - min)) * 100;
    };

    const handleMouseDown = (thumb: "min" | "max") => {
        setIsDragging(thumb);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging || !sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const rawValue = min + (percentage / 100) * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;

        if (isDragging === "min") {
            const newMin = Math.min(steppedValue, value[1] - step);
            onChange([Math.max(min, newMin), value[1]]);
        } else {
            const newMax = Math.max(steppedValue, value[0] + step);
            onChange([value[0], Math.min(max, newMax)]);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                handleMove(e.clientX);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging && e.touches[0]) {
                e.preventDefault();
                handleMove(e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            setIsDragging(null);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleEnd);
            document.addEventListener("touchmove", handleTouchMove, { passive: false });
            document.addEventListener("touchend", handleEnd);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleEnd);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleEnd);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, value]);

    const minPercentage = getPercentage(value[0]);
    const maxPercentage = getPercentage(value[1]);

    return (
        <div className="space-y-4">
            {/* Value Display */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 mb-1">Min Salary</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(value[0])}</span>
                </div>
                <div className="flex-1 mx-3 border-t border-slate-200" />
                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 mb-1">Max Salary</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(value[1])}</span>
                </div>
            </div>

            {/* Slider */}
            <div className="relative pt-2 pb-6">
                <div
                    ref={sliderRef}
                    className="relative h-2 bg-slate-200 rounded-full cursor-pointer"
                    onClick={(e) => {
                        if (!isDragging) {
                            const rect = sliderRef.current!.getBoundingClientRect();
                            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                            const clickValue = min + (percentage / 100) * (max - min);

                            // Determine which thumb to move based on proximity
                            const distToMin = Math.abs(clickValue - value[0]);
                            const distToMax = Math.abs(clickValue - value[1]);

                            if (distToMin < distToMax) {
                                const newMin = Math.max(min, Math.min(Math.round(clickValue / step) * step, value[1] - step));
                                onChange([newMin, value[1]]);
                            } else {
                                const newMax = Math.min(max, Math.max(Math.round(clickValue / step) * step, value[0] + step));
                                onChange([value[0], newMax]);
                            }
                        }
                    }}
                >
                    {/* Active Range */}
                    <div
                        className="absolute top-0 h-full bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-full transition-all duration-150"
                        style={{
                            left: `${minPercentage}%`,
                            right: `${100 - maxPercentage}%`,
                        }}
                    />

                    {/* Min Thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-emerald-700 rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-150 z-10"
                        style={{ left: `${minPercentage}%` }}
                        onMouseDown={() => handleMouseDown("min")}
                        onTouchStart={() => handleMouseDown("min")}
                    >
                        <div className="absolute inset-0 rounded-full bg-emerald-700/20" />
                    </div>

                    {/* Max Thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-emerald-700 rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-150 z-10"
                        style={{ left: `${maxPercentage}%` }}
                        onMouseDown={() => handleMouseDown("max")}
                        onTouchStart={() => handleMouseDown("max")}
                    >
                        <div className="absolute inset-0 rounded-full bg-emerald-700/20" />
                    </div>
                </div>

                {/* Min/Max Labels */}
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatCurrency(min)}</span>
                    <span>{formatCurrency(max)}</span>
                </div>
            </div>
        </div>
    );
}
