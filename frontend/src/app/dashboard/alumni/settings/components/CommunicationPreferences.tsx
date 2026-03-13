"use client";

import { useState } from "react";
import { Mail, MessageSquare, CalendarDays, Sparkles } from "lucide-react";
import { SettingsCard, Toggle, Divider, SaveIndicator } from "./SettingsUI";

export function CommunicationPreferences() {
    const [newsletter, setNewsletter] = useState(true);
    const [eventInvitations, setEventInvitations] = useState(true);
    const [mentorship, setMentorship] = useState(false);
    const [saved, setSaved] = useState(false);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Communication Preferences"
            subtitle="Manage the types of communications you receive"
            icon={<Mail size={18} />}
            iconContainerClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
        >
            <div className="flex items-center gap-2 py-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${newsletter ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                    <MessageSquare size={14} />
                </div>
                <div className="flex-1">
                    <Toggle
                        label="Alumni Newsletter"
                        description="Monthly updates from the alumni community"
                        enabled={newsletter}
                        onChange={(v) => {
                            setNewsletter(v);
                            flashSaved();
                        }}
                    />
                </div>
            </div>
            <Divider />
            <div className="flex items-center gap-2 py-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${eventInvitations ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                    <CalendarDays size={14} />
                </div>
                <div className="flex-1">
                    <Toggle
                        label="Event Invitations"
                        description="Invitations to alumni events and reunions"
                        enabled={eventInvitations}
                        onChange={(v) => {
                            setEventInvitations(v);
                            flashSaved();
                        }}
                    />
                </div>
            </div>
            <Divider />
            <div className="flex items-center gap-2 py-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${mentorship ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} transition-colors duration-200`}>
                    <Sparkles size={14} />
                </div>
                <div className="flex-1">
                    <Toggle
                        label="Mentorship Opportunities"
                        description="Invitations to mentor or be mentored"
                        enabled={mentorship}
                        onChange={(v) => {
                            setMentorship(v);
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
