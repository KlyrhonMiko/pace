"use client";

import { useState, useEffect } from "react";
import {
    Users,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    UserCircle,
    Calendar,
    ArrowUpDown
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    fetchEventRegistrants,
    EventRegistrant,
    Event
} from "../../_lib/events";
import { format } from "date-fns";

interface EventAttendeesModalProps {
    event: Event | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EventAttendeesModal({ event, isOpen, onClose }: EventAttendeesModalProps) {
    const [registrants, setRegistrants] = useState<EventRegistrant[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        if (isOpen && event) {
            loadRegistrants();
        } else {
            setRegistrants([]);
            setOffset(0);
            setSearchTerm("");
        }
    }, [isOpen, event, offset]);

    async function loadRegistrants() {
        if (!event) return;
        setLoading(true);
        try {
            const data = await fetchEventRegistrants(event.event_id, limit, offset);
            setRegistrants(data.registrants);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to load registrants", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredRegistrants = registrants.filter(r => {
        const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) ||
            r.student_id?.toLowerCase().includes(search) ||
            r.alumni_id?.toLowerCase().includes(search);
    });

    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={true}
                className="sm:max-w-4xl p-0 gap-0 rounded-2xl border-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col bg-slate-50"
            >
                <DialogHeader className="p-6 md:px-8 pt-8 pb-6 bg-white border-b border-slate-100 z-10 shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-slate-900">Event Attendees</DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 mt-1.5 flex items-center gap-2.5">
                                    <span className="font-medium text-slate-700 line-clamp-1">{event?.event_name}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 custom-scrollbar relative">
                    {/* Toolbar */}
                    <div className="px-6 md:px-8 py-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-sm z-10 text-slate-900">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {total} Registered
                            </span>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                <p className="text-sm text-slate-500 font-medium animate-pulse">Fetching attendee list...</p>
                            </div>
                        ) : filteredRegistrants.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Attendee</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Student ID</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Batch</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Registration Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRegistrants.map((registrant, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                                                            {registrant.first_name?.[0] || ""}{registrant.last_name?.[0] || (registrant.first_name ? "" : "?")}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {registrant.first_name || registrant.last_name
                                                                    ? `${registrant.first_name ?? ""} ${registrant.last_name ?? ""}`.trim()
                                                                    : "Anonymous User"}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 font-medium">
                                                                {registrant.alumni_id ? "Alumni" : "Staff / Admin"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
                                                        {registrant.student_id || "N/A"}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center h-8 w-14 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                        {registrant.year_graduated || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                                        <span className="text-xs font-medium">
                                                            {(() => {
                                                                if (!registrant.registered_at) return "N/A";
                                                                const d = new Date(registrant.registered_at);
                                                                return isNaN(d.getTime()) ? "N/A" : format(d, "MMM d, yyyy");
                                                            })()}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">No attendees found</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                                    {searchTerm ? "No results match your search criteria." : "No alumni have registered for this event yet."}
                                </p>
                                {searchTerm && (
                                    <Button
                                        variant="link"
                                        onClick={() => setSearchTerm("")}
                                        className="mt-2 text-emerald-600 font-bold"
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Pagination */}
                    <div className="px-6 md:px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                        <p className="text-xs text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{Math.min(registrants.length, total)}</span> of <span className="text-slate-900 font-bold">{total}</span> registrants
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={offset === 0 || loading}
                                onClick={() => setOffset(Math.max(0, offset - limit))}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1.5 mx-2">
                                <span className="text-xs font-bold text-slate-900">{currentPage}</span>
                                <span className="text-[10px] text-slate-400 font-medium">of</span>
                                <span className="text-xs font-bold text-slate-900">{totalPages || 1}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={offset + limit >= total || loading}
                                onClick={() => setOffset(offset + limit)}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
