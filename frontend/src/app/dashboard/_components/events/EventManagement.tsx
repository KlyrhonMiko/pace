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
} from "lucide-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getMonthAbbreviation,
    getDayNumber,
    formatEventDate,
} from "../../_lib/events";
import { useEventManagement } from "./useEventManagement";
import EventList from "./EventList";
import EventFilters from "./EventFilters";

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
        handleClearForm,
        confirmDeleteEvent,
        loadData,
    } = useEventManagement();

    return (
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Events List */}
            <div className="lg:col-span-2">
                <EventList
                    events={events}
                    isLoading={isLoading}
                    openUpdateModal={openUpdateModal}
                    handleDeleteClick={handleDeleteClick}
                    fetchEvents={loadData}
                />
            </div>

            {/* Right Column: Actions & Filters */}
            <div className="lg:col-span-1">
                <EventFilters
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    openCreateModal={openCreateModal}
                    isLoading={isLoading}
                />
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    showCloseButton={!isSaving}
                    className="sm:max-w-2xl p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                                {editingEvent
                                    ? <Edit2 className="h-5 w-5" />
                                    : <Plus className="h-5 w-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900">
                                    {editingEvent ? "Update Event" : "Create New Event"}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                    {editingEvent
                                        ? `Modifying details for: ${editingEvent.event_name}`
                                        : "Fill in the details to schedule a new event for the community."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Body */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Event Name*</label>
                                <Input
                                    placeholder="e.g. Annual Networking Night"
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    placeholder="Tell us more about this event..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-emerald-600 focus:ring-emerald-700/20 outline-none text-sm transition-all font-medium resize-none"
                                />
                            </div>

                            {/* Type */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Event Type*</label>
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
                                        <SelectTrigger className="!w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
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
                                            className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20 pr-10"
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
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Date*</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>

                            {/* Start Time */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Start Time*</label>
                                <Input
                                    type="time"
                                    value={formData.time_start}
                                    onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>

                            {/* End Time */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">End Time*</label>
                                <Input
                                    type="time"
                                    value={formData.time_end}
                                    onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Location</label>
                                <Input
                                    placeholder="Room, Building or Link"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>

                            {/* Capacity */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Capacity</label>
                                <Input
                                    type="number"
                                    placeholder="Max attendees"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>

                            {/* Image Placeholder */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Event Image</label>
                                <label className="h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-all group cursor-pointer overflow-hidden">
                                    {selectedImagePreview ? (
                                        <img
                                            src={selectedImagePreview}
                                            alt="Selected event preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-emerald-600">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-sm font-semibold text-slate-600">Click to upload image</span>
                                                <span className="text-[11px] text-slate-400 font-medium">PNG, JPG or WEBP up to 5MB</span>
                                            </div>
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

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <button
                            onClick={handleClearForm}
                            disabled={isSaving}
                            className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                            {editingEvent ? "Reset" : "Clear"}
                        </button>
                        <div className="flex items-center gap-2.5">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                                className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-200 transition-all active:scale-95 gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                )}
                                {editingEvent ? "Save Changes" : "Create Event"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmationModal
                isOpen={eventToDelete !== null}
                onClose={() => setEventToDelete(null)}
                onConfirm={confirmDeleteEvent}
                title="Delete Event?"
                description="Are you sure you want to delete this event? This action cannot be undone."
                confirmText="Delete Event"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
