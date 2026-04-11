"use client";

import UserManagement from "./_components/UserManagement";
import PageHeader from "@/components/dashboard/PageHeader";

export default function AdminUsersPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <PageHeader
                title="User Management"
                description="Create, manage, and control user accounts across the platform. Assign roles and maintain access standards for all users."
                currentPage="User Management"
                dashboardHref="/dashboard/admin"
                dashboardName="Admin Dashboard"
            />

            {/* Main Content */}
            <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                <UserManagement />
            </div>
        </div>
    );
}
