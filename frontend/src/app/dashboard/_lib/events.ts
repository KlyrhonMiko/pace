"use client";

import { apiFetch } from "../../../lib/api-client";

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
    image_url?: string | null;
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
}): Promise<{ events: Event[]; total: number; facets: Record<string, number> }> {
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
                facets: json.data.facets ?? {},
            };
        }
        return { events: [], total: 0, facets: {} };
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return { events: [], total: 0, facets: {} };
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

export async function registerEvent(eventId: string): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/events/${eventId}/register`, {
            method: "POST",
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to register for event:", error);
        return false;
    }
}

export async function unregisterEvent(eventId: string): Promise<boolean> {
    try {
        const json = await apiFetch<any>(`/events/${eventId}/unregister`, {
            method: "DELETE",
        });
        return json.success === true;
    } catch (error) {
        console.error("Failed to unregister from event:", error);
        return false;
    }
}
export interface EventRegistrant {
    event_id: string;
    alumni_id?: string | null;
    last_name?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    student_id?: string | null;
    year_graduated?: number | null;
    registered_at: string;
}

export async function fetchEventRegistrants(
    eventId: string,
    limit: number = 10,
    offset: number = 0
): Promise<{ registrants: EventRegistrant[]; total: number }> {
    try {
        const json = await apiFetch<any>(`/events/${eventId}/registrants?limit=${limit}&offset=${offset}`);
        if (json.success && json.data) {
            return {
                registrants: json.data.registrants ?? [],
                total: json.data.pagination?.total ?? 0,
            };
        }
        return { registrants: [], total: 0 };
    } catch (error) {
        console.error(`Failed to fetch registrants for event ${eventId}:`, error);
        return { registrants: [], total: 0 };
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

// ---------------------------------------------------------------------------
// High-level Workflows (Orchestration)
// ---------------------------------------------------------------------------

/**
 * Orchestrates saving/updating an event including type creation and image upload.
 */
export async function saveEventWorkflow(
    editingEvent: Event | null,
    formData: {
        event_name: string;
        description: string;
        event_type_name: string;
        date: string;
        time_start: string;
        time_end: string;
        location: string;
        capacity: number;
    },
    options: {
        isAddingNewType: boolean;
        imageFile: File | null;
    }
): Promise<{ success: boolean; event?: Event; error?: string; warning?: string }> {
    try {
        let selectedEventTypeName = formData.event_type_name.trim();

        // 1. Create new event type if needed
        if (options.isAddingNewType && selectedEventTypeName) {
            const newType = await createEventType(selectedEventTypeName);
            if (!newType) {
                return { success: false, error: "Failed to create new event type. It may already exist." };
            }
            selectedEventTypeName = newType.event_name;
        }

        if (!selectedEventTypeName) {
            return { success: false, error: "Please select a valid event type." };
        }

        const eventPayload = {
            ...formData,
            event_type_name: selectedEventTypeName,
        };

        // 2. Create or Update the event
        let result: Event | null;
        if (editingEvent) {
            result = await updateEvent(editingEvent.event_id, eventPayload);
        } else {
            result = await createEvent(eventPayload);
        }

        if (!result) {
            return { success: false, error: "Failed to save event. Please try again." };
        }

        // 3. Upload image if provided
        let warning: string | undefined;
        if (options.imageFile) {
            const imageUploaded = await uploadEventImage(result.event_id, options.imageFile);
            if (!imageUploaded) {
                warning = "Event saved, but image upload failed. You can retry by editing the event.";
            }
        }

        return { success: true, event: result, warning };
    } catch (error) {
        console.error("Event workflow failed:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
