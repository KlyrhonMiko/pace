"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
    name?: string;
    src?: string;
    className?: string;
}

export default function Avatar({ name, src, className }: AvatarProps) {
    const initials = name
        ? name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)
        : "?";

    return (
        <div 
            className={cn(
                "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 items-center justify-center",
                className
            )}
        >
            {src ? (
                <img 
                    src={src} 
                    alt={name || "Avatar"} 
                    className="aspect-square h-full w-full object-cover" 
                />
            ) : (
                <span className="text-xs font-bold text-gray-600">
                    {initials}
                </span>
            )}
        </div>
    );
}
