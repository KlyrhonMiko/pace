import { MapPin, CircleDollarSign } from "lucide-react";

export default function JobCard({
    title,
    company,
    location,
    salary,
    type,
    logo,
    description,
    source,
    className,
    onClick,
}: {
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    logo: string;
    description?: string;
    source?: string;
    className?: string;
    onClick?: () => void;
}) {
    const isLocal = source === "Internal";
    const getBadgeStyle = () => {
        switch (type.toLowerCase()) {
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
        const charCode = logo.charCodeAt(0);
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
        <div onClick={onClick} className={`group relative flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 ${isLocal ? "bg-gradient-to-r from-emerald-50/50 to-transparent hover:from-emerald-100/50 hover:to-slate-50/50 shadow-[inset_2px_0_0_0_#10b981]" : "hover:bg-slate-50 hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/50"} cursor-pointer ${className}`}>

            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${(logo && (logo.startsWith('http') || logo.startsWith('/'))) ? 'bg-gray-50' : `bg-gradient-to-br ${getLogoGradient()}`} text-white text-sm font-bold shadow-sm ring-1 ring-emerald-200 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md overflow-hidden`}>
                {(logo && (logo.startsWith('http') || logo.startsWith('/'))) ? (
                    <img src={logo} alt={company} className="h-full w-full object-contain" />
                ) : (
                    logo
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-amber-800 transition-colors duration-200 truncate text-sm">
                            {title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{company}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border ${getBadgeStyle()}`}>
                        {type}
                    </span>
                </div>

                {description && (
                    <div
                        className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="text-gray-500">{location}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CircleDollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="text-gray-500">{salary}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
