"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { SettingsCard, Toggle, Divider, SelectField, SaveIndicator } from "./SettingsUI";

export function NotificationPreferences() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [surveyResponses, setSurveyResponses] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [systemUpdates, setSystemUpdates] = useState(false);
    const [notificationFrequency, setNotificationFrequency] = useState("daily");
    const [saved, setSaved] = useState(false);

    const flashSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsCard
            title="Notification Preferences"
            subtitle="Control how and when you receive faculty-related notifications"
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
            <div className={`pl-4 border-l-2 border-gray-100 space-y-0 transition-opacity duration-200 ${emailNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                <Toggle
                    label="Alumni Survey Responses"
                    description="Get notified when an alumni responds to your surveys"
                    enabled={surveyResponses}
                    onChange={(v) => {
                        setSurveyResponses(v);
                        flashSaved();
                    }}
                />
                <Toggle
                    label="Event Reminders"
                    description="Upcoming faculty events and deadlines"
                    enabled={eventReminders}
                    onChange={(v) => {
                        setEventReminders(v);
                        flashSaved();
                    }}
                />
                <Toggle
                    label="System Updates"
                    description="Platform updates and faculty portal announcements"
                    enabled={systemUpdates}
                    onChange={(v) => {
                        setSystemUpdates(v);
                        flashSaved();
                    }}
                />
            </div>
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
