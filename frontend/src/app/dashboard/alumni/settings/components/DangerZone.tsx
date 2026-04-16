"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export function DangerZone() {
    const [showDeactivate, setShowDeactivate] = useState(false);

    return (
        <>
            <div className="rounded-2xl bg-white border border-red-200/60 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-red-100/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/20">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Danger Zone</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Irreversible actions — proceed with caution
                        </p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Deactivate Account
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Temporarily disable your account. You can reactivate it anytime by logging in again.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeactivate(true)}
                            className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-150"
                        >
                            Deactivate Account
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeactivate}
                onClose={() => setShowDeactivate(false)}
                onConfirm={() => {
                    // Logic to deactivate account would go here
                    setShowDeactivate(false);
                }}
                title="Deactivate Account?"
                description="Are you sure you want to deactivate your account? Your profile will be hidden from other alumni and recruiters. You can reactivate by logging in again."
                confirmText="Yes, Deactivate"
                variant="danger"
            />
        </>
    );
}
