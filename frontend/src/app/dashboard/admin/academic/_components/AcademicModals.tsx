"use client";

import { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

// --- Department Modal ---

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    editingDept?: any;
    isSaving: boolean;
}

export function DepartmentModal({ isOpen, onClose, onSave, editingDept, isSaving }: DepartmentModalProps) {
    const [formData, setFormData] = useState({
        college_dept_abbv: "",
        college_dept_name: "",
        college_dept_desc: ""
    });

    useEffect(() => {
        if (editingDept) {
            setFormData({
                college_dept_abbv: editingDept.college_dept_abbv,
                college_dept_name: editingDept.college_dept_name,
                college_dept_desc: editingDept.college_dept_desc || ""
            });
        } else {
            setFormData({
                college_dept_abbv: "",
                college_dept_name: "",
                college_dept_desc: ""
            });
        }
    }, [editingDept, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900">
                                {editingDept ? "Edit Department" : "Create New Department"}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter the department details below.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="abbv" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Abbreviation*</Label>
                        <Input 
                            id="abbv" 
                            placeholder="e.g. CCS" 
                            className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/10 transition-all uppercase"
                            value={formData.college_dept_abbv}
                            onChange={(e) => setFormData({ ...formData, college_dept_abbv: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name*</Label>
                        <Input 
                            id="name" 
                            placeholder="e.g. College of Computer Studies" 
                            className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/10 transition-all"
                            value={formData.college_dept_name}
                            onChange={(e) => setFormData({ ...formData, college_dept_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="desc" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</Label>
                        <textarea 
                            id="desc" 
                            placeholder="Brief description of the department..." 
                            className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all text-sm resize-none"
                            value={formData.college_dept_desc}
                            onChange={(e) => setFormData({ ...formData, college_dept_desc: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-emerald-600/20">
                            {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                            {editingDept ? "Save Changes" : "Create Department"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Course Modal ---

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    editingCourse?: any;
    departments: any[];
    isSaving: boolean;
}

export function CourseModal({ isOpen, onClose, onSave, editingCourse, departments, isSaving }: CourseModalProps) {
    const [formData, setFormData] = useState({
        course_abbv: "",
        course_name: "",
        course_desc: "",
        college_dept_abbv: ""
    });

    useEffect(() => {
        if (editingCourse) {
            setFormData({
                course_abbv: editingCourse.course_abbv,
                course_name: editingCourse.course_name,
                course_desc: editingCourse.course_desc || "",
                college_dept_abbv: editingCourse.college_dept_abbv || ""
            });
        } else {
            setFormData({
                course_abbv: "",
                course_name: "",
                course_desc: "",
                college_dept_abbv: departments[0]?.college_dept_abbv || ""
            });
        }
    }, [editingCourse, isOpen, departments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <GraduationCap size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900">
                                {editingCourse ? "Edit Course" : "Create New Course"}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter the course details below.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-abbv" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Abbreviation*</Label>
                            <Input 
                                id="c-abbv" 
                                placeholder="e.g. BSCS" 
                                className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-blue-600/10 transition-all uppercase"
                                value={formData.course_abbv}
                                onChange={(e) => setFormData({ ...formData, course_abbv: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-dept" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department*</Label>
                            <select 
                                id="c-dept"
                                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none"
                                value={formData.college_dept_abbv}
                                onChange={(e) => setFormData({ ...formData, college_dept_abbv: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select Dept</option>
                                {departments.map(d => (
                                    <option key={d.college_dept_id} value={d.college_dept_abbv}>
                                        {d.college_dept_abbv}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Course Name*</Label>
                        <Input 
                            id="c-name" 
                            placeholder="e.g. BS in Computer Science" 
                            className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-blue-600/10 transition-all"
                            value={formData.course_name}
                            onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-desc" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</Label>
                        <textarea 
                            id="c-desc" 
                            placeholder="Brief description of the course..." 
                            className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all text-sm resize-none"
                            value={formData.course_desc}
                            onChange={(e) => setFormData({ ...formData, course_desc: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-blue-600/20">
                            {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                            {editingCourse ? "Save Changes" : "Create Course"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Bulk Import Modal (Form-based, no CSV) ---

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: any[]) => Promise<boolean>;
    type: 'department' | 'course';
    isSaving: boolean;
    departments?: { college_dept_abbv: string; college_dept_name: string; college_dept_id: string }[];
}

type DeptRow = { college_dept_abbv: string; college_dept_name: string; college_dept_desc: string; _id: number };
type CourseRow = { course_abbv: string; course_name: string; course_desc: string; college_dept_abbv: string; _id: number };

let _rowId = 0;
const newDeptRow = (): DeptRow => ({ college_dept_abbv: "", college_dept_name: "", college_dept_desc: "", _id: ++_rowId });
const newCourseRow = (deptAbbv = ""): CourseRow => ({ course_abbv: "", course_name: "", course_desc: "", college_dept_abbv: deptAbbv, _id: ++_rowId });

export function BulkImportModal({ isOpen, onClose, onImport, type, isSaving, departments = [] }: BulkImportModalProps) {
    const [deptRows, setDeptRows] = useState<DeptRow[]>(() => [newDeptRow(), newDeptRow(), newDeptRow()]);
    const [courseRows, setCourseRows] = useState<CourseRow[]>(() => [newCourseRow(), newCourseRow()]);

    const defaultDept = departments[0]?.college_dept_abbv || "";

    // Reset rows whenever modal closes (use resetKey to avoid setState-in-effect)
    const prevIsOpen = useState(isOpen);
    if (prevIsOpen[0] !== isOpen) {
        prevIsOpen[1](isOpen);
        if (!isOpen) {
            setDeptRows([newDeptRow(), newDeptRow(), newDeptRow()]);
            setCourseRows([newCourseRow(defaultDept), newCourseRow(defaultDept)]);
        }
    }

    // --- Dept helpers ---
    const updateDeptRow = (id: number, field: keyof DeptRow, value: string) =>
        setDeptRows(rows => rows.map(r => r._id === id ? { ...r, [field]: value } : r));
    const removeDeptRow = (id: number) =>
        setDeptRows(rows => rows.filter(r => r._id !== id));
    const addDeptRow = () => setDeptRows(rows => [...rows, newDeptRow()]);

    // --- Course helpers ---
    const updateCourseRow = (id: number, field: keyof CourseRow, value: string) =>
        setCourseRows(rows => rows.map(r => r._id === id ? { ...r, [field]: value } : r));
    const removeCourseRow = (id: number) =>
        setCourseRows(rows => rows.filter(r => r._id !== id));
    const addCourseRow = () => setCourseRows(rows => [...rows, newCourseRow(defaultDept)]);

    const handleImport = async () => {
        let items: any[];
        if (type === 'department') {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            items = deptRows.filter(r => r.college_dept_abbv.trim() && r.college_dept_name.trim()).map(({ _id: _unused, ...r }) => r);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            items = courseRows.filter(r => r.course_abbv.trim() && r.course_name.trim() && r.college_dept_abbv).map(({ _id: _unused, ...r }) => r);
        }

        if (items.length === 0) {
            toast.error("Please fill in at least one complete row before importing.");
            return;
        }
        const success = await onImport(items);
        if (success) onClose();
    };

    const isDeptValid = deptRows.filter(r => r.college_dept_abbv.trim() && r.college_dept_name.trim()).length > 0;
    const isCourseValid = courseRows.filter(r => r.course_abbv.trim() && r.course_name.trim() && r.college_dept_abbv).length > 0;
    const canImport = type === 'department' ? isDeptValid : isCourseValid;

    const accentColor = type === 'department' ? 'emerald' : 'blue';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-${accentColor}-600 flex items-center justify-center text-white shadow-lg shadow-${accentColor}-600/20`}>
                            {type === 'department' ? <Building2 size={20} /> : <GraduationCap size={20} />}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900">
                                Batch Add {type === 'department' ? 'Departments' : 'Courses'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Fill in each row below. Add as many as you need, then click Import.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {/* Legend */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
                        <span>Required fields</span>
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="h-2 w-2 rounded-full bg-gray-300 inline-block" />
                        <span>Optional fields</span>
                    </div>

                    {type === 'department' ? (
                        <div className="space-y-3">
                            {/* Column headers */}
                            <div className="grid grid-cols-[2fr_3fr_3fr_auto] gap-3 px-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Abbreviation <span className="text-red-400">*</span>
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Department Name <span className="text-red-400">*</span>
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Description
                                </span>
                                <span />
                            </div>

                            {deptRows.map((row, idx) => (
                                <div
                                    key={row._id}
                                    className="grid grid-cols-[2fr_3fr_3fr_auto] gap-3 items-center group"
                                >
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 select-none">{idx + 1}</span>
                                        <Input
                                            placeholder="e.g. CCS"
                                            className="pl-8 h-10 bg-gray-50 border-gray-200 rounded-xl uppercase font-bold focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-sm"
                                            value={row.college_dept_abbv}
                                            onChange={e => updateDeptRow(row._id, 'college_dept_abbv', e.target.value)}
                                            maxLength={20}
                                        />
                                    </div>
                                    <Input
                                        placeholder="e.g. College of Computer Studies"
                                        className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-sm"
                                        value={row.college_dept_name}
                                        onChange={e => updateDeptRow(row._id, 'college_dept_name', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Optional description..."
                                        className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-gray-400 transition-all text-sm text-gray-500"
                                        value={row.college_dept_desc}
                                        onChange={e => updateDeptRow(row._id, 'college_dept_desc', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeDeptRow(row._id)}
                                        disabled={deptRows.length === 1}
                                        className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                        title="Remove row"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addDeptRow}
                                className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <span className="text-lg leading-none">+</span>
                                Add Another Row
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Column headers */}
                            <div className="grid grid-cols-[1.5fr_2.5fr_1.5fr_2fr_auto] gap-3 px-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Abbreviation <span className="text-red-400">*</span>
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Course Name <span className="text-red-400">*</span>
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Department <span className="text-red-400">*</span>
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Description
                                </span>
                                <span />
                            </div>

                            {courseRows.map((row, idx) => (
                                <div
                                    key={row._id}
                                    className="grid grid-cols-[1.5fr_2.5fr_1.5fr_2fr_auto] gap-3 items-center group"
                                >
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 select-none">{idx + 1}</span>
                                        <Input
                                            placeholder="e.g. BSCS"
                                            className="pl-8 h-10 bg-gray-50 border-gray-200 rounded-xl uppercase font-bold focus:border-blue-500 focus:ring-blue-500/10 transition-all text-sm"
                                            value={row.course_abbv}
                                            onChange={e => updateCourseRow(row._id, 'course_abbv', e.target.value)}
                                            maxLength={12}
                                        />
                                    </div>
                                    <Input
                                        placeholder="e.g. BS in Computer Science"
                                        className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/10 transition-all text-sm"
                                        value={row.course_name}
                                        onChange={e => updateCourseRow(row._id, 'course_name', e.target.value)}
                                    />
                                    <select
                                        className="h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                                        value={row.college_dept_abbv}
                                        onChange={e => updateCourseRow(row._id, 'college_dept_abbv', e.target.value)}
                                    >
                                        <option value="">Pick dept...</option>
                                        {departments.map(d => (
                                            <option key={d.college_dept_id} value={d.college_dept_abbv}>
                                                {d.college_dept_abbv} — {d.college_dept_name}
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        placeholder="Optional description..."
                                        className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-gray-400 transition-all text-sm text-gray-500"
                                        value={row.course_desc}
                                        onChange={e => updateCourseRow(row._id, 'course_desc', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCourseRow(row._id)}
                                        disabled={courseRows.length === 1}
                                        className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                        title="Remove row"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addCourseRow}
                                className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <span className="text-lg leading-none">+</span>
                                Add Another Row
                            </button>
                        </div>
                    )}

                    {/* Summary badge */}
                    {canImport && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl bg-${accentColor}-50 border border-${accentColor}-100`}>
                            <span className={`h-2 w-2 rounded-full bg-${accentColor}-500`} />
                            <p className={`text-xs font-bold text-${accentColor}-700`}>
                                {type === 'department'
                                    ? `${deptRows.filter(r => r.college_dept_abbv.trim() && r.college_dept_name.trim()).length} department(s) ready to import`
                                    : `${courseRows.filter(r => r.course_abbv.trim() && r.course_name.trim() && r.college_dept_abbv).length} course(s) ready to import`}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50/30 shrink-0">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold">
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={isSaving || !canImport}
                        onClick={handleImport}
                        className={`bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-${accentColor}-600/20`}
                    >
                        {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                        {isSaving ? "Importing..." : `Import ${type === 'department'
                            ? deptRows.filter(r => r.college_dept_abbv.trim() && r.college_dept_name.trim()).length
                            : courseRows.filter(r => r.course_abbv.trim() && r.course_name.trim() && r.college_dept_abbv).length} Records`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
