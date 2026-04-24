import { Briefcase, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmployerProfile, updateEmployerProfile } from "../_lib/api";
import { SectionCard } from "./SectionCard";
import { Field } from "./Field";

interface CompanyInfoCardProps {
    profile: EmployerProfile;
    onUpdated?: () => void;
}

export function CompanyInfoCard({ profile, onUpdated }: CompanyInfoCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedData, setEditedData] = useState({
        company_name: profile.company_name,
        company_address: profile.company_address || "",
        company_website: profile.company_website || "",
        company_contact_number: profile.company_contact_number || "",
    });

    useEffect(() => {
        setEditedData({
            company_name: profile.company_name,
            company_address: profile.company_address || "",
            company_website: profile.company_website || "",
            company_contact_number: profile.company_contact_number || "",
        });
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateEmployerProfile(editedData);
            if (result.success) {
                toast.success("Company profile updated successfully.");
                setIsEditing(false);
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
            title="Company Profile"
            subtitle="General information about your organization"
            icon={<Briefcase size={18} />}
            iconContainerClass="bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/20"
            editable={true}
            editing={isEditing}
            onEdit={() => setIsEditing(true)}
            onCancel={() => {
                setIsEditing(false);
                setEditedData({
                    company_name: profile.company_name,
                    company_address: profile.company_address || "",
                    company_website: profile.company_website || "",
                    company_contact_number: profile.company_contact_number || "",
                });
            }}
            onSave={handleSave}
            saving={isSaving}
        >
            <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        label="Official Company Name"
                        value={editedData.company_name}
                        onChange={(v) => setEditedData({ ...editedData, company_name: v })}
                        editing={isEditing}
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Company Address
                        </label>
                        {isEditing ? (
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={editedData.company_address}
                                    onChange={(e) => setEditedData({ ...editedData, company_address: e.target.value })}
                                    className="w-full h-[41px] rounded-xl border border-gray-300 bg-white text-sm text-gray-900 pl-10 pr-3.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    placeholder="Enter company address"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[41px] rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 px-3.5 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                <span className="truncate">{profile.company_address || "No address provided"}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        label="Company Website"
                        value={editedData.company_website}
                        onChange={(v) => setEditedData({ ...editedData, company_website: v })}
                        editing={isEditing}
                        placeholder="https://example.com"
                    />
                    <Field
                        label="Company Contact Number"
                        value={editedData.company_contact_number}
                        onChange={(v) => setEditedData({ ...editedData, company_contact_number: v })}
                        editing={isEditing}
                        placeholder="+63 9xx xxx xxxx"
                    />
                </div>
            </div>
        </SectionCard>
    );
}

