"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    fetchEvents,
    fetchEventTypes,
    deleteEvent as apiDeleteEvent,
    saveEventWorkflow,
    type Event,
    type EventType,
} from "../../_lib/events";

export function useEventManagement() {
    // --- Global State ---
    const [events, setEvents] = useState<Event[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- UI State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingNewType, setIsAddingNewType] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

    // --- Form State ---
    const [formData, setFormData] = useState({
        event_name: "",
        description: "",
        event_type_name: "Workshop",
        date: "",
        time_start: "",
        time_end: "",
        location: "",
        capacity: 0,
    });

    const availableTypeNames = eventTypes.map(et => et.event_name);

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [eventsResult, types] = await Promise.all([
                fetchEvents({ limit: 100, sort_by: "date", sort_order: "desc" }),
                fetchEventTypes(),
            ]);
            setEvents(eventsResult.events);
            setEventTypes(types);
        } catch (error) {
            toast.error("Failed to load events data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Image preview cleanup
    useEffect(() => {
        return () => {
            if (selectedImagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(selectedImagePreview);
            }
        };
    }, [selectedImagePreview]);

    // --- Handlers ---
    const handleSearch = (query: string) => setSearchQuery(query);

    const openCreateModal = () => {
        setEditingEvent(null);
        setFormData({
            event_name: "",
            description: "",
            event_type_name: availableTypeNames[0] ?? "Workshop",
            date: "",
            time_start: "",
            time_end: "",
            location: "",
            capacity: 0,
        });
        setIsModalOpen(true);
        setIsAddingNewType(false);
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
    };

    const openUpdateModal = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            event_name: event.event_name,
            description: event.description,
            event_type_name: event.event_type,
            date: event.date,
            time_start: event.time_start,
            time_end: event.time_end,
            location: event.location,
            capacity: event.capacity,
        });
        setIsModalOpen(true);
        setIsAddingNewType(false);
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
    };

    const handleImageChange = (file: File | null) => {
        if (!file) {
            setSelectedImageFile(null);
            setSelectedImagePreview(null);
            return;
        }
        setSelectedImageFile(file);
        setSelectedImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!formData.event_name || !formData.date || !formData.time_start || !formData.time_end) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSaving(true);
        const { success, error, warning } = await saveEventWorkflow(editingEvent, formData, {
            isAddingNewType,
            imageFile: selectedImageFile,
        });

        if (success) {
            if (warning) toast.warning(warning);
            toast.success(editingEvent ? "Event updated successfully." : "Event created successfully.");
            await loadData();
            setIsModalOpen(false);
            setSelectedImageFile(null);
            setSelectedImagePreview(null);
        } else if (error) {
            toast.error(error);
        }

        setIsSaving(false);
    };

    const handleClearForm = () => {
        if (editingEvent) {
            openUpdateModal(editingEvent);
        } else {
            openCreateModal();
        }
    };

    const handleDeleteClick = (eventId: string) => {
        setEventToDelete(eventId);
    };

    const confirmDeleteEvent = async () => {
        if (eventToDelete !== null) {
            setIsDeleting(true);
            const success = await apiDeleteEvent(eventToDelete);
            if (success) {
                toast.success("Event deleted successfully.");
                await loadData();
            } else {
                toast.error("Failed to delete event.");
            }
            setIsDeleting(false);
            setEventToDelete(null);
        }
    };

    const filteredEvents = events.filter(e =>
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
        // State
        events: filteredEvents,
        eventTypes,
        availableTypeNames,
        isModalOpen,
        editingEvent,
        searchQuery,
        isAddingNewType,
        isSaving,
        isDeleting,
        isLoading,
        selectedImagePreview,
        eventToDelete,
        formData,

        // Handlers
        setIsModalOpen,
        setIsAddingNewType,
        setFormData,
        setEventToDelete,
        handleSearch,
        openCreateModal,
        openUpdateModal,
        handleImageChange,
        handleSave,
        handleDeleteClick,
        handleClearForm,
        confirmDeleteEvent,
        loadData,
    };
}
