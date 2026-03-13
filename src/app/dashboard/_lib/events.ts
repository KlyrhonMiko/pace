"use client";

import { apiFetch } from "@/lib/api-client";

export interface Event {
    event_id: string;
    event_name: string;
    description: string;
    event_type: string;
    date: string;
    time_start: string;
    time_end: string;
    location: string;
    capacity: number;
    attendees: number;
    image_path?: string | null;
    is_registered?: boolean | null;
    created_at: string;
    updated_at: string;
}

export interface EventType {
    event_type_id: string;
    event_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export async function fetchEvents(params?: {
    search?: string;
    event_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: string;
}): Promise<{ events: Event[]; total: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set("limit", String(params?.limit ?? 10));
    searchParams.set("offset", String(params?.offset ?? 0));
    searchParams.set("status", params?.status ?? "active");
    searchParams.set("include_deleted", "false");
    searchParams.set("sort_by", params?.sort_by ?? "date");
    searchParams.set("sort_order", params?.sort_order ?? "asc");
    
    if (params?.search) searchParams.set("search", params.search);
    if (params?.event_type) searchParams.set("event_type", params.event_type);

    try {
        const json = await apiFetch<any>(`/events/?${searchParams}`);
        if (json.success && json.data) {
            return {
                events: json.data.events ?? [],
                total: json.data.pagination?.total ?? 0,
            };
        }
        return { events: [], total: 0 };
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return { events: [], total: 0 };
    }
}

export async function createEvent(data: any): Promise<Event | null> {
    try {
        const json = await apiFetch<any>("/events/", {
            method: "POST",
            body: data,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create event:", error);
        return null;
    }
}

export async function updateEvent(eventId: string, data: any): Promise<Event | null> {
    try {
        const json = await apiFetch<any>(`/events/${eventId}`, {
            method: "PATCH",
            body: data,
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to update event:", error);
        return null;
    }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/events/${eventId}`, {
            method: "DELETE",
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to delete event:", error);
        return false;
    }
}

export async function fetchEventTypes(): Promise<EventType[]> {
    try {
        const json = await apiFetch<any>("/event-types/?include_deleted=false&sort_by=event_name&sort_order=asc&limit=100&offset=0");
        if (json.success && json.data) {
            return json.data.event_types ?? [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch event types:", error);
        return [];
    }
}

export async function createEventType(eventName: string): Promise<EventType | null> {
    try {
        const json = await apiFetch<any>("/event-types/", {
            method: "POST",
            body: { event_name: eventName },
        });
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create event type:", error);
        return null;
    }
}

export async function uploadEventImage(eventId: string, file: File): Promise<boolean> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const json = await apiFetch<any>(`/events/${eventId}/upload-image`, {
            method: "POST",
            body: formData,
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to upload event image:", error);
        return false;
    }
}


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatEventDate = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        const monthIndex = parseInt(month) - 1;
        return `${MONTHS[monthIndex]} ${parseInt(day)} ${year}`;
    }
    return dateStr;
};

export const getMonthAbbreviation = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const month = dateStr.split('-')[1];
        return MONTHS[parseInt(month) - 1];
    }
    return "Event";
};

export const getDayNumber = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.split('-')[2];
    }
    return "00";
};
