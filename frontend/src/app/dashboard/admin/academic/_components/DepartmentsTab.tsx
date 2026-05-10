"use client";

import { useDepartments } from "../../../_lib/hooks/useDepartments";
import { 
    Plus, 
    Search, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    RotateCcw, 
    Building2,
    CheckSquare,
    Square,
    Download,
    FileUp,
    Filter,
    Users
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
import { useState } from "react";
import { DepartmentModal, BulkImportModal } from "./AcademicModals";
import { CollegeDeptPublic } from "../../../_lib/academic";

export default function DepartmentsTab() {
    const {
        departments,
        total,
        isLoading,
        searchQuery,
        showDeleted,
        currentPage,
        pageSize,
        isModalOpen,
        editingDept,
        isConfirmModalOpen,
        confirmAction,
        selectedIds,
        isSaving,

        setShowDeleted,
        setCurrentPage,
        setIsModalOpen,
        setEditingDept,
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
    } = useDepartments();

    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

    const totalPages = Math.ceil(total / pageSize);

    const openCreateModal = () => {
        setEditingDept(null);
        setIsModalOpen(true);
    };

    const openEditModal = (dept: CollegeDeptPublic) => {
        setEditingDept(dept);
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
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Departments</h3>
                                <p className="text-xs text-gray-500">Total: {total} departments</p>
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
                                            {selectedIds.length === departments.length && departments.length > 0 
                                                ? <CheckSquare size={18} className="text-emerald-600" /> 
                                                : <Square size={18} />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Department ID</th>
                                    <th className="px-6 py-4">Abbr</th>
                                    <th className="px-6 py-4">Department Name</th>
                                    <th className="px-6 py-4 text-center">Alumni</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-8">
                                                <div className="h-4 bg-gray-100 rounded w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                            <Building2 size={40} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-medium">No departments found</p>
                                            <p className="text-xs">Try adjusting your search or filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept.college_dept_id} className={`hover:bg-gray-50/50 transition-colors ${dept.is_deleted ? 'bg-gray-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <Checkbox 
                                                    checked={selectedIds.includes(dept.college_dept_id)}
                                                    onCheckedChange={() => toggleSelection(dept.college_dept_id)}
                                                    className="border-gray-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                                                {dept.college_dept_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                                    {dept.college_dept_abbv}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{dept.college_dept_name}</div>
                                                {dept.college_dept_desc && (
                                                    <div className="text-[10px] text-gray-400 line-clamp-1">{dept.college_dept_desc}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                    <Users size={12} />
                                                    {dept.alumni_count}
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
                                                            onClick={() => openEditModal(dept)}
                                                        >
                                                            <Edit size={14} /> Edit Department
                                                        </DropdownMenuItem>
                                                        {dept.is_deleted ? (
                                                            <DropdownMenuItem 
                                                                className="gap-2 font-medium text-emerald-600 cursor-pointer"
                                                                onClick={() => openConfirm('restore', dept.college_dept_id)}
                                                            >
                                                                <RotateCcw size={14} /> Restore
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                className="gap-2 font-medium text-red-600 cursor-pointer"
                                                                onClick={() => openConfirm('delete', dept.college_dept_id)}
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
                            Showing {departments.length} of {total} records
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
                                New Department
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
                                placeholder="Search departments..." 
                                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/10 transition-all"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">Export Options</h4>
                        <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2.5 h-11 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            onClick={() => {
                                // Simple CSV export of current view
                                const headers = ["ID", "Abbr", "Name", "Alumni"];
                                const rows = departments.map(d => [d.college_dept_id, d.college_dept_abbv, d.college_dept_name, d.alumni_count]);
                                const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'departments.csv';
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
            <DepartmentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={editingDept ? (data) => handleUpdate(editingDept.college_dept_id, data) : handleCreate}
                editingDept={editingDept}
                isSaving={isSaving}
            />

            <BulkImportModal 
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onImport={handleBatchCreate}
                type="department"
                isSaving={isSaving}
            />

            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirm}
                title={
                    confirmAction?.type === 'delete' ? "Delete Department?" : 
                    confirmAction?.type === 'restore' ? "Restore Department?" :
                    confirmAction?.type === 'batchDelete' ? "Delete Selected Departments?" : "Restore Selected Departments?"
                }
                description="This action will affect the visibility of this department and its associated courses."
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
