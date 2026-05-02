"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { SettingsCard, Toggle, Divider, SelectField, SaveIndicator } from "./SettingsUI";

const STORAGE_KEY = "pace_staff_notification_prefs";

export function NotificationPreferences() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [surveyResponses, setSurveyResponses] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [notificationFrequency, setNotificationFrequency] = useState("daily");
    const [saved, setSaved] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedPrefs = localStorage.getItem(STORAGE_KEY);
        if (savedPrefs) {
            try {
                const parsed = JSON.parse(savedPrefs);
                setEmailNotifications(parsed.emailNotifications ?? true);
                setSurveyResponses(parsed.surveyResponses ?? true);
                setEventReminders(parsed.eventReminders ?? true);
                setNotificationFrequency(parsed.notificationFrequency ?? "daily");
            } catch (e) {
                console.error("Failed to parse notification prefs", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            const prefs = {
                emailNotifications,
                surveyResponses,
                eventReminders,
                notificationFrequency
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            flashSaved();
        }
    }, [emailNotifications, surveyResponses, eventReminders, notificationFrequency, isLoaded]);

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
                    }}
                />
                <Toggle
                    label="Event Reminders"
                    description="Upcoming faculty events and deadlines"
                    enabled={eventReminders}
                    onChange={(v) => {
                        setEventReminders(v);
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
