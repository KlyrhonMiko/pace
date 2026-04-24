import { Settings, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmployerProfile, updateEmployerAccount } from "../_lib/api";
import { SectionCard } from "./SectionCard";
import { Field } from "./Field";

interface AccountAccessCardProps {
    profile: EmployerProfile;
    onUpdated?: () => void;
}

export function AccountAccessCard({ profile, onUpdated }: AccountAccessCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [editedData, setEditedData] = useState({
        username: profile.username,
        email: profile.email,
    });

    useEffect(() => {
        setEditedData({
            username: profile.username,
            email: profile.email,
        });
    }, [profile]);

    const handleSave = async () => {
        if (!currentPassword) {
            toast.error("Current password is required to save account changes.");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateEmployerAccount(profile.user_id, currentPassword, editedData);
            if (result.success) {
                toast.success("Account details updated successfully.");
                setIsEditing(false);
                setCurrentPassword("");
                onUpdated?.();
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SectionCard
            title="Account Access"
            subtitle="Login credentials and contact email"
            icon={<Settings size={18} />}
            iconContainerClass="bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20"
            editable={true}
            editing={isEditing}
            onEdit={() => setIsEditing(true)}
            onCancel={() => {
                setIsEditing(false);
                setCurrentPassword("");
                setEditedData({
                    username: profile.username,
                    email: profile.email,
                });
            }}
            onSave={handleSave}
            saving={isSaving}
        >
            <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Username */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Username <span className="text-emerald-600">*</span>
                        </label>
                        {isEditing ? (
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={editedData.username}
                                    onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                                    className="w-full h-[41px] rounded-xl border border-gray-300 bg-white text-sm text-gray-900 pl-10 pr-3.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[41px] rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                <span className="truncate">{profile.username}</span>
                            </div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Account Email <span className="text-emerald-600">*</span>
                        </label>
                        {isEditing ? (
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="email"
                                    value={editedData.email}
                                    onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                                    className="w-full h-[41px] rounded-xl border border-gray-300 bg-white text-sm text-gray-900 pl-10 pr-3.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[41px] rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                <span className="truncate">{profile.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="pt-2 border-t border-dashed border-gray-100">
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                </div>
                                <span className="text-xs font-bold text-emerald-900 uppercase tracking-tight">Security Verification</span>
                            </div>
                            <Field
                                label="Current Password"
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                type="password"
                                editing={true}
                                placeholder="Verify current password to save changes"
                                required
                            />
                            <p className="mt-2 text-[10px] text-emerald-700/70 font-medium">
                                To update account access credentials, we need to verify it's really you.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </SectionCard>
    );
}

