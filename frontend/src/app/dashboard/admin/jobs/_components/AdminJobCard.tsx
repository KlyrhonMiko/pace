import { MapPin, CircleDollarSign, Edit2, EyeOff, Eye, Trash2 } from "lucide-react";

export default function AdminJobCard({
    job,
    className,
    onClick,
    onEdit,
    onToggleHide,
    onDelete,
    isLocal,
}: {
    job: any;
    className?: string;
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onToggleHide?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    isLocal?: boolean;
}) {
    const { title, company, location, salaryDisplay, type, logo, snippet, description, isActive } = job;

    const getBadgeStyle = () => {
        switch (type?.toLowerCase()) {
            case 'full-time':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
            case 'internship':
                return 'bg-blue-50 text-blue-700 border-blue-200/60';
            case 'part-time':
                return 'bg-amber-50 text-amber-700 border-amber-200/60';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200/60';
        }
    };

    const getLogoGradient = () => {
        const charCode = logo?.charCodeAt(0) || 0;
        const gradients = [
            'from-violet-500 to-purple-600',
            'from-blue-500 to-cyan-600',
            'from-emerald-700 to-teal-600',
            'from-rose-500 to-pink-600',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-blue-600',
            'from-amber-500 to-orange-600',
        ];
        return gradients[charCode % gradients.length];
    };

    return (
        <div onClick={onClick} className={`group relative flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-emerald-50/20 hover:border-emerald-200/60 hover:shadow-md hover:shadow-emerald-100/10 cursor-pointer ${className}`}>
            {/* Hover accent bar */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Company Logo */}
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getLogoGradient()} text-white text-sm font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md`}>
                {logo}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors duration-200 truncate text-sm">
                                {title}
                            </h3>
                            {isLocal && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase">
                                    Local
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border ${getBadgeStyle()}`}>
                            {type}
                        </span>

                    </div>
                </div>

                <div
                    className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: description || snippet || "" }}
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="text-gray-500">{location}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CircleDollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="text-gray-500">{salaryDisplay || "Undisclosed"}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
