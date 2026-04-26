"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    user_id: string;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    email: string;
    username: string;
    user_type: "USER" | "STAFF" | "ADMIN" | "EMPLOYER";
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserFormData {
    last_name: string;
    first_name: string;
    middle_name: string;
    email: string;
    username: string;
    password: string;
    // For STAFF/ADMIN creation
    gender: string;
    college_dept_id: string;
    // For EMPLOYER creation
    company_name: string;
    contact_person_position: string;
    user_type: "USER" | "STAFF" | "ADMIN" | "EMPLOYER";
}

// ─── Default Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: UserFormData = {
    last_name: "",
    first_name: "",
    middle_name: "",
    email: "",
    username: "",
    password: "",
    gender: "",
    college_dept_id: "",
    company_name: "",
    contact_person_position: "",
    user_type: "STAFF",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserManagement() {
    // --- Data State ---
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // --- Pagination ---
    const [currentPage, setCurrentPage] = useState(0);

    // --- UI State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [isSaving, setIsSaving] = useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState<string | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);

    // --- Form State ---
    const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);

    // --- Fetch Users ---
    const fetchUsers = useCallback(async () => {
        if (users.length === 0) setIsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(currentPage * PAGE_SIZE),
                sort_by: "user_id",
                sort_order: "asc",
            });
            if (searchQuery) params.set("search", searchQuery);
            if (filterType !== "all") params.set("user_type", filterType.toUpperCase());
            if (filterStatus === "inactive") params.set("include_deleted", "true");

            const result = await apiFetch<any>(`/users?${params.toString()}`);
            if (result.success && result.data?.users) {
                let fetchedUsers: User[] = result.data.users;
                // Client-side filter for deleted status when not using include_deleted param
                if (filterStatus === "inactive") {
                    fetchedUsers = fetchedUsers.filter((u) => u.is_deleted);
                } else if (filterStatus === "active") {
                    fetchedUsers = fetchedUsers.filter((u) => !u.is_deleted);
                }
                setUsers(fetchedUsers);
                setTotal(result.data.pagination?.total ?? fetchedUsers.length);
            }
        } catch (error) {
            toast.error("Failed to load users.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery, filterType, filterStatus]);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCurrentPage(0);
    }, []);

    const handleFilterType = useCallback((t: string) => {
        setFilterType(t);
        setCurrentPage(0);
    }, []);

    const handleFilterStatus = useCallback((s: string) => {
        setFilterStatus(s);
        setCurrentPage(0);
    }, []);

    // --- Modal Handlers ---
    const openCreateModal = useCallback(() => {
        setEditingUser(null);
        setFormData(EMPTY_FORM);
        setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback((user: User) => {
        setEditingUser(user);
        setFormData({
            last_name: user.last_name ?? "",
            first_name: user.first_name ?? "",
            middle_name: user.middle_name ?? "",
            email: user.email,
            username: user.username,
            password: "",
            gender: "",
            college_dept_id: "",
            company_name: "",
            contact_person_position: "",
            user_type: user.user_type,
        });
        setIsModalOpen(true);
    }, []);

    // --- Save (Create or Update) ---
    const handleSave = async () => {
        if (!formData.first_name.trim()) { toast.error("First name is required."); return; }
        if (!formData.last_name.trim()) { toast.error("Last name is required."); return; }
        if (!formData.email.trim()) { toast.error("Email is required."); return; }
        if (!formData.email.includes("@")) { toast.error("Please enter a valid email address."); return; }
        if (!formData.username.trim()) { toast.error("Username is required."); return; }
        if (!editingUser && !formData.password.trim()) { toast.error("Password is required for new users."); return; }
        if (!editingUser && formData.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
        if (!editingUser && (formData.user_type === "STAFF" || formData.user_type === "ADMIN")) {
            if (!formData.gender) { toast.error("Gender is required for staff/admin."); return; }
        }
        if (!editingUser && formData.user_type === "EMPLOYER") {
            if (!formData.company_name.trim()) { toast.error("Company name is required."); return; }
        }

        setIsSaving(true);
        try {
            if (editingUser) {
                // Update auth fields only via PATCH /users/{id}
                const payload: Record<string, string> = {
                    username: formData.username,
                    email: formData.email,
                };
                if (formData.password) {
                    payload.password = formData.password;
                    // Admin updating another user — no current_password needed at schema level
                    // We omit current_password to rely on admin RBAC bypass
                }
                const result = await apiFetch<any>(`/users/${editingUser.user_id}`, {
                    method: "PATCH",
                    body: payload,
                });
                if (result.success) {
                    toast.success("User updated successfully.");
                    setIsModalOpen(false);
                    fetchUsers();
                } else {
                    toast.error(result.message || "Update failed.");
                }
            } else {
                // Create via profile-specific endpoints
                let endpoint = "/staff/register";
                let body: any = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    user_type: formData.user_type,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    middle_name: formData.middle_name || null,
                };

                if (formData.user_type === "EMPLOYER") {
                    endpoint = "/employers/register";
                    body = {
                        username: formData.username,
                        email: formData.email,
                        password: formData.password,
                        company_name: formData.company_name,
                        contact_person_first_name: formData.first_name,
                        contact_person_last_name: formData.last_name,
                        contact_person_position: formData.contact_person_position || null,
                    };
                } else {
                    // STAFF or ADMIN
                    body.gender = formData.gender || "PREFER_NOT_TO_SAY";
                    body.college_dept_id = formData.college_dept_id || null;
                }

                const result = await apiFetch<any>(endpoint, {
                    method: "POST",
                    body,
                });
                if (result.success) {
                    toast.success("User created successfully.");
                    setIsModalOpen(false);
                    fetchUsers();
                } else {
                    toast.error(result.message || "Creation failed.");
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearForm = useCallback(() => {
        if (editingUser) {
            setFormData({
                last_name: editingUser.last_name ?? "",
                first_name: editingUser.first_name ?? "",
                middle_name: editingUser.middle_name ?? "",
                email: editingUser.email,
                username: editingUser.username,
                password: "",
                gender: "",
                college_dept_id: "",
                company_name: "",
                contact_person_position: "",
                user_type: editingUser.user_type,
            });
        } else {
            setFormData(EMPTY_FORM);
        }
    }, [editingUser]);

    const handleDeactivateClick = useCallback((userId: string) => {
        setUserToDeactivate(userId);
    }, []);

    const confirmDeactivate = useCallback(async () => {
        if (!userToDeactivate) return;
        const targetUser = users.find((u) => u.user_id === userToDeactivate);
        setIsDeactivating(true);
        try {
            if (targetUser?.is_deleted) {
                // Restore
                const result = await apiFetch<any>(`/users/${userToDeactivate}/restore`, {
                    method: "POST",
                });
                if (result.success) {
                    toast.success("User restored successfully.");
                } else {
                    toast.error(result.message || "Restore failed.");
                }
            } else {
                // Soft deactivate via admin endpoint (no password required)
                const result = await apiFetch<any>(`/users/${userToDeactivate}/deactivate`, {
                    method: "POST",
                });
                if (result.success) {
                    toast.success("User deactivated successfully.");
                } else {
                    toast.error(result.message || "Deactivation failed.");
                }
            }
            fetchUsers();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Operation failed.");
        } finally {
            setIsDeactivating(false);
            setUserToDeactivate(null);
        }
    }, [userToDeactivate, users, fetchUsers]);

    // computed
    const totalUsers = total;
    const activeUsers = users.filter((u) => !u.is_deleted).length;

    return useMemo(() => ({
        users,
        total,
        totalUsers,
        activeUsers,
        isLoading,
        isModalOpen,
        editingUser,
        searchQuery,
        filterType,
        filterStatus,
        isSaving,
        isDeactivating,
        userToDeactivate,
        formData,
        currentPage,
        pageSize: PAGE_SIZE,

        setIsModalOpen,
        setFormData,
        setFilterType: handleFilterType,
        setFilterStatus: handleFilterStatus,
        setUserToDeactivate,
        setCurrentPage,
        handleSearch,
        openCreateModal,
        openEditModal,
        handleSave,
        handleClearForm,
        handleDeactivateClick,
        confirmDeactivate,
        refetch: fetchUsers,
    }), [
        users, total, totalUsers, activeUsers, isLoading, isModalOpen, editingUser,
        searchQuery, filterType, filterStatus, isSaving, isDeactivating,
        userToDeactivate, formData, currentPage, handleFilterType, handleFilterStatus,
        handleSearch, openCreateModal, openEditModal, handleSave, handleClearForm,
        handleDeactivateClick, confirmDeactivate, fetchUsers
    ]);
}
