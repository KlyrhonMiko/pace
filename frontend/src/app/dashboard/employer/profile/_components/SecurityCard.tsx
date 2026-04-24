import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { EmployerProfile, updateEmployerPassword } from "../_lib/api";
import { SectionCard } from "./SectionCard";
import { Field } from "./Field";
import { PasswordRequirements } from "./PasswordRequirements";
import { useAuth } from "@/context/AuthContext";

interface SecurityCardProps {
    profile: EmployerProfile;
}

export function SecurityCard({ profile }: SecurityCardProps) {
    const { logout } = useAuth();
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const handlePasswordChange = async () => {
        if (!profile) return;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("All fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        setIsSavingPassword(true);

        try {
            const result = await updateEmployerPassword(
                profile.user_id,
                currentPassword,
                newPassword
            );

            if (result.success) {
                toast.success("Password updated successfully. You will be logged out in 3 seconds.");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setIsChangingPassword(false);

                // Log out after a delay
                setTimeout(() => {
                    logout();
                }, 3000);
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update password.");
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <SectionCard
            title="Security & Password"
            subtitle="Manage your account security"
            icon={<Lock size={18} />}
            iconContainerClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/20"
            editable={true}
            editLabel="Change Password"
            editing={isChangingPassword}
            onEdit={() => setIsChangingPassword(true)}
            onSave={handlePasswordChange}
            onCancel={() => setIsChangingPassword(false)}
            saving={isSavingPassword}
        >
            <div className={`space-y-4 ${!isChangingPassword ? "opacity-60 pointer-events-none select-none" : ""}`}>
                <div className="space-y-4">
                    <Field
                        label="Current Password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        type="password"
                        editing={isChangingPassword}
                        placeholder="••••••••"
                        required
                    />
                    <Field
                        label="New Password"
                        value={newPassword}
                        onChange={setNewPassword}
                        type="password"
                        editing={isChangingPassword}
                        placeholder="••••••••"
                        required
                    />
                    <PasswordRequirements password={newPassword} />
                    <Field
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        type="password"
                        editing={isChangingPassword}
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>
        </SectionCard>
    );
}
