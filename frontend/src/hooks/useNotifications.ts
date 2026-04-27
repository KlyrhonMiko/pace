"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Notification {
    id: string;
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
    user_ref_id: string;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useNotifications(token: string | null): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setNotifications(json.data || []);
            }
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    }, [token]);

    // SSE Connection
    useEffect(() => {
        if (!token) return;

        const connect = () => {
            const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
            const es = new EventSource(url);

            es.onopen = () => setIsConnected(true);

            es.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === "new_notification" && payload.data) {
                        setNotifications((prev) => [payload.data, ...prev]);
                    }
                } catch (e) {
                    console.error("SSE message parse error:", e);
                }
            };

            es.onerror = () => {
                setIsConnected(false);
                es.close();
                // Reconnect after 5s
                setTimeout(connect, 5000);
            };

            eventSourceRef.current = es;
        };

        fetchNotifications();
        connect();

        return () => {
            eventSourceRef.current?.close();
        };
    }, [token, fetchNotifications]);

    const markAsRead = useCallback(
        async (id: string) => {
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    setNotifications((prev) =>
                        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
                    );
                }
            } catch (e) {
                console.error("Failed to mark notification as read:", e);
            }
        },
        [token]
    );

    const markAllAsRead = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            }
        } catch (e) {
            console.error("Failed to mark all notifications as read:", e);
        }
    }, [token]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    };
}
