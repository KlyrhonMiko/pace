"use client";

import { useState, useEffect } from "react";
import {
    X,
    Briefcase,
    Building2,
    MapPin,
    CircleDollarSign,
    Type,
    FileText,
    Loader2,
    Calendar,
    BriefcaseIcon,
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

interface AdminJobFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingJob?: any;
    onSuccess?: () => void;
}

export default function AdminJobFormModal({ isOpen, onClose, editingJob, onSuccess }: AdminJobFormModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        company: "",
        location: "",
        type: "Full-time",
        category: "Technology",
        salary_min: "",
        salary_max: "",
        experience_level: "Junior",
        work_type: "On-site",
        description: "",
        benefits: "",
        requirements: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingJob) {
            setFormData({
                title: editingJob.title || "",
                company: editingJob.company || "",
                location: editingJob.location || "",
                type: editingJob.type || "Full-time",
                category: editingJob.category || "Technology",
                salary_min: editingJob.salary_min?.toString() || "",
                salary_max: editingJob.salary_max?.toString() || "",
                experience_level: editingJob.experienceLevel || "Junior",
                work_type: editingJob.workType || "On-site",
                description: editingJob.description || editingJob.snippet || "",
                benefits: editingJob.benefits || "",
                requirements: editingJob.requirements || "",
            });
        } else {
            setFormData({
                title: "",
                company: "",
                location: "",
                type: "Full-time",
                category: "Technology",
                salary_min: "",
                salary_max: "",
                experience_level: "Junior",
                work_type: "On-site",
                description: "",
                benefits: "",
                requirements: "",
            });
        }
    }, [editingJob, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            // Simulation of API call as in original
            console.log("Submitting job:", formData);

            setTimeout(() => {
                setIsSubmitting(false);
                onSuccess?.();
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to submit job:", error);
            setIsSubmitting(false);
        }
    };

    const handleClearForm = () => {
        if (editingJob) {
            // Reset to original values
            setFormData({
                title: editingJob.title || "",
                company: editingJob.company || "",
                location: editingJob.location || "",
                type: editingJob.type || "Full-time",
                category: editingJob.category || "Technology",
                salary_min: editingJob.salary_min?.toString() || "",
                salary_max: editingJob.salary_max?.toString() || "",
                experience_level: editingJob.experienceLevel || "Junior",
                work_type: editingJob.workType || "On-site",
                description: editingJob.description || editingJob.snippet || "",
                benefits: editingJob.benefits || "",
                requirements: editingJob.requirements || "",
            });
        } else {
            setFormData({
                title: "",
                company: "",
                location: "",
                type: "Full-time",
                category: "Technology",
                salary_min: "",
                salary_max: "",
                experience_level: "Junior",
                work_type: "On-site",
                description: "",
                benefits: "",
                requirements: "",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                                {editingJob ? "Edit Job Posting" : "Publish Job Posting"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                {editingJob
                                    ? `Modifying job details for ${editingJob.title}`
                                    : "Enter the details to announce a new career opportunity."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5" />
                            Role Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Job Title*</label>
                                <Input
                                    placeholder="e.g. Senior Software Engineer"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Company Name*</label>
                                <Input
                                    placeholder="e.g. Acme Innovations"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Location*</label>
                                <Input
                                    placeholder="e.g. Pasig City, Metro Manila"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Classification */}
                    <div>
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
                                    <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                        <SelectItem value="Freelance">Freelance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Experience</label>
                                <Select
                                    value={formData.experience_level}
                                    onValueChange={(v) => setFormData({ ...formData, experience_level: v })}
                                >
                                    <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                                        <SelectItem value="Junior">Junior</SelectItem>
                                        <SelectItem value="Mid-level">Mid-level</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Lead">Lead</SelectItem>
                                        <SelectItem value="Executive">Executive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Work Setting</label>
                                <Select
                                    value={formData.work_type}
                                    onValueChange={(v) => setFormData({ ...formData, work_type: v })}
                                >
                                    <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                        <SelectValue placeholder="Select setting" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                        <SelectItem value="On-site">On-site</SelectItem>
                                        <SelectItem value="Remote">Remote</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Salary Information */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CircleDollarSign className="h-3.5 w-3.5" />
                            Compensation (Monthly)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Minimum Salary</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 20000"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Maximum Salary</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 45000"
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
                            Job Description*
                        </label>
                        <textarea
                            required
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-600 transition-all text-sm resize-none"
                            placeholder="Provide a detailed description of the job role..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Footer */}
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
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editingJob ? "Update Job Posting" : "Publish Job Posting"}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

