import { Check, Loader2, Pencil } from "lucide-react";
import React from "react";

interface SectionCardProps {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    editable?: boolean;
    editing?: boolean;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    saved?: boolean;
    saving?: boolean;
    iconContainerClass?: string;
    editLabel?: string;
}

export function SectionCard({
    title,
    subtitle,
    icon,
    children,
    editable = false,
    editing = false,
    onEdit,
    onSave,
    onCancel,
    saved = false,
    saving = false,
    iconContainerClass = "",
    editLabel = "Edit",
}: SectionCardProps) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${iconContainerClass}`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {saved && !editing && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Saved
                        </span>
                    )}
                    {editable && !editing && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-150"
                        >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                            {editLabel}
                        </button>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-5">
                {children}

                {editing && (
                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="w-full sm:w-auto order-2 sm:order-1 flex items-center justify-center h-[42px] px-6 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="w-full sm:flex-1 order-1 sm:order-2 flex items-center justify-center gap-2 h-[42px] px-6 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all duration-150 shadow-sm shadow-emerald-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
