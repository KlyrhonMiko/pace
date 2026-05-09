import { useState, useEffect, useCallback } from "react";
import { 
    getDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment, 
    restoreDepartment,
    batchCreateDepartments,
    batchDeleteDepartments,
    batchRestoreDepartments,
    CollegeDeptPublic,
    CollegeDeptCreate,
    CollegeDeptUpdate
} from "../academic";
import { toast } from "sonner";

export function useDepartments() {
    const [departments, setDepartments] = useState<CollegeDeptPublic[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [showDeleted, setShowDeleted] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState("college_dept_id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<CollegeDeptPublic | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'restore' | 'batchDelete' | 'batchRestore', id?: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchDepartments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getDepartments({
                limit: pageSize,
                offset: currentPage * pageSize,
                search: searchQuery,
                include_deleted: showDeleted,
                sort_by: sortBy,
                sort_order: sortOrder
            });
            if (res.success) {
                setDepartments(res.data.college_depts);
                setTotal(res.data.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch departments:", error);
            toast.error("Failed to load departments");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchQuery, showDeleted, sortBy, sortOrder]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(0);
    };

    const handleCreate = async (data: CollegeDeptCreate) => {
        setIsSaving(true);
        try {
            const res = await createDepartment(data);
            if (res.success) {
                toast.success("Department created successfully");
                setIsModalOpen(false);
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create department");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: CollegeDeptUpdate) => {
        setIsSaving(true);
        try {
            const res = await updateDepartment(id, data);
            if (res.success) {
                toast.success("Department updated successfully");
                setIsModalOpen(false);
                setEditingDept(null);
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update department");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteDepartment(id);
            if (res.success) {
                toast.success("Department deleted successfully");
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete department");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const res = await restoreDepartment(id);
            if (res.success) {
                toast.success("Department restored successfully");
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to restore department");
        }
    };

    const handleBatchDelete = async (ids: string[]) => {
        try {
            const res = await batchDeleteDepartments(ids);
            if (res.success) {
                toast.success(`Successfully deleted ${ids.length} departments`);
                setSelectedIds([]);
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.message || "Batch delete failed");
        }
    };

    const handleBatchRestore = async (ids: string[]) => {
        try {
            const res = await batchRestoreDepartments(ids);
            if (res.success) {
                toast.success(`Successfully restored ${ids.length} departments`);
                setSelectedIds([]);
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.message || "Batch restore failed");
        }
    };

    const handleBatchCreate = async (items: CollegeDeptCreate[]) => {
        setIsSaving(true);
        try {
            const res = await batchCreateDepartments(items);
            if (res.success) {
                toast.success(`Successfully imported ${items.length} departments`);
                fetchDepartments();
                return true;
            }
        } catch (error: any) {
            toast.error(error.message || "Batch creation failed");
        } finally {
            setIsSaving(false);
        }
        return false;
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === departments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(departments.map(d => d.college_dept_id));
        }
    };

    return {
        departments,
        total,
        isLoading,
        isSaving,
        searchQuery,
        showDeleted,
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        isModalOpen,
        editingDept,
        isConfirmModalOpen,
        confirmAction,
        selectedIds,

        setSearchQuery,
        setShowDeleted,
        setCurrentPage,
        setPageSize,
        setSortBy,
        setSortOrder,
        setIsModalOpen,
        setEditingDept,
        setIsConfirmModalOpen,
        setConfirmAction,
        setSelectedIds,
        
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
        refetch: fetchDepartments
    };
}
