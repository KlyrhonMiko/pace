import React from "react";

interface FieldProps {
    label: string;
    value: string | number;
    onChange?: (v: string) => void;
    type?: string;
    readOnly?: boolean;
    editing?: boolean;
    placeholder?: string;
    required?: boolean;
}

export function Field({
    label,
    value,
    onChange,
    type = "text",
    readOnly = false,
    editing = false,
    placeholder,
    required = false,
}: FieldProps) {
    const isReadOnly = readOnly || !editing;

    const baseInput =
        "w-full rounded-xl border text-sm px-3.5 py-2.5 transition-all duration-150 outline-none ";
    const readonlyClass =
        "bg-gray-50 border-gray-200 text-gray-500 cursor-default select-none";
    const editableClass =
        "bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
                {required && <span className="text-emerald-600 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                value={value as string}
                onChange={(e) => onChange?.(e.target.value)}
                readOnly={isReadOnly}
                placeholder={isReadOnly ? "—" : placeholder}
                className={baseInput + (isReadOnly ? readonlyClass : editableClass)}
            />
        </div>
    );
}
