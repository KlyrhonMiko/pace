"use client";

import { Fragment, useState } from "react";

import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Check,
    Loader2,
    ChevronDown,
    ChevronRight,
    User,
    Briefcase,
    UserCog,
    Upload,
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
import { useAlumniManagement } from "./useAlumniManagement";
import AlumniList from "./AlumniList";
import AlumniFilters from "./AlumniFilters";
import { DatePicker } from "@/components/ui/date-picker";
import CsvImportModal from "./CsvImportModal";


export default function AlumniManagement() {
    const {
        alumni,
        availableCourses,
        isModalOpen,
        editingAlumni,
        searchQuery,
        filterGender,
        filterCourse,
        alumniSkillsForView,
        isSkillsLoading,
        isSaving,
        isDeleting,
        alumniToDelete,
        expandedRows,
        formData,
        isLoading,
        error,

        setIsModalOpen,
        setFormData,
        setFilterGender,
        setFilterCourse,
        setAlumniToDelete,
        handleSearch,
        openEditModal,
        handleSave,
        handleDeleteClick,
        confirmDelete,
        toggleExpand,
        fetchAlumni,
    } = useAlumniManagement();

    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

    return (
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Alumni List */}
            <div className="lg:col-span-2">
                {/* Import CSV Button */}
                <div className="flex justify-end mb-3">
                    <button
                        id="csv-import-btn"
                        onClick={() => setIsCsvModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all"
                    >
                        <Upload className="h-4 w-4" />
                        Import CSV
                    </button>
                </div>
                <AlumniList
                    alumni={alumni}
                    isLoading={isLoading}
                    error={error}
                    expandedRows={expandedRows}
                    toggleExpand={toggleExpand}
                    openEditModal={openEditModal}
                    handleDeleteClick={handleDeleteClick}
                    fetchAlumni={fetchAlumni}
                />
            </div>

            {/* Right Column: Filters */}
            <div className="lg:col-span-1">
                <AlumniFilters
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    filterGender={filterGender}
                    setFilterGender={setFilterGender}
                    filterCourse={filterCourse}
                    setFilterCourse={setFilterCourse}
                    availableCourses={availableCourses}
                    isLoading={isLoading}
                    fetchAlumni={fetchAlumni}
                />
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    showCloseButton={!isSaving}
                    className="sm:max-w-2xl p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl"
                >
                    {/* Header — mirrors Admin User Management */}
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                                <UserCog className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900">
                                    Edit Alumni Record
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                    {editingAlumni
                                        ? `Modifying: ${editingAlumni.student?.student_id || editingAlumni.alumni_id}`
                                        : "Update alumni information."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Body */}
                    <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
                        {/* Employment Information */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Employment Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Employment Status</label>
                                    <Select
                                        value={formData.employment_status}
                                        onValueChange={(value: string) => setFormData({ ...formData, employment_status: value })}
                                    >
                                        <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                            <SelectItem value="Employed">Employed</SelectItem>
                                            <SelectItem value="Interviewing">Interviewing</SelectItem>
                                            <SelectItem value="Searching">Searching</SelectItem>
                                            <SelectItem value="Not Looking">Not Looking</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Industry / Sector</label>
                                    <Input
                                        placeholder="e.g. Information Technology"
                                        value={formData.employment_sector}
                                        onChange={(e) => setFormData({ ...formData, employment_sector: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Salary Package (₱)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 25000"
                                        value={formData.salary_package}
                                        onChange={(e) => setFormData({ ...formData, salary_package: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Job Offers Received</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 2"
                                        value={formData.offers_received}
                                        onChange={(e) => setFormData({ ...formData, offers_received: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Last Name*</label>
                                    <Input
                                        placeholder="e.g. Dela Cruz"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">First Name*</label>
                                    <Input
                                        placeholder="e.g. Juan"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Middle Name</label>
                                    <Input
                                        placeholder="e.g. Santos"
                                        value={formData.middle_name}
                                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Gender*</label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value: string) => setFormData({ ...formData, gender: value })}
                                    >
                                        <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                            <SelectItem value="NON_BINARY">Non-binary</SelectItem>
                                            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Birthdate*</label>
                                    <DatePicker
                                        date={formData.birthdate}
                                        onChange={(date: string) => setFormData({ ...formData, birthdate: date })}
                                        placeholder="Select birthdate"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Student / Academic Details */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Student / Academic Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">Student ID</label>
                                    <Input
                                        placeholder="e.g. 2020-00112"
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-4">
                                    <label className="text-sm font-medium text-slate-700">Course</label>
                                    <Select
                                        value={formData.course}
                                        onValueChange={(value: string) => setFormData({ ...formData, course: value })}
                                    >
                                        <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                            <SelectValue placeholder="Select course" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                            {availableCourses.map((course) => (
                                                <SelectItem key={course} value={course}>
                                                    {course}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">Year Graduated</label>
                                    <Input
                                        placeholder="e.g. 2024"
                                        value={formData.year_graduated}
                                        onChange={(e) => setFormData({ ...formData, year_graduated: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">GWA</label>
                                    <Input
                                        placeholder="e.g. 1.45"
                                        value={formData.gwa}
                                        onChange={(e) => setFormData({ ...formData, gwa: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">Avg Prof Grade</label>
                                    <Input
                                        placeholder="e.g. 1.38"
                                        value={formData.avg_prof_grade}
                                        onChange={(e) => setFormData({ ...formData, avg_prof_grade: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">Avg Elec Grade</label>
                                    <Input
                                        placeholder="e.g. 1.55"
                                        value={formData.avg_elec_grade}
                                        onChange={(e) => setFormData({ ...formData, avg_elec_grade: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">OJT Grade</label>
                                    <Input
                                        placeholder="e.g. 95"
                                        value={formData.ojt_grade}
                                        onChange={(e) => setFormData({ ...formData, ojt_grade: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Alumni Skills — Read-Only (alumni manages their own scores) */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Alumni Skills (View Only)
                                </h3>
                                {isSkillsLoading ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Loading skills...
                                    </span>
                                ) : alumniSkillsForView ? (
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                        Skills on record ✓
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                        Alumni hasn&apos;t set skills yet
                                    </span>
                                )}
                            </div>

                            {alumniSkillsForView ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                                    {/* General skills */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Soft Skills Avg", value: alumniSkillsForView.soft_skills_ave },
                                            { label: "Hard Skills Avg", value: alumniSkillsForView.hard_skills_ave },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="space-y-1">
                                                <p className="text-xs font-medium text-slate-600">{label}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{ width: `${value ?? 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 tabular-nums w-8 text-right">
                                                        {value ?? "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Program skills */}
                                    {alumniSkillsForView.program_skills &&
                                        Object.keys(alumniSkillsForView.program_skills).length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                                <p className="text-xs font-semibold text-slate-500">Program Skills</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(alumniSkillsForView.program_skills).map(
                                                        ([skill, score]) => (
                                                            <span
                                                                key={skill}
                                                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                                            >
                                                                {skill}
                                                                <span className="font-bold text-emerald-700">{score}</span>
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {alumniSkillsForView.updated_at && (
                                        <p className="text-[11px] text-slate-400 pt-1">
                                            Last updated by alumni:{" "}
                                            {(() => {
                                                const d = new Date(alumniSkillsForView.updated_at);
                                                if (!isNaN(d.getTime())) {
                                                    return d.toLocaleDateString("en-PH", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    });
                                                }
                                                // Fallback for backend format: "MM/DD/YYYY - HH:MM:SS"
                                                if (alumniSkillsForView.updated_at.includes(" - ")) {
                                                    return alumniSkillsForView.updated_at.split(" - ")[0];
                                                }
                                                return alumniSkillsForView.updated_at;
                                            })()}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-center">
                                    <p className="text-xs text-slate-400">
                                        This alumni has not set their skill scores yet. They can add them
                                        from their Employability Insights page.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <button
                            onClick={() => {
                                // Logic for reset/clear could go here if useAlumniManagement provided it
                                // For now matching the UI structure of Admin
                            }}
                            disabled={isSaving}
                            className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                            Reset
                        </button>
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editingAlumni ? "Update Record" : "Save Record"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                isOpen={alumniToDelete !== null}
                onClose={() => setAlumniToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Alumni Record?"
                description="Are you sure you want to delete this alumni record? This action cannot be undone and all associated student data will be removed."
                confirmText="Delete Record"
                variant="danger"
                isLoading={isDeleting}
            />

            <CsvImportModal
                open={isCsvModalOpen}
                onOpenChange={setIsCsvModalOpen}
                onImportComplete={fetchAlumni}
            />
        </div>
    );
}
