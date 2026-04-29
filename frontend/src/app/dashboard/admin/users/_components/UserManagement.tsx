"use client";

import {
    Plus,
    Loader2,
    Eye,
    EyeOff,
    UserCog,
    UserPlus,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    const [depts, setDepts] = useState<{ college_dept_id: string; college_dept_name: string }[]>([]);

    useEffect(() => {
        apiFetch<any>("/college-depts/?limit=0").then((res) => {
            if (res.success && res.data?.college_depts) {
                setDepts(res.data.college_depts);
            }
        }).catch(() => { });
    }, []);

    const totalPages = Math.ceil(total / pageSize);
    const isStaffOrAdmin = formData.user_type === "STAFF" || formData.user_type === "ADMIN";
    const isEmployer = formData.user_type === "EMPLOYER";

    return (
        <>
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
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    showCloseButton={!isSaving}
                    className="sm:max-w-lg p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl"
                >
                    {/* Header — mirrors card headers (icon badge + title) */}
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                                {editingUser
                                    ? <UserCog className="h-5 w-5" />
                                    : <UserPlus className="h-5 w-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900">
                                    {editingUser ? "Edit User Account" : "Create New User"}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                    {editingUser
                                        ? `Modifying credentials for ${editingUser.user_id}`
                                        : "Fill in the details to create a new staff or admin account."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Body */}
                    <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
                        {editingUser && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-500">
                                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                </svg>
                                Only auth credentials can be updated here. Profile details are managed via the respective Alumni / Staff records.
                            </div>
                        )}

                        {/* 1. Account Role — create only */}
                        {!editingUser && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Role Selection</h3>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">System Role*</label>
                                    <Select
                                        value={formData.user_type}
                                        onValueChange={(v) => setFormData({ ...formData, user_type: v as "USER" | "STAFF" | "ADMIN" | "EMPLOYER" })}
                                    >
                                        <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                            <SelectItem value="STAFF">Faculty Member</SelectItem>
                                            <SelectItem value="ADMIN">System Administrator</SelectItem>
                                            <SelectItem value="EMPLOYER">Employer / Partner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-slate-400">
                                        Alumni accounts are registered through the public portal.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 2. Personal Information — create only */}
                        {!editingUser && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    {isEmployer ? "Contact Person Details" : "Personal Information"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            {isEmployer ? "Last Name (Contact)*" : "Last Name*"}
                                        </label>
                                        <Input
                                            placeholder="e.g. Garcia"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            {isEmployer ? "First Name (Contact)*" : "First Name*"}
                                        </label>
                                        <Input
                                            placeholder="e.g. Maria"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700">Middle Name</label>
                                        <Input
                                            placeholder="e.g. Santos"
                                            value={formData.middle_name}
                                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                            className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Credentials */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                {editingUser ? "Credentials" : "Account Credentials"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Email*</label>
                                    <Input
                                        type="text"
                                        inputMode="email"
                                        name="user-management-email"
                                        autoComplete="off"
                                        placeholder="e.g. m.garcia@plp.edu.ph"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        onFocus={(e) => {
                                            const t = e.target;
                                            setTimeout(() => t.setSelectionRange(t.value.length, t.value.length), 0);
                                        }}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Username*</label>
                                    <Input
                                        name="user-management-username"
                                        autoComplete="off"
                                        placeholder="e.g. m.garcia"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        onFocus={(e) => {
                                            const t = e.target;
                                            setTimeout(() => t.setSelectionRange(t.value.length, t.value.length), 0);
                                        }}
                                        className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Password{!editingUser && "*"}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            name="user-management-password"
                                            autoComplete="new-password"
                                            placeholder={editingUser ? "Leave blank to keep current" : "Min 8 chars, uppercase, number"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20 pr-11"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Role-Specific Assignment — create only */}
                        {!editingUser && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Assignment Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {isStaffOrAdmin && (
                                        <>
                                            <div key="gender-field-segment" className="md:col-span-2 space-y-1.5">
                                                <label className="text-sm font-medium text-slate-700">Gender*</label>
                                                <Select
                                                    value={formData.gender}
                                                    onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                                >
                                                    <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
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
                                            <div key="dept-field-segment" className="md:col-span-3 space-y-1.5">
                                                <label className="text-sm font-medium text-slate-700">Department</label>
                                                <Select
                                                    value={formData.college_dept_id}
                                                    onValueChange={(v) => setFormData({ ...formData, college_dept_id: v })}
                                                >
                                                    <SelectTrigger className="w-full !h-11 bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-700/20">
                                                        <SelectValue placeholder="Select department (optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200 z-[110]">
                                                        {depts.map((d, idx) => (
                                                            <SelectItem key={d.college_dept_id || `dept-${idx}`} value={d.college_dept_id}>
                                                                {d.college_dept_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}

                                    {isEmployer && (
                                        <>
                                            <div key="company-field-segment" className="md:col-span-5 space-y-1.5">
                                                <label className="text-sm font-medium text-slate-700">Company Name*</label>
                                                <Input
                                                    placeholder="e.g. Acme Corp"
                                                    value={formData.company_name}
                                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                                />
                                            </div>
                                            <div key="position-field-segment" className="md:col-span-5 space-y-1.5">
                                                <label className="text-sm font-medium text-slate-700">Contact Position</label>
                                                <Input
                                                    placeholder="e.g. Hiring Manager"
                                                    value={formData.contact_person_position}
                                                    onChange={(e) => setFormData({ ...formData, contact_person_position: e.target.value })}
                                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <button
                            onClick={handleClearForm}
                            disabled={isSaving}
                            className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                            {editingUser ? "Reset" : "Clear"}
                        </button>
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editingUser ? "Save Changes" : "Create User"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                isOpen={userToDeactivate !== null}
                onClose={() => setUserToDeactivate(null)}
                onConfirm={confirmDeactivate}
                title={(() => {
                    const targetUser = users.find((u: any) => u.user_id === userToDeactivate);
                    return !targetUser?.is_deleted ? "Deactivate User Account?" : "Restore User Account?";
                })()}
                description={(() => {
                    const targetUser = users.find((u: any) => u.user_id === userToDeactivate);
                    const isActive = !targetUser?.is_deleted;
                    return isActive
                        ? `Are you sure you want to deactivate ${targetUser?.username}? This user will no longer be able to access the platform. You can restore them later.`
                        : `Are you sure you want to restore ${targetUser?.username}? This user will regain access to the platform.`;
                })()}
                confirmText={(() => {
                    const targetUser = users.find((u: any) => u.user_id === userToDeactivate);
                    return !targetUser?.is_deleted ? "Deactivate Account" : "Restore Account";
                })()}
                variant={(() => {
                    const targetUser = users.find((u: any) => u.user_id === userToDeactivate);
                    return !targetUser?.is_deleted ? "danger" : "success";
                })()}
                isLoading={isDeactivating}
            />
        </>
    );
}
