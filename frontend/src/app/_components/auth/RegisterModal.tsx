"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { RegisterForm } from "./RegisterForm";

interface RegisterModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin?: () => void;
    role?: "Alumni" | "Employer";
}

export function RegisterModal({ isOpen, onOpenChange, onSwitchToLogin, role }: RegisterModalProps) {


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[540px] p-0 gap-0 overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 rounded-2xl flex flex-col max-h-[92vh]"
            >
                <DialogHeader className="p-0">
                    <DialogTitle className="sr-only">Register to P.A.C.E.</DialogTitle>
                    <DialogDescription className="sr-only">
                        Register your account to access the Pamantasan ng Lungsod ng Pasig Alumni &amp; Career Portal.
                    </DialogDescription>
                </DialogHeader>

                {/* Sticky header */}
                <div className="relative shrink-0 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
                    {/* Subtle gradient accent */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                    <DialogPrimitive.Close
                        aria-label="Close"
                        className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    >
                        <X className="h-4 w-4" />
                    </DialogPrimitive.Close>

                    <div className="px-8 pt-7 pb-5 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/plp-logo.png?v=2"
                            alt="PLP Logo"
                            width="28"
                            height="28"
                            className="h-7 w-7 object-contain"
                        />
                        <span className="text-[15px] font-bold tracking-tight text-slate-900">
                            P.A.C.E.
                        </span>


                    </div>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="px-8 pt-7 pb-8">
                        <RegisterForm
                            isModal
                            initialRole={role}
                            onSuccess={() => onOpenChange(false)}
                            onCancel={() => onOpenChange(false)}
                            onLoginClick={onSwitchToLogin}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
