"use client";

import {
    Clock,
    MapPin,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Image as ImageIcon,
    Check,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select";
import {
    getMonthAbbreviation,
    getDayNumber,
    formatEventDate,
} from "../../_lib/events";
import { useEventManagement } from "./useEventManagement";

export default function EventManagement() {
    const {
        // State
        events,
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
        confirmDeleteEvent,
    } = useEventManagement();

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
                        onChange={(e) => handleSearch(e.target.value)}
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex items-center justify-center gap-3 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span className="text-sm font-medium">Loading events...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-400">
                                        No events found.
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event.event_id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex flex-col items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                                                    <span className="text-emerald-700 font-bold text-xs uppercase">{getMonthAbbreviation(event.date)}</span>
                                                    <span className="text-emerald-800 font-extrabold text-lg leading-none">{getDayNumber(event.date)}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 line-clamp-1">{event.event_name}</h4>
                                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {formatEventDate(event.date)} • {event.time_start} - {event.time_end}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 w-fit border border-slate-200/60 mb-1.5">
                                                    {event.event_type}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {event.location}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1 w-32">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                                    <span>{Math.round((event.attendees / (event.capacity || 1)) * 100)}%</span>
                                                    <span>{event.attendees}/{event.capacity}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${(event.attendees / (event.capacity || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openUpdateModal(event)}
                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(event.event_id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
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
                                {editingEvent ? `Modifying: ${editingEvent.event_id}` : "Fill in the details to schedule a new event."}
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
                                        value={formData.event_name}
                                        onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
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
                                            value={formData.event_type_name}
                                            onValueChange={(value: string) => {
                                                if (value === "ADD_NEW") {
                                                    setIsAddingNewType(true);
                                                    setFormData({ ...formData, event_type_name: "" });
                                                } else {
                                                    setFormData({ ...formData, event_type_name: value });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                                {availableTypeNames.map(name => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
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
                                                value={formData.event_type_name}
                                                autoFocus
                                                onChange={(e) => setFormData({ ...formData, event_type_name: e.target.value })}
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
                                        value={formData.time_start}
                                        onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* End Time */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">End Time*</label>
                                    <Input
                                        type="time"
                                        value={formData.time_end}
                                        onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Image Placeholder */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Event Image</label>
                                    <label className="h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-all group cursor-pointer overflow-hidden">
                                        {selectedImagePreview ? (
                                            <img
                                                src={selectedImagePreview}
                                                alt="Selected event preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <div className="p-2 rounded-full bg-slate-50 group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                    <ImageIcon className="h-6 w-6" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-700 uppercase tracking-widest">Click to upload image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-11 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Check className="h-5 w-5" strokeWidth={3} />
                                )}
                                {editingEvent ? "Update Event" : "Save Event"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal for Events */}
            {eventToDelete !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                            <AlertTriangle className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Event?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete this event? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEventToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteEvent}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                {isDeleting ? "Deleting..." : "Delete Event"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
