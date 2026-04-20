"use client";

import { AlertTriangle, Loader2, LucideIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "success" | "info";
    isLoading?: boolean;
    icon?: LucideIcon;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
    icon: Icon = AlertTriangle,
}: ConfirmationModalProps) {
    const variantConfig = {
        danger: {
            iconBg: "bg-rose-100",
            iconText: "text-rose-600",
            confirmBtn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
        },
        warning: {
            iconBg: "bg-amber-100",
            iconText: "text-amber-600",
            confirmBtn: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
        },
        success: {
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
            confirmBtn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        },
        info: {
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
            confirmBtn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
        },
    };

    const config = variantConfig[variant];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-none bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4", config.iconBg)}>
                    <Icon className={cn("h-8 w-8", config.iconText)} strokeWidth={1.5} />
                </div>

                <DialogHeader className="space-y-2 mb-6 flex flex-col items-center text-center sm:text-center">
                    <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                            config.confirmBtn
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
