import { User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmployerProfile, updateEmployerProfile } from "../_lib/api";
import { SectionCard } from "./SectionCard";
import { Field } from "./Field";

interface ContactPersonCardProps {
    profile: EmployerProfile;
    onUpdated?: () => void;
}

export function ContactPersonCard({ profile, onUpdated }: ContactPersonCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedData, setEditedData] = useState({
        contact_person_first_name: profile.contact_person_first_name,
        contact_person_last_name: profile.contact_person_last_name,
        contact_person_position: profile.contact_person_position || "",
    });

    useEffect(() => {
        setEditedData({
            contact_person_first_name: profile.contact_person_first_name,
            contact_person_last_name: profile.contact_person_last_name,
            contact_person_position: profile.contact_person_position || "",
        });
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateEmployerProfile(editedData);
            if (result.success) {
                toast.success("Contact details updated successfully.");
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
            title="Contact Person Details"
            subtitle="Primary contact information for this account"
            icon={<User size={18} />}
            iconContainerClass="bg-gradient-to-br from-blue-600 to-indigo-500 shadow-blue-500/20"
            editable={true}
            editing={isEditing}
            onEdit={() => setIsEditing(true)}
            onCancel={() => {
                setIsEditing(false);
                setEditedData({
                    contact_person_first_name: profile.contact_person_first_name,
                    contact_person_last_name: profile.contact_person_last_name,
                    contact_person_position: profile.contact_person_position || "",
                });
            }}
            onSave={handleSave}
            saving={isSaving}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                    label="First Name"
                    value={editedData.contact_person_first_name}
                    onChange={(v) => setEditedData({ ...editedData, contact_person_first_name: v })}
                    editing={isEditing}
                    required
                />
                <Field
                    label="Last Name"
                    value={editedData.contact_person_last_name}
                    onChange={(v) => setEditedData({ ...editedData, contact_person_last_name: v })}
                    editing={isEditing}
                    required
                />
                <div className="md:col-span-2">
                    <Field
                        label="Position / Designation"
                        value={editedData.contact_person_position}
                        onChange={(v) => setEditedData({ ...editedData, contact_person_position: v })}
                        editing={isEditing}
                        placeholder="e.g. HR Manager, Technical Recruiter"
                    />
                </div>
            </div>
        </SectionCard>
    );
}

