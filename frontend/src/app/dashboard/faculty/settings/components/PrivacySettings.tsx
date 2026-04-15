"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { SettingsCard, Toggle, Divider, SaveIndicator } from "./SettingsUI";

export function PrivacySettings() {
    const [profileVisible, setProfileVisible] = useState(true);
    const [emailVisible, setEmailVisible] = useState(false);
    const [saved, setSaved] = useState(false);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Privacy Settings"
            subtitle="Control your visibility and data sharing"
            icon={<Lock size={18} />}
            iconContainerClass="bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-500/20"
        >
            <Toggle
                label="Profile Visibility"
                description="Allow alumni to view your faculty profile"
                enabled={profileVisible}
                onChange={(v) => {
                    setProfileVisible(v);
                    flashSaved();
                }}
            />
            <Divider />
            <Toggle
                label="Show Email to Alumni"
                description="Display your contact email on your public profile"
                enabled={emailVisible}
                onChange={(v) => {
                    setEmailVisible(v);
                    flashSaved();
                }}
            />
            <div className="flex justify-end py-2">
                <SaveIndicator show={saved} />
            </div>
        </SettingsCard>
    );
}
