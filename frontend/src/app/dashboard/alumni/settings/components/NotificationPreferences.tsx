"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { SettingsCard, Toggle, Divider, SelectField, SaveIndicator } from "./SettingsUI";

export function NotificationPreferences() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [eventInvitations, setEventInvitations] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [notificationFrequency, setNotificationFrequency] = useState("daily");
    const [saved, setSaved] = useState(false);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Notification Preferences"
            subtitle="Control how and when you receive notifications"
            icon={<Bell size={18} />}
            iconContainerClass="bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20"
        >
            <Toggle
                label="Email Notifications"
                description="Receive notifications via email"
                enabled={emailNotifications}
                onChange={(v) => {
                    setEmailNotifications(v);
                    flashSaved();
                }}
            />
            <Divider />

            <div className={`space-y-4 transition-opacity duration-200 ${emailNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                <div className="pl-4 border-l-2 border-emerald-100 space-y-4">
                    <Toggle
                        label="Event Invitations"
                        description="Invitations to alumni events and reunions"
                        enabled={eventInvitations}
                        onChange={(v) => {
                            setEventInvitations(v);
                            flashSaved();
                        }}
                    />
                    <Toggle
                        label="Event Reminders"
                        description="Upcoming events and registration deadlines"
                        enabled={eventReminders}
                        onChange={(v) => {
                            setEventReminders(v);
                            flashSaved();
                        }}
                    />
                </div>
            </div>

            <Divider />

            <Toggle
                label="Push Notifications"
                description="Receive browser push notifications"
                enabled={pushNotifications}
                onChange={(v) => {
                    setPushNotifications(v);
                    flashSaved();
                }}
            />
            <Divider />
            <SelectField
                label="Notification Frequency"
                description="How often you want to receive email digests"
                value={notificationFrequency}
                onChange={(v) => {
                    setNotificationFrequency(v);
                    flashSaved();
                }}
                options={[
                    { value: "instant", label: "Instant" },
                    { value: "daily", label: "Daily Digest" },
                    { value: "weekly", label: "Weekly Digest" },
                ]}
            />
            <div className="flex justify-end py-2">
                <SaveIndicator show={saved} />
            </div>
        </SettingsCard>
    );
}
