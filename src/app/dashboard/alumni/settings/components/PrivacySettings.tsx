"use client";

import { useState } from "react";
import { Shield, Eye, EyeOff, Briefcase } from "lucide-react";
import { SettingsCard, SelectField, Divider, Toggle, SaveIndicator } from "./SettingsUI";

export function PrivacySettings() {
    const [profileVisibility, setProfileVisibility] = useState("public");
    const [showEmail, setShowEmail] = useState(false);
    const [showEmployment, setShowEmployment] = useState(true);
    const [saved, setSaved] = useState(false);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Privacy Settings"
            subtitle="Control who can see your information"
            icon={<Shield size={18} />}
            iconContainerClass="bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
        >
            <SelectField
                label="Profile Visibility"
                description="Who can view your profile information"
                value={profileVisibility}
                onChange={(v) => {
                    setProfileVisibility(v);
                    flashSaved();
                }}
                options={[
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private" },
                ]}
            />
            <Divider />
            <div className="flex items-center gap-2 py-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${showEmail ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                    {showEmail ? <Eye size={14} /> : <EyeOff size={14} />}
                </div>
                <div className="flex-1">
                    <Toggle
                        label="Show Email Address"
                        description="Allow other alumni to see your email"
                        enabled={showEmail}
                        onChange={(v) => {
                            setShowEmail(v);
                            flashSaved();
                        }}
                    />
                </div>
            </div>
            <Divider />
            <div className="flex items-center gap-2 py-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${showEmployment ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                    <Briefcase size={14} />
                </div>
                <div className="flex-1">
                    <Toggle
                        label="Show Employment Status"
                        description="Display your current employment on your profile"
                        enabled={showEmployment}
                        onChange={(v) => {
                            setShowEmployment(v);
                            flashSaved();
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-end py-2">
                <SaveIndicator show={saved} />
            </div>
        </SettingsCard>
    );
}
