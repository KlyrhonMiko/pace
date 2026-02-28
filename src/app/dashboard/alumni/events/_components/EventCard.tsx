import { Briefcase, SlidersHorizontal, Presentation, Users, Check, Calendar, MapPin } from "lucide-react";

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
                return <Briefcase className="h-4 w-4" strokeWidth={2} />;
            case 'workshop':
                return <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />;
            case 'seminar':
                return <Presentation className="h-4 w-4" strokeWidth={2} />;
            case 'networking':
                return <Users className="h-4 w-4" strokeWidth={2} />;
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
                            <Check className="h-3 w-3" strokeWidth={2.5} />
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
                        <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={1.5} />
                        <span className="font-medium">{date}</span>
                        <span className="text-slate-400">•</span>
                        <span>{time}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={1.5} />
                        <span>{location}</span>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Users className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={1.5} />
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
                                className={`h-full rounded-full transition-all duration-300 ${capacityPercentage > 90
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
                    className={`w-full rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${isRegistered
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
