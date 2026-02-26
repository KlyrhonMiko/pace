export default function JobCard({
    title,
    company,
    location,
    salary,
    type,
    logo,
    description,
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
    className?: string;
    onClick?: () => void;
}) {
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
        <div onClick={onClick} className={`group relative flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-amber-50/30 hover:border-amber-200/60 hover:shadow-md hover:shadow-amber-100/20 cursor-pointer ${className}`}>
            {/* Hover accent bar */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Company Logo */}
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getLogoGradient()} text-white text-sm font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md`}>
                {logo}
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
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-500">{location}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-500">{salary}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
