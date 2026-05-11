"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

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
        try {
            const res = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
                credentials: "include",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const json = await res.json();
                setNotifications(json.data || []);
            } else if (res.status === 401) {
                setNotifications([]);
            }
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    }, [token]);

    // SSE Connection with exponential backoff
    useEffect(() => {
        let isMounted = true;
        let es: EventSource | null = null;
        let retryDelay = 1000;

        const connect = () => {
            if (!isMounted) return;

            const url = token
                ? `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`
                : `${API_BASE_URL}/notifications/stream`;
            es = new EventSource(url, { withCredentials: true });

            es.onopen = () => {
                if (isMounted) {
                    setIsConnected(true);
                    retryDelay = 1000; // Reset backoff on success
                }
            };

            es.onmessage = (event) => {
                if (!isMounted) return;
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
                if (isMounted) {
                    setIsConnected(false);
                    es?.close();
                    // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap)
                    const delay = Math.min(retryDelay, 30000);
                    retryDelay = Math.min(retryDelay * 2, 30000);
                    setTimeout(() => {
                        if (isMounted) connect();
                    }, delay);
                }
            };

            eventSourceRef.current = es;
        };

        fetchNotifications();
        connect();

        return () => {
            isMounted = false;
            eventSourceRef.current?.close();
        };
    }, [token, fetchNotifications]);

    const markAsRead = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: "POST",
                credentials: "include",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
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
