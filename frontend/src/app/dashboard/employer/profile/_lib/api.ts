import { apiFetch } from "@/lib/api-client";

export interface EmployerProfile {
    id: string;
    user_id: string;
    username: string;
    email: string;
    company_name: string;
    contact_person_first_name: string;
    contact_person_last_name: string;
    contact_person_position: string | null;
    company_website: string | null;
    company_address: string | null;
    company_contact_number: string | null;
    company_logo_url: string | null;
}

/**
 * Fetch the current authenticated employer's full profile.
 */
export async function getMyEmployerProfile(): Promise<EmployerProfile | null> {
    try {
        const response = await apiFetch<any>("/employers/me", {
            cache: "no-store",
        });

        if (response.success && response.data) {
            return response.data as EmployerProfile;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch employer profile:", error);
        return null;
    }
}

/**
 * Update the authenticated employer's profile.
 */
export async function updateEmployerProfile(data: Partial<EmployerProfile>): Promise<{ success: boolean; message: string; data?: EmployerProfile }> {
    try {
        const response = await apiFetch<any>("/employers/me", {
            method: "PATCH",
            body: data,
        });

        if (response.success) {
            return { success: true, message: "Profile updated successfully.", data: response.data as EmployerProfile };
        } else {
            return { success: false, message: response.message || "Failed to update profile." };
        }
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { success: false, message: error.message || "An error occurred while updating the profile." };
    }
}

/**
 * Update the authenticated employer's username, email or password.
 * This calls the base user update endpoint as it handles password logic.
 */
export async function updateEmployerPassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await apiFetch<any>(`/users/${userId}`, {
            method: "PATCH",
            body: {
                current_password: currentPassword,
                password: newPassword,
            },
        });

        if (response.success) {
            return { success: true, message: "Password updated successfully." };
        } else {
            return { success: false, message: response.message || "Failed to update password." };
        }
    } catch (error: any) {
        console.error("Password update error:", error);
        return { success: false, message: error.message || "An error occurred while updating your password." };
    }
}

/**
 * Update the user's account details (e.g. username, email).
 */
export async function updateEmployerAccount(userId: string, currentPassword: string, data: { username?: string; email?: string }): Promise<{ success: boolean; message: string }> {
    try {
        const response = await apiFetch<any>(`/users/${userId}`, {
            method: "PATCH",
            body: {
                current_password: currentPassword,
                ...data,
            },
        });

        if (response.success) {
            return { success: true, message: "Account details updated successfully." };
        } else {
            return { success: false, message: response.message || "Failed to update account details." };
        }
    } catch (error: any) {
        console.error("Account update error:", error);
        return { success: false, message: error.message || "An error occurred while updating account details." };
    }
}

/**
 * Upload Employer's company logo.
 */
export async function uploadLogo(file: File): Promise<{ success: boolean; message: string; logo_url?: string }> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiFetch<any>("/employers/upload-logo", {
            method: "POST",
            body: formData,
        });

        if (response.success) {
            return { success: true, message: "Logo uploaded successfully.", logo_url: response.data.logo_url };
        } else {
            return { success: false, message: response.message || "Failed to upload logo." };
        }
    } catch (error: any) {
        console.error("Logo upload error:", error);
        return { success: false, message: error.message || "An error occurred while uploading logo." };
    }
}
