export default function ActivityItem({
    icon,
    title,
    description,
    time,
    iconBg,
    isLast = false,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    time: string;
    iconBg: string;
    isLast?: boolean;
}) {
    return (
        <div className="group/item relative flex gap-4 py-3.5 px-3 -mx-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/30 transition-all duration-200 cursor-default">
            {/* Timeline connector */}
            <div className="relative flex-shrink-0">
                {!isLast && (
                    <div className="absolute left-1/2 top-[3.25rem] -translate-x-1/2 w-px h-[calc(100%-12px)] bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
                )}
                <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} shadow-md ring-4 ring-white group-hover/item:ring-gray-50/80 transition-all duration-200 group-hover/item:scale-105`}>
                    {icon}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover/item:text-blue-900 transition-colors">{title}</p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{description}</p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] font-semibold text-gray-400 bg-gray-50 group-hover/item:bg-white group-hover/item:text-blue-500 px-2 py-0.5 rounded-full mt-0.5 transition-all duration-200">
                        {time}
                    </span>
                </div>
            </div>
        </div>
    );
}
