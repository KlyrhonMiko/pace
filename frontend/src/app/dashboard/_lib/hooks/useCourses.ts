import { useState, useEffect, useCallback } from "react";
import { 
    getCourses, 
    createCourse, 
    updateCourse, 
    deleteCourse, 
    restoreCourse,
    batchCreateCourses,
    batchDeleteCourses,
    batchRestoreCourses,
    CoursePublic,
    CourseCreate,
    CourseUpdate
} from "../academic";
import { toast } from "sonner";

export function useCourses() {
    const [courses, setCourses] = useState<CoursePublic[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [showDeleted, setShowDeleted] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState("course_id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CoursePublic | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'restore' | 'batchDelete' | 'batchRestore', id?: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getCourses({
                limit: pageSize,
                offset: currentPage * pageSize,
                search: searchQuery,
                college_dept_abbv: filterDept === "all" ? "" : filterDept,
                include_deleted: showDeleted,
                sort_by: sortBy,
                sort_order: sortOrder
            });
            if (res.success) {
                setCourses(res.data.courses);
                setTotal(res.data.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            toast.error("Failed to load courses");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchQuery, filterDept, showDeleted, sortBy, sortOrder]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(0);
    };

    const handleCreate = async (data: CourseCreate) => {
        setIsSaving(true);
        try {
            const res = await createCourse(data);
            if (res.success) {
                toast.success("Course created successfully");
                setIsModalOpen(false);
                fetchCourses();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create course");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: CourseUpdate) => {
        setIsSaving(true);
        try {
            const res = await updateCourse(id, data);
            if (res.success) {
                toast.success("Course updated successfully");
                setIsModalOpen(false);
                setEditingCourse(null);
                fetchCourses();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update course");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteCourse(id);
            if (res.success) {
                toast.success("Course deleted successfully");
                fetchCourses();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete course");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const res = await restoreCourse(id);
            if (res.success) {
                toast.success("Course restored successfully");
                fetchCourses();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to restore course");
        }
    };

    const handleBatchDelete = async (ids: string[]) => {
        try {
            const res = await batchDeleteCourses(ids);
            if (res.success) {
                toast.success(`Successfully deleted ${ids.length} courses`);
                setSelectedIds([]);
                fetchCourses();
            }
        } catch (error: any) {
            toast.error(error.message || "Batch delete failed");
        }
    };

    const handleBatchRestore = async (ids: string[]) => {
        try {
            const res = await batchRestoreCourses(ids);
            if (res.success) {
                toast.success(`Successfully restored ${ids.length} courses`);
                setSelectedIds([]);
                fetchCourses();
            }
        } catch (error: any) {
            toast.error(error.message || "Batch restore failed");
        }
    };

    const handleBatchCreate = async (items: CourseCreate[]) => {
        setIsSaving(true);
        try {
            const res = await batchCreateCourses(items);
            if (res.success) {
                toast.success(`Successfully imported ${items.length} courses`);
                fetchCourses();
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
        if (selectedIds.length === courses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(courses.map(c => c.course_id));
        }
    };

    return {
        courses,
        total,
        isLoading,
        isSaving,
        searchQuery,
        filterDept,
        showDeleted,
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        isModalOpen,
        editingCourse,
        isConfirmModalOpen,
        confirmAction,
        selectedIds,

        setSearchQuery,
        setFilterDept,
        setShowDeleted,
        setCurrentPage,
        setPageSize,
        setSortBy,
        setSortOrder,
        setIsModalOpen,
        setEditingCourse,
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
        refetch: fetchCourses
    };
}
