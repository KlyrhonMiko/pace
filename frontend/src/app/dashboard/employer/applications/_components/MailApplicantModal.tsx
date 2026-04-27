"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, Mail, Type, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MailApplicantModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string | null;
    applicantName: string;
}

export default function MailApplicantModal({
    isOpen,
    onClose,
    applicationId,
    applicantName,
}: MailApplicantModalProps) {
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const canSend = emailSubject.trim().length > 0 && emailMessage.trim().length > 0;
    const charCount = emailMessage.length;

    const handleSendEmail = async () => {
        if (!applicationId || isSendingEmail || !canSend) return;
        setIsSendingEmail(true);
        try {
            const result = await apiFetch<any>(`/employers/applications/${applicationId}/email`, {
                method: "POST",
                body: {
                    subject: emailSubject,
                    message: emailMessage,
                }
            });
            if (result.success) {
                toast.success("Email sent successfully!");
                onClose();
                setEmailSubject("");
                setEmailMessage("");
            } else {
                toast.error(result.message || "Failed to send email");
            }
        } catch (error: any) {
            console.error("Error sending email:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSendingEmail && (open ? null : onClose())}>
            <DialogContent
                className="sm:max-w-lg border-none bg-white rounded-2xl shadow-2xl overflow-hidden p-0 gap-0"
            >
                <div className="p-6 pb-0">
                    {/* Icon + Header */}
                    <div className="flex items-start gap-4 mb-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                            <Mail className="h-5 w-5 text-emerald-600" />
                        </div>
                        <DialogHeader className="space-y-1 text-left p-0">
                            <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
                                Compose Email
                            </DialogTitle>
                            <DialogDescription className="text-[13px] text-slate-500 leading-relaxed">
                                Send a direct message to <span className="font-medium text-slate-700">{applicantName}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 -mx-6" />
                </div>

                {/* Form body */}
                <div className="px-6 pt-5 pb-5 space-y-4">
                    {/* Subject field */}
                    <div className="space-y-2">
                        <label htmlFor="email-subject" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Type className="h-3.5 w-3.5 text-slate-400" />
                            Subject
                        </label>
                        <Input
                            id="email-subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="e.g. Interview Invitation, Application Update"
                            disabled={isSendingEmail}
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-3.5 text-sm placeholder:text-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
                        />
                    </div>

                    {/* Message field */}
                    <div className="space-y-2">
                        <label htmlFor="email-message" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <MessageSquareText className="h-3.5 w-3.5 text-slate-400" />
                            Message
                        </label>
                        <div className="relative">
                            <textarea
                                id="email-message"
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                placeholder="Write your message here..."
                                disabled={isSendingEmail}
                                rows={6}
                                className={cn(
                                    "flex w-full rounded-xl border bg-slate-50/50 px-3.5 py-3 text-sm leading-relaxed",
                                    "placeholder:text-slate-400 resize-none custom-scrollbar",
                                    "focus:bg-white focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                    "transition-all duration-200",
                                    "border-slate-200"
                                )}
                            />
                            <span className="absolute bottom-2.5 right-3 text-[11px] text-slate-300 tabular-nums select-none">
                                {charCount > 0 ? `${charCount} chars` : ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-1">
                    <div className="h-px bg-slate-100 mb-4 -mx-6" />
                    <div className="flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSendingEmail}
                            className="h-10 px-5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSendEmail}
                            disabled={isSendingEmail || !canSend}
                            className={cn(
                                "h-10 px-5 rounded-xl text-sm font-semibold text-white transition-all duration-200",
                                "bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md",
                                "disabled:opacity-50 disabled:shadow-none"
                            )}
                        >
                            {isSendingEmail ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            {isSendingEmail ? "Sending..." : "Send Email"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
