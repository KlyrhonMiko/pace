"use client";

import {
    Plus,
    Search,
    Edit2,
    UserX,
    UserCheck,
    X,
    Check,
    Loader2,
    Eye,
    EyeOff,
    RefreshCw,
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
import { useUserManagement } from "./useUserManagement";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function labelFor(userType: string): string {
    if (userType === "USER") return "Alumni";
    if (userType === "STAFF") return "Faculty";
    if (userType === "ADMIN") return "Admin";
    return userType;
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function UserTypeBadge({ type }: { type: string }) {
    const config: Record<string, { bg: string; text: string; border: string }> = {
        ADMIN: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200/60" },
        STAFF: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/60" },
        USER: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60" },
    };
    const c = config[type] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200/60" };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
            {labelFor(type)}
        </span>
    );
}

function StatusBadge({ isDeleted }: { isDeleted: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${!isDeleted
            ? "bg-green-50 text-green-700 border-green-200/60"
            : "bg-red-50 text-red-600 border-red-200/60"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${!isDeleted ? "bg-green-500" : "bg-red-400"}`} />
            {!isDeleted ? "Active" : "Inactive"}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserManagement() {
    const {
        users,
        total,
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
        pageSize,

        setIsModalOpen,
        setFormData,
        setFilterType,
        setFilterStatus,
        setUserToDeactivate,
        setCurrentPage,
        handleSearch,
        openCreateModal,
        openEditModal,
        handleSave,
        handleClearForm,
        handleDeactivateClick,
        confirmDeactivate,
        refetch,
    } = useUserManagement();

    const [showPassword, setShowPassword] = useState(false);
    const [depts, setDepts] = useState<{ college_dept_code: string; college_dept_name: string }[]>([]);

    useEffect(() => {
        apiFetch<any>("/college-depts/?limit=0").then((res) => {
            if (res.success && res.data?.college_depts) {
                setDepts(res.data.college_depts);
            }
        }).catch(() => { });
    }, []);

    const totalPages = Math.ceil(total / pageSize);
    const isStaffOrAdmin = formData.user_type === "STAFF" || formData.user_type === "ADMIN";

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by username or email..."
                            className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-11 w-full sm:w-36 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium text-sm">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="STAFF">Faculty</SelectItem>
                            <SelectItem value="USER">Alumni</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-11 w-full sm:w-36 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium text-sm">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={refetch}
                        className="h-11 w-11 rounded-xl border-slate-200"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                    >
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                        Create New User
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading users...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, idx) => (
                                    <tr key={user.user_id || `user-${idx}`} className={`hover:bg-slate-50/80 transition-colors group ${user.is_deleted ? "opacity-60" : ""}`}>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {user.user_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">
                                                    {user.last_name && user.first_name
                                                        ? `${user.last_name}, ${user.first_name}${user.middle_name ? ` ${user.middle_name[0]}.` : ""}`
                                                        : <span className="text-slate-400 italic font-normal">No profile</span>
                                                    }
                                                </h4>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{user.email}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-700">{user.username}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <UserTypeBadge type={user.user_type} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge isDeleted={user.is_deleted} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(user)}
                                                    disabled={user.is_deleted}
                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"
                                                    title="Edit user"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeactivateClick(user.user_id)}
                                                    className={
                                                        !user.is_deleted
                                                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                                    }
                                                    title={!user.is_deleted ? "Deactivate user" : "Restore user"}
                                                >
                                                    {!user.is_deleted ? (
                                                        <UserX className="h-4 w-4" />
                                                    ) : (
                                                        <UserCheck className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">
                            Page {currentPage + 1} of {totalPages} · {total} users total
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}
                                disabled={currentPage === 0}
                                className="h-9 rounded-lg border-slate-200"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages - 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="h-9 rounded-lg border-slate-200"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-8 text-white relative">
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                {editingUser ? "Edit User" : "Create New User"}
                            </h2>
                            <p className="text-emerald-100/80 text-sm mt-1">
                                {editingUser
                                    ? `Modifying: ${editingUser.user_id}`
                                    : "Fill in the details to create a new staff or admin account."}
                            </p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Last Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Last Name*</label>
                                    <Input
                                        placeholder="e.g. Garcia"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        disabled={!!editingUser}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium disabled:bg-slate-50"
                                    />
                                </div>

                                {/* First Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">First Name*</label>
                                    <Input
                                        placeholder="e.g. Maria"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        disabled={!!editingUser}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium disabled:bg-slate-50"
                                    />
                                </div>

                                {/* Middle Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Middle Name</label>
                                    <Input
                                        placeholder="e.g. Santos"
                                        value={formData.middle_name}
                                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                        disabled={!!editingUser}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium disabled:bg-slate-50"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email*</label>
                                    <Input
                                        type="email"
                                        placeholder="e.g. m.garcia@plp.edu.ph"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Username*</label>
                                    <Input
                                        placeholder="e.g. m.garcia"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                                        Password{!editingUser && "*"}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder={editingUser ? "Leave blank to keep current" : "Min 8 chars, uppercase, number"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* User Type — only for create */}
                                {!editingUser && (
                                    <div key="role-field-segment" className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">System Role*</label>
                                        <Select
                                            value={formData.user_type}
                                            onValueChange={(v) => setFormData({ ...formData, user_type: v as "USER" | "STAFF" | "ADMIN" })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                                <SelectItem value="STAFF">Faculty Member</SelectItem>
                                                <SelectItem value="ADMIN">System Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-400 ml-1">
                                            Alumni accounts are registered through the public portal.
                                        </p>
                                    </div>
                                )}

                                {/* Gender — only for create, staff/admin */}
                                {!editingUser && isStaffOrAdmin && (
                                    <div key="gender-field-segment" className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Gender*</label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
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
                                )}

                                {/* Department — only for create, staff/admin */}
                                {!editingUser && isStaffOrAdmin && (
                                    <div key="dept-field-segment" className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Department</label>
                                        <Select
                                            value={formData.college_dept_code}
                                            onValueChange={(v) => setFormData({ ...formData, college_dept_code: v })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium">
                                                <SelectValue placeholder="Select department (optional)" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                                {depts.map((d, idx) => (
                                                    <SelectItem key={d.college_dept_code || `dept-${idx}`} value={d.college_dept_code}>
                                                        {d.college_dept_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {editingUser && (
                                <p className="mt-4 text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                    <strong>Note:</strong> Only auth credentials (username, email, password) can be updated here. Profile information is managed via the respective Alumni and Staff records.
                                </p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={handleClearForm}
                                className="h-11 px-6 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-all"
                                disabled={isSaving}
                            >
                                {editingUser ? "Reset" : "Clear"}
                            </Button>
                            <div className="flex items-center gap-3">
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
                                    {editingUser ? "Update User" : "Create User"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={userToDeactivate !== null}
                onClose={() => setUserToDeactivate(null)}
                onConfirm={confirmDeactivate}
                title={(() => {
                    const targetUser = users.find((u) => u.user_id === userToDeactivate);
                    return !targetUser?.is_deleted ? "Deactivate User?" : "Restore User?";
                })()}
                description={(() => {
                    const targetUser = users.find((u) => u.user_id === userToDeactivate);
                    const isActive = !targetUser?.is_deleted;
                    return isActive
                        ? `Are you sure you want to deactivate ${targetUser?.username}? This user will no longer be able to access the platform. You can restore them later.`
                        : `Are you sure you want to restore ${targetUser?.username}? This user will regain access to the platform.`;
                })()}
                confirmText={(() => {
                    const targetUser = users.find((u) => u.user_id === userToDeactivate);
                    return !targetUser?.is_deleted ? "Deactivate" : "Restore";
                })()}
                variant={(() => {
                    const targetUser = users.find((u) => u.user_id === userToDeactivate);
                    return !targetUser?.is_deleted ? "danger" : "success";
                })()}
                isLoading={isDeactivating}
            />
        </div>
    );
}
