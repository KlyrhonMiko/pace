"use client";

import { useState, useEffect } from "react";
import { Calendar, RotateCcw, X, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Survey } from "../../_lib/surveys";

interface ReopenSurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: { opens_at: string; closes_at: string }) => void;
    survey: Survey | null;
    isSaving?: boolean;
}

export default function ReopenSurveyModal({
    isOpen,
    onClose,
    onConfirm,
    survey,
    isSaving = false,
}: ReopenSurveyModalProps) {
    const [opensAt, setOpensAt] = useState<string>("");
    const [closesAt, setClosesAt] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            // Default to today and +7 days
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);

            setOpensAt(today.toISOString().split('T')[0]);
            setClosesAt(nextWeek.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!opensAt || !closesAt) return;
        onConfirm({ opens_at: opensAt, closes_at: closesAt });
    };

    if (!survey) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
                            <RotateCcw className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Reopen Survey
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Set a new timeframe to continue gathering responses.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-slate-50/50">
                    <div className="space-y-4">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Targeting Survey</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{survey.title}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5" /> Opens At
                                </label>
                                <DatePicker
                                    date={opensAt}
                                    onChange={(date: string) => setOpensAt(date)}
                                    placeholder="Select opening date"
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5" /> Closes At
                                </label>
                                <DatePicker
                                    date={closesAt}
                                    onChange={(date: string) => setClosesAt(date)}
                                    placeholder="Select closing date"
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-white border-t border-slate-100 sm:justify-between flex items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-slate-500 hover:text-slate-700 font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSaving || !opensAt || !closesAt}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-md shadow-emerald-100"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        {isSaving ? "Reopening..." : "Reopen Survey"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
