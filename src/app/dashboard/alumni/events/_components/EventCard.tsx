export default function EventCard({
    title,
    date,
    time,
    location,
    attendees,
    type,
    capacity,
    description,
    isRegistered,
}: {
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: number;
    type: string;
    capacity?: number;
    description?: string;
    isRegistered?: boolean;
}) {
    const getTypeStyle = () => {
        switch (type.toLowerCase()) {
            case 'career fair':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'workshop':
                return 'bg-violet-50 text-violet-700 border-violet-200';
            case 'seminar':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'networking':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getTypeIcon = () => {
        switch (type.toLowerCase()) {
            case 'career fair':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4m0 2v4m0-11v2m0 0h2m-2 0h-2m9 11h2m-2 0h-2m-9-11h2m-2 0h-2" />
                    </svg>
                );
            case 'workshop':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                );
            case 'seminar':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2m2 2a2 2 0 002-2m-2 2v-13a2 2 0 00-2-2H5a2 2 0 00-2 2v13a2 2 0 002 2h10a2 2 0 002-2z" />
                    </svg>
                );
            case 'networking':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const capacityPercentage = capacity ? Math.round((attendees / capacity) * 100) : 0;
    const spotsRemaining = capacity ? capacity - attendees : 0;

    return (
        <div className="group relative rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/30 transition-all duration-300 hover:shadow-lg hover:border-slate-300 overflow-hidden hover:-translate-y-0.5">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-700/80 via-emerald-600/60 to-emerald-700/40 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="p-5">
                {/* Header with Type and Status */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${getTypeStyle()}`}>
                        {getTypeIcon()}
                        {type}
                    </div>
                    {isRegistered && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Registered
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-200 line-clamp-2 mb-2.5">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Details Grid */}
                <div className="space-y-2.5 mb-3 pb-3 border-t border-slate-100 pt-3">
                    {/* Date and Time */}
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{date}</span>
                        <span className="text-slate-400">•</span>
                        <span>{time}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{location}</span>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>
                            <span className="font-semibold text-emerald-800">{attendees}</span>
                            {capacity && <span className="text-slate-400"> / {capacity} attending</span>}
                        </span>
                    </div>
                </div>

                {/* Capacity Bar */}
                {capacity && (
                    <div className="mb-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">Capacity</span>
                            <span className="text-slate-600 font-semibold">
                                {spotsRemaining > 0 ? (
                                    <span className="text-emerald-800">{spotsRemaining} spots left</span>
                                ) : (
                                    <span className="text-red-600">Event Full</span>
                                )}
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200/60 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    capacityPercentage > 90
                                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                                        : capacityPercentage > 70
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                        : 'bg-gradient-to-r from-emerald-700 to-emerald-800'
                                }`}
                                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <button
                    className={`w-full rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${
                        isRegistered
                            ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100/60'
                            : spotsRemaining <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-700/30 hover:-translate-y-0.5 border border-emerald-800'
                    }`}
                    disabled={spotsRemaining <= 0 && !isRegistered}
                >
                    {isRegistered ? 'Already Registered' : spotsRemaining <= 0 ? 'Event Full' : 'Register Now'}
                </button>
            </div>
        </div>
    );
}
