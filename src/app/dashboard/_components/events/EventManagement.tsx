"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Image as ImageIcon,
    MoreVertical,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getStoredEvents, saveStoredEvents, type Event, getMonthAbbreviation, getDayNumber, formatEventDate } from "../../_lib/events";

// Event type and INITIAL_EVENTS are now imported from src/app/dashboard/_lib/events.ts

export default function EventManagement() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingNewType, setIsAddingNewType] = useState(false);

    const availableTypes = useMemo(() => {
        const defaultTypes = ["Career Fair", "Workshop", "Seminar", "Networking"];
        const existingTypes = events.map(e => e.type);
        return Array.from(new Set([...defaultTypes, ...existingTypes]));
    }, [events]);

    // Initial load and synchronization
    useEffect(() => {
        setEvents(getStoredEvents());

        const handleSync = () => {
            setEvents(getStoredEvents());
        };

        window.addEventListener("eventsUpdated", handleSync);
        window.addEventListener("storage", handleSync);
        return () => {
            window.removeEventListener("eventsUpdated", handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, []);

    // Form State
    const [formData, setFormData] = useState<Partial<Event>>({
        title: "",
        description: "",
        type: "Workshop",
        date: "",
        start: "",
        end: "",
        location: "",
        capacity: 0,
    });

    const openCreateModal = () => {
        setEditingEvent(null);
        setFormData({
            title: "",
            description: "",
            type: "Workshop",
            date: "",
            start: "",
            end: "",
            location: "",
            capacity: 0,
        });
        setIsModalOpen(true);
        setIsAddingNewType(false);
    };

    const openUpdateModal = (event: Event) => {
        setEditingEvent(event);
        setFormData(event);
        setIsModalOpen(true);
        setIsAddingNewType(false);
    };

    const handleSave = () => {
        if (!formData.title || !formData.date || !formData.start || !formData.end) {
            alert("Please fill in all required fields.");
            return;
        }

        let updatedEvents: Event[];

        if (editingEvent) {
            updatedEvents = events.map(e => e.id === editingEvent.id ? { ...e, ...formData } as Event : e);
        } else {
            const newEvent: Event = {
                ...formData,
                id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
                attendees: 0,
            } as Event;
            updatedEvents = [...events, newEvent];
        }

        setEvents(updatedEvents);
        saveStoredEvents(updatedEvents);
        setIsModalOpen(false);
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this event?")) {
            const updatedEvents = events.filter(e => e.id !== id);
            setEvents(updatedEvents);
            saveStoredEvents(updatedEvents);
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search events..."
                        className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                    Create New Event
                </Button>
            </div>

            {/* Event Table/List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-bottom border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type & Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex flex-col items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                                                <span className="text-emerald-700 font-bold text-xs uppercase">{getMonthAbbreviation(event.date)}</span>
                                                <span className="text-emerald-800 font-extrabold text-lg leading-none">{getDayNumber(event.date)}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 line-clamp-1">{event.title}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatEventDate(event.date)} • {event.start} - {event.end}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 w-fit border border-slate-200/60 mb-1.5">
                                                {event.type}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {event.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                                <span>{Math.round((event.attendees / event.capacity) * 100)}%</span>
                                                <span>{event.attendees}/{event.capacity}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => openUpdateModal(event)}
                                                className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => handleDelete(event.id)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-8 text-white relative">
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                {editingEvent ? "Update Event" : "Create New Event"}
                            </h2>
                            <p className="text-emerald-100/80 text-sm mt-1">
                                {editingEvent ? `Modifying ID: ${editingEvent.id}` : "Fill in the details to schedule a new event."}
                            </p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Event Name*</label>
                                    <Input
                                        placeholder="e.g. Annual Networking Night"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Description</label>
                                    <textarea
                                        placeholder="Tell us more about this event..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 outline-none text-sm transition-all font-medium resize-none"
                                    />
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Event Type*</label>
                                    {!isAddingNewType ? (
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: string) => {
                                                if (value === "ADD_NEW") {
                                                    setIsAddingNewType(true);
                                                    setFormData({ ...formData, type: "" });
                                                } else {
                                                    setFormData({ ...formData, type: value });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                                {availableTypes.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                                <div className="h-px bg-slate-100 my-1" />
                                                <SelectItem value="ADD_NEW" className="text-emerald-600 font-bold focus:text-emerald-700">
                                                    + Add New Type...
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="relative">
                                            <Input
                                                placeholder="Enter new event type..."
                                                value={formData.type}
                                                autoFocus
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium pr-10"
                                            />
                                            <button
                                                onClick={() => setIsAddingNewType(false)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                                title="Back to list"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Date*</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Start Time */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Start Time*</label>
                                    <Input
                                        type="time"
                                        value={formData.start}
                                        onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* End Time */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">End Time*</label>
                                    <Input
                                        type="time"
                                        value={formData.end}
                                        onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Location</label>
                                    <Input
                                        placeholder="Room, Building or Link"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Capacity */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Capacity</label>
                                    <Input
                                        type="number"
                                        placeholder="Max attendees"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Image Placeholder */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Event Image</label>
                                    <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-all group cursor-pointer">
                                        <div className="p-2 rounded-full bg-slate-50 group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-600 transition-colors">
                                            <ImageIcon className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-700 uppercase tracking-widest">Click to upload image</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="h-11 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 gap-2"
                            >
                                <Check className="h-5 w-5" strokeWidth={3} />
                                {editingEvent ? "Update Event" : "Save Event"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
