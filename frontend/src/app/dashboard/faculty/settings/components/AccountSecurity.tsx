"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { SettingsCard, Toggle, Divider, SaveIndicator } from "./SettingsUI";
import { Button } from "@/components/ui/button";

export function AccountSecurity() {
    const [twoFactor, setTwoFactor] = useState(false);
    const [loginAlerts, setLoginAlerts] = useState(true);
    const [saved, setSaved] = useState(false);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Account Security"
            subtitle="Manage your password and security settings"
            icon={<Shield size={18} />}
            iconContainerClass="bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-emerald-500/20"
        >
            <div className="py-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Password</p>
                        <p className="text-xs text-gray-500 mt-0.5">Last changed 3 months ago</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">
                        Change Password
                    </Button>
                </div>
            </div>
            <Divider />
            <Toggle
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                enabled={twoFactor}
                onChange={(v) => {
                    setTwoFactor(v);
                    flashSaved();
                }}
            />
            <Divider />
            <Toggle
                label="Login Alerts"
                description="Get notified of new login attempts from unrecognized devices"
                enabled={loginAlerts}
                onChange={(v) => {
                    setLoginAlerts(v);
                    flashSaved();
                }}
            />
            <div className="flex justify-end py-2">
                <SaveIndicator show={saved} />
            </div>
        </SettingsCard>
    );
}
