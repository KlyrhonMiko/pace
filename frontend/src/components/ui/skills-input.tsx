"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillsInputProps {
    skills: string[];
    onChange: (skills: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    maxSkills?: number;
}

export function SkillsInput({
    skills,
    onChange,
    disabled = false,
    placeholder = "Type a skill and press Enter",
    maxSkills = 30,
}: SkillsInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addSkill = useCallback(
        (raw: string) => {
            const skill = raw.trim();
            if (!skill) return;
            if (skills.length >= maxSkills) return;
            if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
            onChange([...skills, skill]);
            setInputValue("");
        },
        [skills, onChange, maxSkills]
    );

    const removeSkill = useCallback(
        (index: number) => {
            onChange(skills.filter((_, i) => i !== index));
        },
        [skills, onChange]
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSkill(inputValue);
        }
        if (e.key === "Backspace" && !inputValue && skills.length > 0) {
            removeSkill(skills.length - 1);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div
                onClick={() => !disabled && inputRef.current?.focus()}
                className={cn(
                    "w-full rounded-xl border text-sm px-3 py-2 transition-all duration-150 min-h-[42px] flex flex-wrap items-center gap-1.5 cursor-text",
                    disabled
                        ? "bg-gray-50 border-gray-200 cursor-default"
                        : isFocused
                            ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                            : "bg-white border-gray-300 hover:border-gray-400"
                )}
            >
                {skills.map((skill, i) => (
                    <span
                        key={`${skill}-${i}`}
                        className={cn(
                            "inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-lg text-xs font-medium transition-all duration-150",
                            disabled
                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        )}
                    >
                        {skill}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeSkill(i);
                                }}
                                className="flex items-center justify-center w-4 h-4 rounded-md hover:bg-emerald-200/60 text-emerald-600 hover:text-emerald-800 transition-colors"
                                aria-label={`Remove ${skill}`}
                            >
                                <X className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                        )}
                    </span>
                ))}

                {!disabled && skills.length < maxSkills && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            setIsFocused(false);
                            if (inputValue.trim()) addSkill(inputValue);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={skills.length === 0 ? placeholder : "Add more…"}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 py-0.5"
                    />
                )}
            </div>

            {!disabled && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono">Enter</kbd> to add a skill
                    {skills.length > 0 && (
                        <span className="ml-auto text-gray-400">{skills.length}/{maxSkills}</span>
                    )}
                </p>
            )}
        </div>
    );
}
