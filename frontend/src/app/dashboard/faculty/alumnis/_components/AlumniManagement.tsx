"use client";

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

// ─── Gender Badge ─────────────────────────────────────────────────────────────

function GenderBadge({ gender }: { gender: string }) {
    const config: Record<string, { bg: string; text: string; border: string }> = {
        Male: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/60" },
        Female: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200/60" },
    };
    const c = config[gender] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200/60" };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
            {gender}
        </span>
    );
}

// ─── Student Detail Row ───────────────────────────────────────────────────────

function StudentDetailRow({ label, value }: { label: string; value: string | number | null }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-slate-700">{value ?? "—"}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

        setIsModalOpen,
        setFormData,
        setFilterGender,
        setFilterCourse,
        setAlumniToDelete,
        handleSearch,
        openCreateModal,
        openEditModal,
        handleSave,
        handleDeleteClick,
        confirmDelete,
        toggleExpand,
    } = useAlumniManagement();

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search alumni..."
                            className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterGender} onValueChange={setFilterGender}>
                        <SelectTrigger className="h-11 w-full sm:w-36 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium text-sm">
                            <SelectValue placeholder="All Genders" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                        <SelectTrigger className="h-11 w-full sm:w-36 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium text-sm">
                            <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                            <SelectItem value="all">All Courses</SelectItem>
                            {availableCourses.map((course) => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                    Add Alumni
                </Button>
            </div>

            {/* Alumni Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-bottom border-slate-200">
                                <th className="px-4 py-4 w-10"></th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alumni ID</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Birthdate</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Age</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {alumni.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">
                                        No alumni records found.
                                    </td>
                                </tr>
                            ) : (
                                alumni.map((record) => {
                                    const isExpanded = expandedRows.has(record.alumni_id);
                                    const hasStudent = record.student !== null;
                                    return (
                                        <>
                                            <tr
                                                key={record.alumni_id}
                                                className={`hover:bg-slate-50/80 transition-colors group ${isExpanded ? "bg-slate-50/50" : ""}`}
                                            >
                                                {/* Expand Toggle */}
                                                <td className="px-4 py-4">
                                                    {hasStudent ? (
                                                        <button
                                                            onClick={() => toggleExpand(record.alumni_id)}
                                                            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="p-1 text-slate-200">
                                                            <ChevronRight className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                        {record.alumni_id}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 text-xs font-bold flex-shrink-0">
                                                            {record.first_name[0]}{record.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-sm">
                                                                {record.last_name}, {record.first_name}{record.middle_name ? ` ${record.middle_name}` : ""}
                                                            </h4>
                                                            {hasStudent && (
                                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                                    {record.student!.course} • Class of {record.student!.year_graduated}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-slate-600">
                                                        {new Date(record.birthdate).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-medium text-slate-700">{record.age}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <GenderBadge gender={record.gender} />
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditModal(record)}
                                                            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                            title="Edit alumni"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(record.alumni_id)}
                                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            title="Delete alumni"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Student Details */}
                                            {isExpanded && hasStudent && (
                                                <tr key={`${record.alumni_id}-details`} className="bg-gradient-to-r from-emerald-50/40 to-teal-50/30">
                                                    <td colSpan={7} className="px-6 py-5">
                                                        <div className="ml-10">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                                                                    <User className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Student Details</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-5">
                                                                <StudentDetailRow label="Student ID" value={record.student!.student_id} />
                                                                <StudentDetailRow label="Course" value={record.student!.course} />
                                                                <StudentDetailRow label="Year Graduated" value={record.student!.year_graduated} />
                                                                <StudentDetailRow label="GWA" value={record.student!.gwa.toFixed(2)} />
                                                                <StudentDetailRow label="Avg Prof Grade" value={record.student!.avg_prof_grade?.toFixed(2) ?? null} />
                                                                <StudentDetailRow label="Avg Elec Grade" value={record.student!.avg_elec_grade?.toFixed(2) ?? null} />
                                                                <StudentDetailRow label="OJT Grade" value={record.student!.ojt_grade} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-8 text-white relative">
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                {editingAlumni ? "Edit Alumni Record" : "Add New Alumni"}
                            </h2>
                            <p className="text-emerald-100/80 text-sm mt-1">
                                {editingAlumni
                                    ? `Modifying: ${editingAlumni.alumni_id}`
                                    : "Fill in the details to register a new alumni."}
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
