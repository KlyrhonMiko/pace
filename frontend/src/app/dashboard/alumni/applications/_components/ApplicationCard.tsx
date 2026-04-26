import { Building2, Clock, CheckCircle2, XCircle, Eye, ChevronRight } from "lucide-react";

export type ApplicationStatus = "Pending" | "Reviewed" | "Accepted" | "Rejected";

interface ApplicationCardProps {
    jobTitle: string;
    company: string;
    status: ApplicationStatus;
    appliedAt: string;
    onClick?: () => void;
}

const STATUS_CONFIG: Record<
    ApplicationStatus,
    {
        label: string;
        bg: string;
        text: string;
        border: string;
        icon: React.ElementType;
    }
> = {
    Pending: {
        label: "Under Review",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200/60",
        icon: Clock,
    },
    Reviewed: {
        label: "Reviewed",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200/60",
        icon: Eye,
    },
    Accepted: {
        label: "Accepted",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200/60",
        icon: CheckCircle2,
    },
    Rejected: {
        label: "Rejected",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200/60",
        icon: XCircle,
    },
};

export default function ApplicationCard({
    jobTitle,
    company,
    status,
    appliedAt,
    onClick,
}: ApplicationCardProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    const StatusIcon = config.icon;

    const getLogoGradient = () => {
        const charCode = company.charCodeAt(0);
        const gradients = [
            "from-violet-500 to-purple-600",
            "from-blue-500 to-cyan-600",
            "from-emerald-700 to-teal-600",
            "from-rose-500 to-pink-600",
            "from-orange-500 to-red-500",
            "from-indigo-500 to-blue-600",
            "from-amber-500 to-orange-600",
        ];
        return gradients[charCode % gradients.length];
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "—";
        }
    };

    const timeAgo = (dateStr: string) => {
        try {
            const diff = Date.now() - new Date(dateStr).getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days === 0) return "Today";
            if (days === 1) return "Yesterday";
            if (days < 7) return `${days}d ago`;
            if (days < 30) return `${Math.floor(days / 7)}w ago`;
            return formatDate(dateStr);
        } catch {
            return "";
        }
    };

    return (
        <div
            onClick={onClick}
            className="group relative flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:bg-slate-50 hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50 cursor-pointer"
        >
            {/* Company Logo/Initials */}
            <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getLogoGradient()} text-white text-lg font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md`}
            >
                {company.charAt(0).toUpperCase()}
            </div>

            {/* Application Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors duration-200 truncate text-sm">
                            {jobTitle}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-500 truncate">{company}</p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border ${config.bg} ${config.text} ${config.border}`}>
                        <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
                        {config.label}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>Applied {timeAgo(appliedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                        View Details
                        <ChevronRight className="h-3 w-3" strokeWidth={3} />
                    </div>
                </div>
            </div>
        </div>
    );
}
