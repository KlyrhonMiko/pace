"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Calendar as CalendarIcon } from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string | null;
    applicantName: string;
    onSuccess?: (date: string, link: string, status: string) => void;
    initialDate?: string | null;
    initialLink?: string | null;
}

export default function ScheduleModal({ isOpen, onClose, applicationId, applicantName, onSuccess, initialDate, initialLink }: ScheduleModalProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [link, setLink] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialDate) {
                const d = new Date(initialDate);
                if (!isNaN(d.getTime())) {
                    setDate(d);
                }
            } else {
                setDate(undefined);
            }
            setLink(initialLink || "");
        }
    }, [isOpen, initialDate, initialLink]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicationId) return;

        setIsSubmitting(true);
        try {
            const formData = {
                interview_date: date ? date.toISOString() : null,
                interview_link: link || null,
            };

            const result = await apiFetch<any>(`/employers/applications/${applicationId}/schedule`, {
                method: "PATCH",
                body: formData
            });

            if (result.success) {
                toast.success(initialDate ? "Interview rescheduled successfully." : "Interview scheduled successfully.");
                if (onSuccess) onSuccess(formData.interview_date as any, formData.interview_link as any, result.data.status);
                onClose();
            } else {
                toast.error(result.message || "Failed to update schedule.");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialDate ? "Reschedule Interview" : "Set Interview Schedule"}</DialogTitle>
                    <DialogDescription>
                        {initialDate ? "Update the interview schedule with " : "Schedule an interview with "} {applicantName}. They will be able to see this information on their dashboard.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="interview_date" className="text-slate-700">Interview Date & Time</Label>
                        <DateTimePicker
                            date={date}
                            onChange={setDate}
                            placeholder="Select date and time"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="interview_link" className="text-slate-700">Meeting Link (Optional)</Label>
                        <div className="relative">
                            <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                id="interview_link"
                                type="url"
                                placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="pl-9 h-11 rounded-xl border-slate-200 bg-white focus:border-emerald-600 focus:ring-emerald-700/20"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11 px-6 rounded-xl">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {initialDate ? "Reschedule" : "Save Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
