"use client";

import {
    Plus,
    X,
    Check,
    Loader2,
    Eye,
    EyeOff,
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
import UserList from "./UserList";
import UserFilters from "./UserFilters";
import ActionsCard from "../../../_components/ActionsCard";

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
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: User List */}
            <div className="lg:col-span-2">
                <UserList
                    users={users}
                    isLoading={isLoading}
                    total={total}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                    openEditModal={openEditModal}
                    handleDeactivateClick={handleDeactivateClick}
                    refetch={refetch}
                />
            </div>

            {/* Right Column: Filters and Actions */}
            <div className="lg:col-span-1 space-y-6">
                <div className="flex flex-col gap-4 sticky top-24">
                    <ActionsCard
                        title="Creation Hub"
                        description="Provision news accounts"
                        icon={<Plus className="h-5 w-5" />}
                        actions={[
                            {
                                label: "Create New User",
                                onClick: openCreateModal,
                                icon: <Plus className="h-4 w-4 stroke-2" />,
                                variant: "primary"
                            }
                        ]}
                    />

                    <UserFilters
                        searchQuery={searchQuery}
                        handleSearch={handleSearch}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-8 text-white relative">
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                {editingUser ? "Edit User Account" : "Create New User"}
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
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
                    return !targetUser?.is_deleted ? "Deactivate User Account?" : "Restore User Account?";
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
                    return !targetUser?.is_deleted ? "Deactivate Account" : "Restore Account";
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
