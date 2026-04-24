"use client";

import { useState, useEffect } from "react";
import {
    X,
    Briefcase,
    MapPin,
    CircleDollarSign,
    Type,
    FileText,
    Loader2,
    Plus,
    Layout
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createJob, updateJob } from "../../../faculty/jobs/_lib/api";
import { toast } from "sonner";
import { UnifiedJob } from "../_lib/types";

interface EmployerJobFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingJob?: UnifiedJob | null;
    onSuccess?: () => void;
}

export default function EmployerJobFormModal({ isOpen, onClose, editingJob, onSuccess }: EmployerJobFormModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        location: "",
        type: "Full-time",
        salary_min: "",
        salary_max: "",
        experience_level: "Junior",
        work_type: "On-site",
        description: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingJob) {
            setFormData({
                title: editingJob.title || "",
                location: editingJob.location || "",
                type: editingJob.type || "Full-time",
                salary_min: editingJob.salary_min?.toString() || "",
                salary_max: editingJob.salary_max?.toString() || "",
                experience_level: editingJob.experienceLevel || "Junior",
                work_type: editingJob.workType || "On-site",
                description: editingJob.description || editingJob.snippet || "",
            });
        } else {
            setFormData({
                title: "",
                location: "",
                type: "Full-time",
                salary_min: "",
                salary_max: "",
                experience_level: "Junior",
                work_type: "On-site",
                description: "",
            });
        }
    }, [editingJob, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.title || !formData.location || !formData.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                job_type: formData.type, // Map 'type' to backend 'job_type'
            };

            const response = editingJob
                ? await updateJob(editingJob.dbId || editingJob.id, payload)
                : await createJob(payload);

            if ((response as any).error) {
                toast.error((response as any).error);
            } else {
                toast.success(editingJob ? "Job updated successfully" : "Job posted successfully");
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error("Failed to submit job:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearForm = () => {
        if (editingJob) {
            setFormData({
                title: editingJob.title || "",
                location: editingJob.location || "",
                type: editingJob.type || "Full-time",
                salary_min: editingJob.salary_min?.toString() || "",
                salary_max: editingJob.salary_max?.toString() || "",
                experience_level: editingJob.experienceLevel || "Junior",
                work_type: editingJob.workType || "On-site",
                description: editingJob.description || editingJob.snippet || "",
            });
        } else {
            setFormData({
                title: "",
                location: "",
                type: "Full-time",
                salary_min: "",
                salary_max: "",
                experience_level: "Junior",
                work_type: "On-site",
                description: "",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
            <DialogContent
                showCloseButton={!isSubmitting}
                className="sm:max-w-2xl p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            {editingJob ? <Layout className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-900">
                                {editingJob ? "Update Job Posting" : "New Career Opportunity"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                {editingJob
                                    ? `Refining details for "${editingJob.title}"`
                                    : "Enter the details to announce a new career opportunity."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Role Information */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5" />
                            Role Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Job Title <span className="text-red-500">*</span></label>
                                <Input
                                    placeholder="e.g. Senior Software Engineer"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Location <span className="text-red-500">*</span></label>
                                <Input
                                    placeholder="e.g. Pasig City, Metro Manila"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Type className="h-3.5 w-3.5" />
                            Classification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Job Type</label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20 transition-all">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden z-[110]">
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                        <SelectItem value="Freelance">Freelance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Seniority</label>
                                <Select
                                    value={formData.experience_level}
                                    onValueChange={(v) => setFormData({ ...formData, experience_level: v })}
                                >
                                    <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20 transition-all">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden z-[110]">
                                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                                        <SelectItem value="Junior">Junior</SelectItem>
                                        <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Lead">Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Workspace</label>
                                <Select
                                    value={formData.work_type}
                                    onValueChange={(v) => setFormData({ ...formData, work_type: v })}
                                >
                                    <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20 transition-all">
                                        <SelectValue placeholder="Select setting" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden z-[110]">
                                        <SelectItem value="On-site">On-site</SelectItem>
                                        <SelectItem value="Remote">Remote</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Compensation */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CircleDollarSign className="h-3.5 w-3.5" />
                            Compensation (Monthly PHP)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Minimum</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 30000"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Maximum</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 60000"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Job Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-600 transition-all text-sm resize-none"
                            placeholder="Detail the responsibilities, requirements, and what makes this role special..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleClearForm}
                        disabled={isSubmitting}
                        className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        {editingJob ? "Reset" : "Clear"}
                    </button>
                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            variant="ghost"
                            className="px-5 py-2.5 h-auto rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 h-auto rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                editingJob ? "Update Changes" : "Publish Posting"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
