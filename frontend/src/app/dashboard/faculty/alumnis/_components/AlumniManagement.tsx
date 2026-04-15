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
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    User,
    Briefcase,
} from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../../components/ui/select";
import { useAlumniManagement } from "./useAlumniManagement";
import AlumniList from "./AlumniList";
import AlumniFilters from "./AlumniFilters";

export default function AlumniManagement() {
    const {
        alumni,
        availableCourses,
        isModalOpen,
        editingAlumni,
        searchQuery,
        filterGender,
        filterCourse,
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
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-8 text-white relative">
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                Edit Alumni Record
                            </h2>
                            <p className="text-emerald-100/80 text-sm mt-1">
                                {editingAlumni
                                    ? `Modifying: ${editingAlumni.alumni_id}`
                                    : "Update alumni information."}
                            </p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Employment Info Section */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <div className="w-5 h-px bg-slate-200" />
                                    Employment Information
                                    <div className="flex-1 h-px bg-slate-200" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Employment Status</label>
                                        <Select
                                            value={formData.employment_status}
                                            onValueChange={(value: string) => setFormData({ ...formData, employment_status: value })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
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
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Industry / Sector</label>
                                        <Input
                                            placeholder="e.g. Information Technology"
                                            value={formData.employment_sector}
                                            onChange={(e) => setFormData({ ...formData, employment_sector: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Salary Package (₱)</label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 25000"
                                            value={formData.salary_package}
                                            onChange={(e) => setFormData({ ...formData, salary_package: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Job Offers Received</label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 2"
                                            value={formData.offers_received}
                                            onChange={(e) => setFormData({ ...formData, offers_received: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Personal Info Section */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <div className="w-5 h-px bg-slate-200" />
                                    Personal Information
                                    <div className="flex-1 h-px bg-slate-200" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Last Name*</label>
                                        <Input
                                            placeholder="e.g. Dela Cruz"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">First Name*</label>
                                        <Input
                                            placeholder="e.g. Juan"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Middle Name</label>
                                        <Input
                                            placeholder="e.g. Santos"
                                            value={formData.middle_name}
                                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Gender*</label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(value: string) => setFormData({ ...formData, gender: value })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Birthdate*</label>
                                        <Input
                                            type="date"
                                            value={formData.birthdate}
                                            onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Info Section */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <div className="w-5 h-px bg-slate-200" />
                                    Student / Academic Details
                                    <div className="flex-1 h-px bg-slate-200" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Student ID</label>
                                        <Input
                                            placeholder="e.g. 2020-00112"
                                            value={formData.student_id}
                                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Course</label>
                                        <Input
                                            placeholder="e.g. BSIT"
                                            value={formData.course}
                                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Year Graduated</label>
                                        <Input
                                            placeholder="e.g. 2024"
                                            value={formData.year_graduated}
                                            onChange={(e) => setFormData({ ...formData, year_graduated: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">GWA</label>
                                        <Input
                                            placeholder="e.g. 1.45"
                                            value={formData.gwa}
                                            onChange={(e) => setFormData({ ...formData, gwa: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Avg Prof Grade</label>
                                        <Input
                                            placeholder="e.g. 1.38"
                                            value={formData.avg_prof_grade}
                                            onChange={(e) => setFormData({ ...formData, avg_prof_grade: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Avg Elec Grade</label>
                                        <Input
                                            placeholder="e.g. 1.55"
                                            value={formData.avg_elec_grade}
                                            onChange={(e) => setFormData({ ...formData, avg_elec_grade: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">OJT Grade</label>
                                        <Input
                                            placeholder="e.g. 95"
                                            value={formData.ojt_grade}
                                            onChange={(e) => setFormData({ ...formData, ojt_grade: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-11 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Check className="h-5 w-5" strokeWidth={3} />
                                )}
                                {editingAlumni ? "Update Record" : "Save Record"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {alumniToDelete !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                            <AlertTriangle className="h-8 w-8 text-red-600" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Alumni Record?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete this alumni record? This action cannot be undone and all associated student data will be removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAlumniToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isDeleting ? "Deleting..." : "Delete Record"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
