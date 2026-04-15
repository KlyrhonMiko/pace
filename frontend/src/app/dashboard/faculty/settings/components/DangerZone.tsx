"use client";

import { AlertTriangle, Trash2, LogOut } from "lucide-react";
import { SettingsCard } from "./SettingsUI";
import { Button } from "@/components/ui/button";

export function DangerZone() {
    return (
        <SettingsCard
            title="Danger Zone"
            subtitle="Permanent actions that cannot be undone"
            icon={<AlertTriangle size={18} />}
            iconContainerClass="bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20"
        >
            <div className="divide-y divide-gray-100">
                <div className="py-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Deactivate Account</p>
                        <p className="text-xs text-gray-500 mt-0.5">Temporarily disable your faculty portal access</p>
                    </div>
                    <Button variant="outline" className="text-gray-700 border-gray-300 rounded-xl hover:bg-gray-50">
                        Deactivate
                    </Button>
                </div>

                <div className="py-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-red-600">Delete Account</p>
                        <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all associated data</p>
                    </div>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-xl px-4 flex items-center gap-2 shadow-lg shadow-red-600/20">
                        <Trash2 size={16} />
                        Delete Account
                    </Button>
                </div>
            </div>
        </SettingsCard>
    );
}
