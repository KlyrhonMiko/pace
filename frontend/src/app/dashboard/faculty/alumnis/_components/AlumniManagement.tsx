"use client";

import { Fragment } from "react";

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

function parseDigitSkillValue(raw: string): number | null {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) return null;
    const parsed = parseInt(digitsOnly, 10);
    if (Number.isNaN(parsed)) return null;
    return Math.min(100, parsed);
}

export default function AlumniManagement() {
    const {
        alumni,
        availableCourses,
        isModalOpen,
        editingAlumni,
        searchQuery,
        filterGender,
        filterCourse,
        hasSkillsRecord,
        isSkillsLoading,
        activeProgramSkills,
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
        setSkillScore,
        fetchAlumni,
    } = useAlumniManagement();

    return (
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Alumni List */}
            <div className="lg:col-span-2">
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

                        {/* Alumni Skills */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Alumni Skills (Employability Inputs)
                                </h3>
                                {isSkillsLoading ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Loading skills...
                                    </span>
                                ) : hasSkillsRecord ? (
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                        Existing skills record
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                        No skills record yet
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Soft Skills Average</label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0 - 100"
                                        value={formData.soft_skills_ave ?? ""}
                                        onChange={(e) => {
                                            const parsed = parseDigitSkillValue(e.target.value);
                                            setFormData({ ...formData, soft_skills_ave: parsed });
                                        }}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Hard Skills Average</label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0 - 100"
                                        value={formData.hard_skills_ave ?? ""}
                                        onChange={(e) => {
                                            const parsed = parseDigitSkillValue(e.target.value);
                                            setFormData({ ...formData, hard_skills_ave: parsed });
                                        }}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Program Skills (Course-based)</label>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-4">
                                        {activeProgramSkills.length === 0 ? (
                                            <p className="text-xs text-slate-500">
                                                Select a course first to show the relevant skill sliders.
                                            </p>
                                        ) : (
                                            activeProgramSkills.map((skillName) => {
                                                const value = formData.program_skill_values[skillName] ?? 0;
                                                return (
                                                    <div key={skillName} className="space-y-1.5 border border-slate-200 rounded-lg p-3 bg-white">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-xs font-medium text-slate-700">{skillName}</span>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                value={value}
                                                                onChange={(e) => {
                                                                    const parsed = parseDigitSkillValue(e.target.value);
                                                                    setSkillScore(skillName, parsed);
                                                                }}
                                                                className="h-8 w-24 text-right bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                                            />
                                                        </div>
                                                        <p className="text-[11px] text-slate-500">Allowed range: 0-100</p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
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
        </div>
    );
}
