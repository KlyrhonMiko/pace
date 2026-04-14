"use client";

import { useState } from "react";
import { UserCircle } from "lucide-react";
import { SettingsCard, SaveIndicator } from "./SettingsUI";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileSettings() {
    const [department, setDepartment] = useState("College of Computer Studies");
    const [officeHours, setOfficeHours] = useState("Mon, Wed: 1:00 PM - 3:00 PM");
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Profile Settings"
            subtitle="Update your professional information"
            icon={<UserCircle size={18} />}
            iconContainerClass="bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-500/20"
        >
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Department</label>
                    <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="rounded-xl border-gray-200"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Office Hours</label>
                    <Input
                        value={officeHours}
                        onChange={(e) => setOfficeHours(e.target.value)}
                        className="rounded-xl border-gray-200"
                    />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <SaveIndicator show={saved} />
                    <Button onClick={handleSave} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-6">
                        Save Changes
                    </Button>
                </div>
            </div>
        </SettingsCard>
    );
}
