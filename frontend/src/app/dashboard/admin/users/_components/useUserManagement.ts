"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    user_id: string;
    last_name: string;
    first_name: string;
    middle_name: string;
    email: string;
    username: string;
    password: string;
    user_type: "admin" | "faculty" | "alumni";
    status: "active" | "inactive";
}

export interface UserFormData {
    last_name: string;
    first_name: string;
    middle_name: string;
    email: string;
    username: string;
    password: string;
    user_type: "admin" | "faculty" | "alumni";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
    {
        user_id: "USR-001",
        last_name: "Reyes",
        first_name: "Maria",
        middle_name: "Santos",
        email: "maria.reyes@plp.edu.ph",
        username: "m.reyes",
        password: "••••••••",
        user_type: "admin",
        status: "active",
    },
    {
        user_id: "USR-002",
        last_name: "Garcia",
        first_name: "Paolo",
        middle_name: "Lim",
        email: "paolo.garcia@plp.edu.ph",
        username: "p.garcia",
        password: "••••••••",
        user_type: "faculty",
        status: "active",
    },
    {
        user_id: "USR-003",
        last_name: "Dela Cruz",
        first_name: "Juan",
        middle_name: "Mendoza",
        email: "juan.delacruz@gmail.com",
        username: "j.delacruz",
        password: "••••••••",
        user_type: "alumni",
        status: "active",
    },
    {
        user_id: "USR-004",
        last_name: "Santos",
        first_name: "Ana",
        middle_name: "Flores",
        email: "ana.santos@plp.edu.ph",
        username: "a.santos",
        password: "••••••••",
        user_type: "faculty",
        status: "inactive",
    },
    {
        user_id: "USR-005",
        last_name: "Villanueva",
        first_name: "Carlos",
        middle_name: "",
        email: "carlos.v@gmail.com",
        username: "c.villanueva",
        password: "••••••••",
        user_type: "alumni",
        status: "active",
    },
    {
        user_id: "USR-006",
        last_name: "Bautista",
        first_name: "Sofia",
        middle_name: "Tan",
        email: "sofia.bautista@plp.edu.ph",
        username: "s.bautista",
        password: "••••••••",
        user_type: "admin",
        status: "active",
    },
    {
        user_id: "USR-007",
        last_name: "Ramos",
        first_name: "Miguel",
        middle_name: "Cruz",
        email: "miguel.ramos@gmail.com",
        username: "m.ramos",
        password: "••••••••",
        user_type: "alumni",
        status: "inactive",
    },
    {
        user_id: "USR-008",
        last_name: "Torres",
        first_name: "Isabella",
        middle_name: "Navarro",
        email: "isabella.torres@plp.edu.ph",
        username: "i.torres",
        password: "••••••••",
        user_type: "faculty",
        status: "active",
    },
];

// ─── Default Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: UserFormData = {
    last_name: "",
    first_name: "",
    middle_name: "",
    email: "",
    username: "",
    password: "",
    user_type: "alumni",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserManagement() {
    // --- Data State ---
    const [users, setUsers] = useState<User[]>(MOCK_USERS);

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

    // --- Handlers ---
    const handleSearch = (query: string) => setSearchQuery(query);

    const openCreateModal = useCallback(() => {
        setEditingUser(null);
        setFormData(EMPTY_FORM);
        setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback((user: User) => {
        setEditingUser(user);
        setFormData({
            last_name: user.last_name,
            first_name: user.first_name,
            middle_name: user.middle_name,
            email: user.email,
            username: user.username,
            password: "",
            user_type: user.user_type,
        });
        setIsModalOpen(true);
    }, []);

    const handleSave = async () => {
        // Validation
        if (!formData.first_name.trim()) { toast.error("First name is required."); return; }
        if (!formData.last_name.trim()) { toast.error("Last name is required."); return; }
        if (!formData.email.trim()) { toast.error("Email is required."); return; }
        if (!formData.email.includes("@")) { toast.error("Please enter a valid email address."); return; }
        if (!formData.username.trim()) { toast.error("Username is required."); return; }
        if (!editingUser && !formData.password.trim()) { toast.error("Password is required for new users."); return; }
        if (!editingUser && formData.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }

        setIsSaving(true);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (editingUser) {
            // Update existing user
            setUsers((prev) =>
                prev.map((u) =>
                    u.user_id === editingUser.user_id
                        ? {
                              ...u,
                              ...formData,
                              password: formData.password || u.password,
                          }
                        : u
                )
            );
            toast.success("User updated successfully.");
        } else {
            // Create new user
            const newUser: User = {
                user_id: `USR-${String(users.length + 1).padStart(3, "0")}`,
                ...formData,
                password: "••••••••",
                status: "active",
            };
            setUsers((prev) => [newUser, ...prev]);
            toast.success("User created successfully.");
        }

        setIsSaving(false);
        setIsModalOpen(false);
    };

    const handleClearForm = () => {
        if (editingUser) {
            setFormData({
                last_name: editingUser.last_name,
                first_name: editingUser.first_name,
                middle_name: editingUser.middle_name,
                email: editingUser.email,
                username: editingUser.username,
                password: "",
                user_type: editingUser.user_type,
            });
        } else {
            setFormData(EMPTY_FORM);
        }
    };

    const handleDeactivateClick = (userId: string) => {
        setUserToDeactivate(userId);
    };

    const confirmDeactivate = async () => {
        if (!userToDeactivate) return;
        setIsDeactivating(true);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        setUsers((prev) =>
            prev.map((u) =>
                u.user_id === userToDeactivate
                    ? { ...u, status: u.status === "active" ? "inactive" as const : "active" as const }
                    : u
            )
        );

        const targetUser = users.find((u) => u.user_id === userToDeactivate);
        const newStatus = targetUser?.status === "active" ? "deactivated" : "activated";
        toast.success(`User ${newStatus} successfully.`);

        setIsDeactivating(false);
        setUserToDeactivate(null);
    };

    // --- Filtering ---
    const filteredUsers = users.filter((u) => {
        const fullName = `${u.last_name} ${u.first_name} ${u.middle_name}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.user_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || u.user_type === filterType;
        const matchesStatus = filterStatus === "all" || u.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    // --- Computed ---
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;

    return {
        // State
        users: filteredUsers,
        totalUsers,
        activeUsers,
        isModalOpen,
        editingUser,
        searchQuery,
        filterType,
        filterStatus,
        isSaving,
        isDeactivating,
        userToDeactivate,
        formData,

        // Handlers
        setIsModalOpen,
        setFormData,
        setFilterType,
        setFilterStatus,
        setUserToDeactivate,
        handleSearch,
        openCreateModal,
        openEditModal,
        handleSave,
        handleClearForm,
        handleDeactivateClick,
        confirmDeactivate,
    };
}
