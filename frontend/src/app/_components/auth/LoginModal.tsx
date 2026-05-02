"use client";

import { Suspense } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";
import { LoginNotice } from "./LoginNotice";

interface LoginModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToRegister?: (role: "Alumni" | "Employer") => void;
    showRegistration?: boolean;
}

export function LoginModal({ isOpen, onOpenChange, onSwitchToRegister, showRegistration = true }: LoginModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border border-slate-200 bg-white shadow-xl rounded-2xl"
            >
                <DialogHeader className="p-0">
                    <DialogTitle className="sr-only">Sign in to P.A.C.E.</DialogTitle>
                    <DialogDescription className="sr-only">
                        Sign in to your Pamantasan ng Lungsod ng Pasig Alumni &amp; Career Portal account.
                    </DialogDescription>
                </DialogHeader>

                {/* Close button */}
                <DialogPrimitive.Close
                    aria-label="Close"
                    className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                    <X className="h-4 w-4" />
                </DialogPrimitive.Close>

                <Suspense fallback={null}>
                    <LoginNotice />
                </Suspense>

                <div className="px-8 pt-10 pb-8">
                    {/* Brand */}
                    <div className="mb-7 flex items-center gap-2.5">
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

                    <LoginForm
                        isModal
                        onSuccess={() => onOpenChange(false)}
                        onRegisterEmployerClick={showRegistration ? () => onSwitchToRegister?.("Employer") : undefined}
                        onRegisterAlumniClick={showRegistration ? () => onSwitchToRegister?.("Alumni") : undefined}
                        showRegistration={showRegistration}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
