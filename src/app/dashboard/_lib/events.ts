"use client";

// ---------------------------------------------------------------------------
// Event interface — matches backend EventPublic schema exactly
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// EventType interface — matches backend EventTypePublic schema
// ---------------------------------------------------------------------------

export interface EventType {
    event_type_id: string;
    event_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// API configuration
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Event API functions
// ---------------------------------------------------------------------------

export async function fetchEvents(params?: {
    search?: string;
    event_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: string;
}): Promise<{ events: Event[]; total: number }> {
    try {
        const searchParams = new URLSearchParams();
        searchParams.set("limit", String(params?.limit ?? 10));
        searchParams.set("offset", String(params?.offset ?? 0));
        searchParams.set("status", params?.status ?? "active");
        searchParams.set("include_deleted", "false");
        searchParams.set("sort_by", params?.sort_by ?? "date");
        searchParams.set("sort_order", params?.sort_order ?? "asc");
        if (params?.search) searchParams.set("search", params.search);
        if (params?.event_type) searchParams.set("event_type", params.event_type);

        const res = await fetch(`${API_BASE_URL}/events/?${searchParams}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

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

export async function createEvent(data: {
    event_name: string;
    description: string;
    event_type_name: string;
    date: string;
    time_start: string;
    time_end: string;
    location: string;
    capacity: number;
}): Promise<Event | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/events/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Create event failed:", err);
            return null;
        }
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to create event:", error);
        return null;
    }
}

export async function updateEvent(
    eventId: string,
    data: Partial<{
        event_name: string;
        description: string;
        event_type_name: string;
        date: string;
        time_start: string;
        time_end: string;
        location: string;
        capacity: number;
    }>
): Promise<Event | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Update event failed:", err);
            return null;
        }
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error("Failed to update event:", error);
        return null;
    }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch (error) {
        console.error("Failed to delete event:", error);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Event Type API functions
// ---------------------------------------------------------------------------

export async function fetchEventTypes(): Promise<EventType[]> {
    try {
        const res = await fetch(
            `${API_BASE_URL}/event-types/?include_deleted=false&sort_by=event_name&sort_order=asc&limit=100&offset=0`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
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
        const res = await fetch(`${API_BASE_URL}/event-types/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_name: eventName }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Create event type failed:", err);
            return null;
        }
        const json = await res.json();
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

        const res = await fetch(`${API_BASE_URL}/events/${eventId}/upload-image`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            console.error("Upload event image failed:", err);
            return false;
        }

        const json = await res.json();
        return json.success === true;
    } catch (error) {
        console.error("Failed to upload event image:", error);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Date formatting utilities (unchanged)
// ---------------------------------------------------------------------------

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
