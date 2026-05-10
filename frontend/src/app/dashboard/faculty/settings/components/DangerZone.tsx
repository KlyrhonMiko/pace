"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { SettingsCard } from "./SettingsUI";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { apiFetch } from "../../../../../lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function DangerZone() {
    const { user, logout } = useAuth();
    const [showDeactivate, setShowDeactivate] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDeactivate = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch<any>(`/users/${user?.user_id}`, {
                method: "PATCH",
                body: { is_active: false }
            });

            if (res.success) {
                toast.success("Account deactivated successfully");
                await logout();
            } else {
                toast.error(res.message || "Failed to deactivate account");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
            setShowDeactivate(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch<any>(`/users/${user?.user_id}`, {
                method: "DELETE"
            });

            if (res.success) {
                toast.success("Account deleted permanently");
                await logout();
            } else {
                toast.error(res.message || "Failed to delete account");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
            setShowDelete(false);
        }
    };

    return (
        <>
            <SettingsCard
                title="Danger Zone"
                subtitle="Permanent actions that cannot be undone"
                icon={<AlertTriangle size={18} />}
                iconContainerClass="bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20"
            >
                <div className="divide-y divide-gray-100">
                    <div className="py-4 flex items-center justify-between gap-4 border-b border-slate-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Deactivate Account</p>
                            <p className="text-xs text-gray-500 mt-0.5">Temporarily disable your faculty portal access</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeactivate(true)}
                            className="text-gray-700 border-gray-200 rounded-xl hover:bg-slate-50 font-bold"
                        >
                            Deactivate
                        </Button>
                    </div>

                    <div className="py-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-red-600">Delete Account</p>
                            <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all associated data</p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDelete(true)}
                            className="bg-red-600 hover:bg-red-700 rounded-xl px-5 flex items-center gap-2 shadow-lg shadow-red-600/20 font-bold"
                        >
                            <Trash2 size={16} />
                            Delete Account
                        </Button>
                    </div>
                </div>
            </SettingsCard>

            <ConfirmationModal
                isOpen={showDeactivate}
                onClose={() => setShowDeactivate(false)}
                onConfirm={handleDeactivate}
                title="Deactivate Faculty Account?"
                description="Are you sure you want to deactivate your faculty account? You will lose access to the portal until an administrator reactivates it."
                confirmText="Deactivate Account"
                variant="warning"
                isLoading={isLoading}
            />

            <ConfirmationModal
                isOpen={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={handleDelete}
                title="Delete Faculty Account Permanently?"
                description="This action is irreversible. All your data, records, and access permissions will be permanently removed. You will be logged out immediately."
                confirmText="Delete Permanently"
                variant="danger"
                isLoading={isLoading}
            />
        </>
    );
}
