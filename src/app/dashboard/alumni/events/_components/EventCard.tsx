import { Briefcase, SlidersHorizontal, Presentation, Users, Calendar, MapPin } from "lucide-react";
import { formatEventDate } from "../../../_lib/events";

export default function EventCard({
    id,
    title,
    date,
    start,
    end,
    location,
    attendees,
    type,
    capacity,
    description,
    isRegistered,
    onToggleRegistration,
}: {
    id: number;
    title: string;
    date: string;
    start: string;
    end: string;
    location: string;
    attendees: number;
    type: string;
    capacity?: number;
    description?: string;
    isRegistered?: boolean;
    onToggleRegistration?: (id: number) => void;
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
                return 'bg-slate-50 text-slate-700 border-slate-200';
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
                return <Calendar className="h-4 w-4" strokeWidth={2} />;
        }
    };

    const capacityPercentage = capacity ? Math.round((attendees / capacity) * 100) : 0;
    const spotsRemaining = capacity ? capacity - attendees : 0;

    return (
        <div className="group relative rounded-2xl border border-slate-200/80 bg-white transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-emerald-200/60 overflow-hidden hover:-translate-y-1">
            {/* Top accent bar with animated gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-[length:200%_auto] animate-gradient-x opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Subtle background glow on hover */}
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500 pointer-events-none" />

            <div className="p-5">
                {/* Header with Type and Status */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${getTypeStyle()}`}>
                        {getTypeIcon()}
                        {type}
                    </div>
                    {isRegistered && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/50 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200 shadow-sm animate-in fade-in zoom-in duration-300">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Registered
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors duration-300 line-clamp-2 mb-2 leading-tight">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 pb-4 border-t border-slate-100 pt-4">
                    {/* Date */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{formatEventDate(date)}</span>
                            <span className="text-[10px]">{start} - {end}</span>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                            <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                        </div>
                        <span className="truncate leading-tight">{location}</span>
                    </div>

                    {/* Attendees */}
                    <div className="col-span-2 flex items-center gap-2.5 text-xs text-slate-600">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                            <Users className="h-3.5 w-3.5" strokeWidth={2} />
                        </div>
                        <span className="font-medium">
                            <span className="font-bold text-emerald-800">{attendees}</span>
                            {capacity && <span className="text-slate-500"> / {capacity} people attending</span>}
                        </span>
                    </div>
                </div>

                {/* Capacity Bar */}
                {capacity && (
                    <div className="mb-5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                            <span className="text-slate-400">Availability</span>
                            <span>
                                {spotsRemaining > 0 ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{spotsRemaining} spots remaining</span>
                                ) : (
                                    <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Fully Booked</span>
                                )}
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${capacityPercentage > 90
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                                    : capacityPercentage > 70
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                    }`}
                                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={() => onToggleRegistration?.(id)}
                    className={`group w-full rounded-xl py-3 text-sm font-bold transition-all duration-300 shadow-sm ${isRegistered
                        ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
                        : spotsRemaining <= 0
                            ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-700/30 hover:-translate-y-0.5 border border-emerald-800 active:scale-95'
                        }`}
                    disabled={spotsRemaining <= 0 && !isRegistered}
                >
                    {isRegistered ? (
                        <>
                            <span className="group-hover:hidden">Already Registered</span>
                            <span className="hidden group-hover:inline">Unregister from Event</span>
                        </>
                    ) : spotsRemaining <= 0 ? (
                        'Event Full'
                    ) : (
                        'Register Now'
                    )}
                </button>
            </div>
        </div>
    );
}
