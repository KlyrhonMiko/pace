"use client";

import { useCourses } from "../../../_lib/hooks/useCourses";
import { 
    Plus, 
    Search, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    RotateCcw, 
    GraduationCap,
    CheckSquare,
    Square,
    Download,
    FileUp,
    Filter,
    Users,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useState, useEffect } from "react";
import { CourseModal, BulkImportModal } from "./AcademicModals";
import { getDepartments, CoursePublic } from "../../../_lib/academic";

export default function CoursesTab() {
    const {
        courses,
        total,
        isLoading,
        searchQuery,
        filterDept,
        showDeleted,
        currentPage,
        pageSize,
        isModalOpen,
        editingCourse,
        isConfirmModalOpen,
        confirmAction,
        selectedIds,
        isSaving,

        setFilterDept,
        setShowDeleted,
        setCurrentPage,
        setIsModalOpen,
        setEditingCourse,
        setIsConfirmModalOpen,
        setConfirmAction,
        handleSearch,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleRestore,
        handleBatchDelete,
        handleBatchRestore,
        handleBatchCreate,
        toggleSelection,
        toggleSelectAll,
    } = useCourses();

    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        getDepartments({ limit: 0 }).then(res => {
            if (res.success) setDepartments(res.data.college_depts);
        });
    }, []);

    const totalPages = Math.ceil(total / pageSize);

    const openCreateModal = () => {
        setEditingCourse(null);
        setIsModalOpen(true);
    };

    const openEditModal = (course: CoursePublic) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const openConfirm = (type: 'delete' | 'restore', id: string) => {
        setConfirmAction({ type, id });
        setIsConfirmModalOpen(true);
    };

    const handleConfirm = () => {
        if (!confirmAction) return;
        if (confirmAction.type === 'delete' && confirmAction.id) handleDelete(confirmAction.id);
        if (confirmAction.type === 'restore' && confirmAction.id) handleRestore(confirmAction.id);
        if (confirmAction.type === 'batchDelete') handleBatchDelete(selectedIds);
        if (confirmAction.type === 'batchRestore') handleBatchRestore(selectedIds);
        setIsConfirmModalOpen(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Courses</h3>
                                <p className="text-xs text-gray-500">Total: {total} courses</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="h-9 px-4 rounded-xl font-bold gap-2 animate-in zoom-in-95 duration-200"
                                    onClick={() => {
                                        setConfirmAction({ type: showDeleted ? 'batchRestore' : 'batchDelete' });
                                        setIsConfirmModalOpen(true);
                                    }}
                                >
                                    {showDeleted ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                                    {showDeleted ? "Restore" : "Delete"} Selected ({selectedIds.length})
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={`h-9 px-4 rounded-xl font-bold gap-2 transition-all ${showDeleted ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}`}
                                onClick={() => {
                                    setShowDeleted(!showDeleted);
                                    setCurrentPage(0);
                                }}
                            >
                                <Filter size={16} />
                                {showDeleted ? "Showing Deleted" : "Show Deleted"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[11px] text-gray-500 bg-gray-50/50 border-b border-gray-100 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <div 
                                            className="cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors"
                                            onClick={toggleSelectAll}
                                        >
                                            {selectedIds.length === courses.length && courses.length > 0 
                                                ? <CheckSquare size={18} className="text-emerald-600" /> 
                                                : <Square size={18} />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Course ID</th>
                                    <th className="px-6 py-4">Abbr</th>
                                    <th className="px-6 py-4">Course Name</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4 text-center">Alumni</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-8">
                                                <div className="h-4 bg-gray-100 rounded w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : courses.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                                            <GraduationCap size={40} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-medium">No courses found</p>
                                            <p className="text-xs">Try adjusting your search or filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map((course) => (
                                        <tr key={course.course_id} className={`hover:bg-gray-50/50 transition-colors ${course.is_deleted ? 'bg-gray-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <Checkbox 
                                                    checked={selectedIds.includes(course.course_id)}
                                                    onCheckedChange={() => toggleSelection(course.course_id)}
                                                    className="border-gray-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                                                {course.course_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                                    {course.course_abbv}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{course.course_name}</div>
                                                {course.course_desc && (
                                                    <div className="text-[10px] text-gray-400 line-clamp-1">{course.course_desc}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-600">{course.college_dept_abbv || course.college_dept_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                    <Users size={12} />
                                                    {course.alumni_count}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl">
                                                        <DropdownMenuItem 
                                                            className="gap-2 font-medium cursor-pointer"
                                                            onClick={() => openEditModal(course)}
                                                        >
                                                            <Edit size={14} /> Edit Course
                                                        </DropdownMenuItem>
                                                        {course.is_deleted ? (
                                                            <DropdownMenuItem 
                                                                className="gap-2 font-medium text-emerald-600 cursor-pointer"
                                                                onClick={() => openConfirm('restore', course.course_id)}
                                                            >
                                                                <RotateCcw size={14} /> Restore
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                className="gap-2 font-medium text-red-600 cursor-pointer"
                                                                onClick={() => openConfirm('delete', course.course_id)}
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <p className="text-xs text-gray-500 font-medium">
                            Showing {courses.length} of {total} records
                        </p>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === 0 || isLoading}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="h-8 rounded-lg text-xs font-bold"
                            >
                                Previous
                            </Button>
                            <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                                {currentPage + 1} / {totalPages || 1}
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage >= totalPages - 1 || isLoading}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="h-8 rounded-lg text-xs font-bold"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-emerald-600" />
                            Creation Hub
                        </h4>
                        <div className="space-y-2">
                            <Button 
                                className="w-full justify-start gap-2.5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20"
                                onClick={openCreateModal}
                            >
                                <Plus size={18} />
                                New Course
                            </Button>
                            <Button 
                                variant="outline"
                                className="w-full justify-start gap-2.5 h-11 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                onClick={() => setIsBulkImportOpen(true)}
                            >
                                <FileUp size={18} className="text-gray-400" />
                                Bulk Import (CSV)
                            </Button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Search size={16} className="text-blue-600" />
                            Search & Filter
                        </h4>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="Search courses..." 
                                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/10 transition-all"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Filter by Dept</label>
                            <select 
                                className="w-full h-11 bg-gray-50 border-gray-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all appearance-none"
                                value={filterDept}
                                onChange={(e) => {
                                    setFilterDept(e.target.value);
                                    setCurrentPage(0);
                                }}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.college_dept_id} value={d.college_dept_abbv}>
                                        {d.college_dept_abbv} - {d.college_dept_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">Export Options</h4>
                        <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2.5 h-11 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            onClick={() => {
                                // Simple CSV export of current view
                                const headers = ["ID", "Abbr", "Name", "Department", "Alumni"];
                                const rows = courses.map(c => [c.course_id, c.course_abbv, c.course_name, c.college_dept_abbv, c.alumni_count]);
                                const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'courses.csv';
                                a.click();
                            }}
                        >
                            <Download size={18} className="text-gray-400" />
                            Export Current View
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CourseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={editingCourse ? (data) => handleUpdate(editingCourse.course_id, data) : handleCreate}
                editingCourse={editingCourse}
                departments={departments}
                isSaving={isSaving}
            />

            <BulkImportModal 
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onImport={handleBatchCreate}
                type="course"
                isSaving={isSaving}
                departments={departments}
            />

            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirm}
                title={
                    confirmAction?.type === 'delete' ? "Delete Course?" : 
                    confirmAction?.type === 'restore' ? "Restore Course?" :
                    confirmAction?.type === 'batchDelete' ? "Delete Selected Courses?" : "Restore Selected Courses?"
                }
                description="This action will affect the visibility of this course in the platform."
                confirmText={
                    confirmAction?.type === 'delete' || confirmAction?.type === 'batchDelete' ? "Delete" : "Restore"
                }
                variant={
                    confirmAction?.type === 'delete' || confirmAction?.type === 'batchDelete' ? "danger" : "success"
                }
            />
        </div>
    );
}
