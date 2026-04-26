"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Mail,
    Calendar,
    Briefcase,
    GraduationCap,
    CheckCircle2,
    XCircle,
    FileText,
    Award,
    User2,
    ExternalLink,
    UserCircle2,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface ApplicationDetailsDrawerProps {
    applicationId: string | null;
    onClose: () => void;
    onStatusChange?: (id: string, newStatus: string) => void;
}

const STATUS_STYLES: Record<string, { label: string; pill: string; dot: string }> = {
    Pending: {
        label: "Pending",
        pill: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },
    Accepted: {
        label: "Accepted",
        pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    Rejected: {
        label: "Rejected",
        pill: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
    },
};

export default function ApplicationDetailsDrawer({ applicationId, onClose, onStatusChange }: ApplicationDetailsDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [confirmStatus, setConfirmStatus] = useState<"Accepted" | "Rejected" | null>(null);
    const [modalStatus, setModalStatus] = useState<"Accepted" | "Rejected">("Accepted");

    useEffect(() => {
        if (confirmStatus) setModalStatus(confirmStatus);
    }, [confirmStatus]);

    useEffect(() => {
        if (!applicationId) {
            setData(null);
            return;
        }

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch<any>(`/employers/applications/${applicationId}`);
                if (res.success && res.data) {
                    setData(res.data);
                } else {
                    toast.error(res.message || "Failed to load application details");
                    onClose();
                }
            } catch (error: any) {
                toast.error(error.message || "An error occurred");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [applicationId, onClose]);

    const handleUpdateStatus = async (status: "Accepted" | "Rejected") => {
        if (!applicationId || isUpdating) return;
        setIsUpdating(true);
        try {
            const result = await apiFetch<any>(`/employers/applications/${applicationId}/status?status=${status}`, {
                method: "PATCH"
            });
            if (result.success) {
                toast.success(`Application marked as ${status.toLowerCase()}!`);
                setData((prev: any) => ({
                    ...prev,
                    application: { ...prev.application, status }
                }));
                if (onStatusChange) {
                    onStatusChange(applicationId, status);
                }
            } else {
                toast.error(result.message || "Failed to update status");
            }
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsUpdating(false);
            setConfirmStatus(null);
        }
    };

    const alumni = data?.alumni;
    const resume = data?.resume;
    const application = data?.application;
    const resumeFileUrl = application?.resume_file_url;
    const status = application?.status as string | undefined;
    const statusStyle = (status && STATUS_STYLES[status]) || STATUS_STYLES.Pending;

    const initials = `${alumni?.first_name?.charAt(0) ?? ""}${alumni?.last_name?.charAt(0) ?? ""}`.toUpperCase();
    const appliedDate = application?.applied_at
        ? new Date(application.applied_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : null;

    const hasStructuredResume = !!(
        resume?.personal_info?.summary ||
        (resume?.work_experience && resume.work_experience.length > 0) ||
        (resume?.education && resume.education.length > 0) ||
        (resume?.skills && resume.skills.length > 0)
    );

    const profileFields = [
        alumni?.email && { label: "Email", value: alumni.email, isEmail: true, className: "sm:col-span-2" },
        alumni?.employment_status && { label: "Status", value: alumni.employment_status, className: "sm:col-span-2" },
        alumni?.course_name && { label: "Degree", value: alumni.course_name, className: "sm:col-span-3" },
        alumni?.year_graduated && { label: "Graduation", value: String(alumni.year_graduated), className: "sm:col-span-1" },
        alumni?.gwa && { label: "GWA", value: String(alumni.gwa), accent: true, className: "sm:col-span-2" },
    ].filter(Boolean) as Array<{ label: string; value: string; isEmail?: boolean; accent?: boolean; className?: string }>;

    return (
        <Dialog open={!!applicationId} onOpenChange={(open) => !open && !isUpdating && onClose()}>
            <DialogContent
                showCloseButton={!isUpdating}
                className="sm:max-w-2xl p-0 gap-0 rounded-2xl border-gray-100 overflow-hidden shadow-2xl"
            >
                <DialogTitle className="sr-only">
                    {alumni ? `Application Details for ${alumni.first_name} ${alumni.last_name}` : "Application Details"}
                </DialogTitle>

                {isLoading || !data ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                        <p className="text-sm text-slate-500">Loading candidate details...</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <DialogHeader className="p-6 pb-0">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 text-sm font-bold">
                                    {initials || <UserCircle2 className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1 pr-8">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <DialogTitle className="text-base font-bold text-gray-900 truncate">
                                            {alumni?.first_name} {alumni?.last_name}
                                        </DialogTitle>
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                                                statusStyle.pill
                                            )}
                                        >
                                            <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)} />
                                            {statusStyle.label}
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                        Applied for{" "}
                                        <span className="font-medium text-gray-700">{data.job?.title}</span>
                                        {appliedDate && <> · {appliedDate}</>}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Body */}
                        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Profile Overview */}
                            {profileFields.length > 0 && (
                                <Section icon={User2} title="Profile Overview">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        {profileFields.map((field) => (
                                            <FieldCard key={field.label} label={field.label} className={field.className}>
                                                {field.isEmail ? (
                                                    <a
                                                        href={`mailto:${field.value}`}
                                                        className="text-emerald-700 hover:underline break-all"
                                                    >
                                                        {field.value}
                                                    </a>
                                                ) : (
                                                    <span className={cn(field.accent && "font-semibold text-emerald-700")}>
                                                        {field.value}
                                                    </span>
                                                )}
                                            </FieldCard>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* About */}
                            {resume?.personal_info?.summary && (
                                <Section icon={Sparkles} title="About">
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {resume.personal_info.summary}
                                    </p>
                                </Section>
                            )}

                            {/* Experience */}
                            {resume?.work_experience && resume.work_experience.length > 0 && (
                                <Section icon={Briefcase} title="Experience">
                                    <div className="space-y-4">
                                        {resume.work_experience.map((exp: any, i: number) => (
                                            <TimelineItem
                                                key={i}
                                                isLast={i === resume.work_experience.length - 1}
                                                title={exp.job_title}
                                                subtitle={exp.company}
                                                date={
                                                    exp.start_date || exp.end_date
                                                        ? `${exp.start_date ?? ""} – ${exp.end_date || "Present"}`
                                                        : null
                                                }
                                                description={exp.description}
                                            />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Education */}
                            {resume?.education && resume.education.length > 0 && (
                                <Section icon={GraduationCap} title="Education">
                                    <div className="space-y-4">
                                        {resume.education.map((edu: any, i: number) => (
                                            <TimelineItem
                                                key={i}
                                                isLast={i === resume.education.length - 1}
                                                title={edu.degree}
                                                subtitle={edu.school}
                                                date={edu.graduation_date || null}
                                            />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Skills */}
                            {(alumni?.skills?.length > 0 || resume?.skills?.length > 0) && (
                                <Section icon={Award} title="Skills">
                                    <div className="flex flex-wrap gap-1.5">
                                        {(alumni?.skills || resume?.skills).map((skill: any, i: number) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-md"
                                            >
                                                {typeof skill === "string" ? skill : skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Attached Resume File */}
                            {resumeFileUrl && (
                                <Section icon={FileText} title="Attached Resume">
                                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                                <FileText className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">Resume PDF</p>
                                                <p className="text-xs text-slate-500">Uploaded by candidate</p>
                                            </div>
                                        </div>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="shrink-0 border-slate-200 hover:bg-white"
                                        >
                                            <a href={resumeFileUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                                Open PDF
                                            </a>
                                        </Button>
                                    </div>
                                </Section>
                            )}

                            {/* Empty state */}
                            {!hasStructuredResume && !resumeFileUrl && (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                                    <FileText className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700">No resume submitted</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                        The candidate applied without attaching a resume.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-3">
                            <Button
                                asChild
                                variant="ghost"
                                className="px-3 py-2.5 h-auto rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <a href={`mailto:${alumni?.email}`}>
                                    <Mail className="mr-1.5 h-4 w-4" />
                                    Send Email
                                </a>
                            </Button>

                            <div className="flex items-center gap-2.5">
                                {status !== "Rejected" && (
                                    <Button
                                        type="button"
                                        onClick={() => setConfirmStatus("Rejected")}
                                        disabled={isUpdating}
                                        variant="ghost"
                                        className="px-5 py-2.5 h-auto rounded-xl text-sm font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        <XCircle className="mr-1.5 h-4 w-4" />
                                        Reject
                                    </Button>
                                )}
                                {status !== "Accepted" && (
                                    <Button
                                        type="button"
                                        onClick={() => setConfirmStatus("Accepted")}
                                        disabled={isUpdating}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 h-auto rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Approve
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <ConfirmationModal
                            isOpen={confirmStatus !== null}
                            onClose={() => setConfirmStatus(null)}
                            onConfirm={() => handleUpdateStatus(modalStatus)}
                            title={modalStatus === "Accepted" ? "Approve Application" : "Reject Application"}
                            description={
                                modalStatus === "Accepted"
                                    ? `Are you sure you want to approve ${alumni?.first_name}'s application? This will mark them as accepted for this role.`
                                    : `Are you sure you want to reject ${alumni?.first_name}'s application? This will mark them as rejected for this role.`
                            }
                            confirmText={modalStatus === "Accepted" ? "Approve" : "Reject"}
                            variant={modalStatus === "Accepted" ? "success" : "danger"}
                            isLoading={isUpdating}
                            icon={modalStatus === "Accepted" ? CheckCircle2 : XCircle}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Section({
    icon: Icon,
    title,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function FieldCard({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5", className)}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-sm text-slate-800 leading-snug mt-0.5 break-words">{children}</p>
        </div>
    );
}

function TimelineItem({
    title,
    subtitle,
    date,
    description,
    isLast,
}: {
    title?: string;
    subtitle?: string;
    date?: string | null;
    description?: string;
    isLast?: boolean;
}) {
    return (
        <div className={cn("relative pl-5", !isLast && "pb-4")}>
            <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            {!isLast && <span className="absolute left-[3.5px] top-4 bottom-0 w-px bg-slate-200" />}
            {title && <h4 className="text-sm font-semibold text-slate-900 leading-snug">{title}</h4>}
            {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
            {date && (
                <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> {date}
                </p>
            )}
            {description && (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mt-2">{description}</p>
            )}
        </div>
    );
}
