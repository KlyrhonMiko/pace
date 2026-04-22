"use client";

import { Shield, RefreshCw, Loader2, Edit2, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "./useUserManagement";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function labelFor(userType: string): string {
    if (userType === "USER") return "Alumni";
    if (userType === "STAFF") return "Faculty";
    if (userType === "ADMIN") return "Admin";
    if (userType === "EMPLOYER") return "Employer";
    return userType;
}

const getAvatarColor = (name: string) => {
    const colors = [
        "from-blue-100 to-blue-200 text-blue-700",
        "from-emerald-100 to-emerald-200 text-emerald-700",
        "from-violet-100 to-violet-200 text-violet-700",
        "from-amber-100 to-amber-200 text-amber-700",
        "from-pink-100 to-pink-200 text-pink-700",
        "from-indigo-100 to-indigo-200 text-indigo-700",
        "from-rose-100 to-rose-200 text-rose-700",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
};



interface UserListProps {
    users: User[];
    isLoading: boolean;
    total: number;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    openEditModal: (user: User) => void;
    handleDeactivateClick: (userId: string) => void;
    refetch: () => void;
}

export default function UserList({
    users,
    isLoading,
    total,
    currentPage,
    totalPages,
    setCurrentPage,
    openEditModal,
    handleDeactivateClick,
    refetch,
}: UserListProps) {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 flex flex-col h-full">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <Shield className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            User Directory
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage accounts across the platform ({total})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={refetch}
                        className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-white bg-slate-50 border-slate-200/80 transition-all rounded-xl shadow-sm hover:shadow"
                        disabled={isLoading}
                        title="Refresh data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading users...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-32 text-center bg-slate-50/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                            <Shield className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500">No users found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map((user, idx) => {
                                const fullName = user.last_name && user.first_name
                                    ? `${user.last_name}, ${user.first_name}${user.middle_name ? ` ${user.middle_name[0]}.` : ""}`
                                    : null;
                                const avatarColor = getAvatarColor(user.username + (fullName || ''));

                                return (
                                    <tr key={user.user_id || `user-${idx}`} className={`group transition-all duration-200 hover:bg-slate-50/50 ${user.is_deleted ? "opacity-60" : ""}`}>
                                        <td className="px-5 py-4 min-w-[180px]">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} font-bold text-sm shadow-sm ring-1 ring-black/5`}>
                                                    {fullName && user.first_name && user.last_name ? `${user.first_name[0]}${user.last_name[0]}` : user.username[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">
                                                        {fullName || <span className="text-slate-400 italic font-normal">No profile</span>}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                                        {user.user_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <span className="text-sm text-slate-600 truncate block max-w-[150px]" title={user.email}>{user.email}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-medium text-slate-700 truncate block max-w-[100px]" title={user.username}>{user.username}</span>
                                        </td>
                                        <td className="px-5 py-4 hidden sm:table-cell">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                {labelFor(user.user_type)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${!user.is_deleted ? "bg-green-500" : "bg-red-400"}`} />
                                                <span className={`text-xs font-bold uppercase tracking-wide ${!user.is_deleted ? "text-green-700" : "text-red-600"}`}>
                                                    {!user.is_deleted ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(user)}
                                                    disabled={user.is_deleted}
                                                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg hover:shadow-sm"
                                                    title="Edit user"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeactivateClick(user.user_id)}
                                                    className={`h-8 w-8 rounded-lg hover:shadow-sm ${!user.is_deleted
                                                        ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                                        }`}
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
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Area */}
            {totalPages > 1 && (
                <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">
                        Showing page <span className="text-slate-900">{currentPage + 1}</span> of <span className="text-slate-900">{totalPages}</span>
                        <span className="mx-2 opacity-30">•</span>
                        Total <span className="text-slate-900">{total}</span> accounts
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}
                            disabled={currentPage === 0}
                            className="h-9 px-4 rounded-xl border-slate-200 text-xs font-bold"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages - 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="h-9 px-4 rounded-xl border-slate-200 text-xs font-bold"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
