"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, Building2, MapPin, CircleDollarSign, Calendar, Type, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingJob ? `/jobs/${editingJob.dbId || editingJob.id}` : "/jobs/";
            const method = editingJob ? "PATCH" : "POST";

            // In a real app, you'd use your apiFetch here
            // For now, I'll simulate the call
            console.log("Submitting job:", formData);

            // Mocking success
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col bg-white shadow-2xl">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white">
                    <div>
                        <h2 className="text-xl font-bold">{editingJob ? "Edit Job Posting" : "Create New Job Posting"}</h2>
                        <p className="text-sm text-emerald-100 opacity-90">Enter the details of the career opportunity.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Type size={14} className="text-emerald-600" />
                                Job Title
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                placeholder="e.g. Senior Software Engineer"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Building2 size={14} className="text-emerald-600" />
                                Company Name
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                placeholder="e.g. Acme Innovations"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={14} className="text-emerald-600" />
                                Location
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                placeholder="e.g. Pasig City, Metro Manila"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        {/* Job Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Briefcase size={14} className="text-emerald-600" />
                                Job Type
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none bg-white"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                                <option>Internship</option>
                                <option>Freelance</option>
                            </select>
                        </div>

                        {/* Experience Level */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Briefcase size={14} className="text-emerald-600" />
                                Experience Level
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none bg-white"
                                value={formData.experience_level}
                                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                            >
                                <option>Entry Level</option>
                                <option>Junior</option>
                                <option>Mid-level</option>
                                <option>Senior</option>
                                <option>Lead</option>
                                <option>Executive</option>
                            </select>
                        </div>

                        {/* Work Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Building2 size={14} className="text-emerald-600" />
                                Work Setting
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none bg-white"
                                value={formData.work_type}
                                onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                            >
                                <option>On-site</option>
                                <option>Remote</option>
                                <option>Hybrid</option>
                            </select>
                        </div>

                        {/* Salary Min */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <CircleDollarSign size={14} className="text-emerald-600" />
                                Salary Range (Monthly)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="Min"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                />
                                <span className="text-gray-400">—</span>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="Max"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-emerald-600" />
                            Job Description
                        </label>
                        <textarea
                            required
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                            placeholder="Provide a detailed description of the job role..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 disabled:opacity-50"
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? "Saving..." : editingJob ? "Update Job Posting" : "Publish Job Posting"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
