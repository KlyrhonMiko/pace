import { Calendar, MapPin, Clock, Edit2, Trash2, Users, ArrowUpRight } from "lucide-react";
import { formatEventDate, getMonthAbbreviation, getDayNumber, type Event } from "@/app/dashboard/_lib/events";
import { Button } from "@/components/ui/button";

interface EventCardProps {
    event: Event;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: string) => void;
    onToggleRegistration?: (eventId: string) => void;
}

export default function EventCard({
    event,
    onEdit,
    onDelete,
    onToggleRegistration,
}: EventCardProps) {
    const accent = getAccentColor(event.event_type);
    const capacityPercentage = event.capacity ? Math.round((event.attendees / event.capacity) * 100) : 0;
    const spotsRemaining = event.capacity ? event.capacity - event.attendees : 0;
    const month = getMonthAbbreviation(event.date);
    const day = getDayNumber(event.date);

    return (
        <div
            className="group relative overflow-hidden rounded-2xl border bg-white transition-all duration-500 hover:-translate-y-0.5"
            style={{
                borderColor: `color-mix(in srgb, ${accent} 14%, #e2e8f0)`,
                boxShadow: `0 1px 3px rgba(0,0,0,0.04)`,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 50px -12px ${accent}18, 0 8px 20px -8px rgba(0,0,0,0.04)`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 1px 3px rgba(0,0,0,0.04)`;
            }}
        >
            {/* Accent glow on hover */}
            <div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                    background: `linear-gradient(135deg, ${accent}08, transparent 40%, ${accent}05)`,
                }}
            />

            {/* Inner grid: left date/image + right content */}
            <div className={`relative flex flex-col md:grid ${event.image_url ? 'md:grid-cols-[350px_1fr]' : 'md:grid-cols-[200px_1fr]'} min-h-[200px]`}>

                {/* === Left: Date showcase or Image === */}
                <div
                    className="relative flex flex-col items-center justify-center overflow-hidden h-48 md:h-auto"
                >
                    {event.image_url ? (
                        <img src={event.image_url} alt={event.event_name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8"
                            style={{
                                background: `linear-gradient(160deg, ${accent}08, ${accent}03 50%, transparent)`,
                            }}
                        >
                            {/* Subtle radial glow */}
                            <div
                                className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] transition-opacity duration-500 opacity-[0.06] group-hover:opacity-[0.14]"
                                style={{ background: accent }}
                            />

                            {/* Decorative grid dots */}
                            <div
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `radial-gradient(circle, ${accent} 1px, transparent 1px)`,
                                    backgroundSize: "20px 20px",
                                }}
                            />

                            {/* Date display */}
                            <div className="relative z-10 flex flex-col items-center transition-transform duration-700 ease-out group-hover:-translate-y-1">
                                <span
                                    className="text-xs font-black uppercase tracking-[0.2em]"
                                    style={{ color: accent }}
                                >
                                    {month}
                                </span>
                                <span className="text-5xl font-black leading-none text-slate-800 mt-0.5">
                                    {day}
                                </span>
                                <div
                                    className="mt-2.5 h-px w-8 rounded-full"
                                    style={{ background: `${accent}30` }}
                                />
                                <span className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                                    {event.time_start} – {event.time_end}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* === Right: Content === */}
                <div className="relative flex flex-col justify-center p-5 md:py-6 md:pr-6 md:pl-4">
                    {/* Top: event type & actions */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span
                                className="text-[10px] font-bold tracking-widest uppercase"
                                style={{ color: accent }}
                            >
                                {event.event_type}
                            </span>

                        </div>

                        <div className="flex items-center gap-2">
                            {onToggleRegistration && (
                                <div className="flex items-center">
                                    {event.is_registered ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleRegistration(event.event_id);
                                            }}
                                            className="group/btn inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-all duration-300 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 cursor-pointer shadow-sm"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 group-hover/btn:bg-rose-500 animate-pulse" />
                                            <span className="group-hover/btn:hidden">Registered</span>
                                            <span className="hidden group-hover/btn:inline">Unregister</span>
                                        </button>
                                    ) : spotsRemaining <= 0 ? (
                                        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-200">
                                            Event Full
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleRegistration(event.event_id);
                                            }}
                                            className="group/btn inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/30 hover:brightness-110 active:scale-[0.98] cursor-pointer"
                                        >
                                            Register Now
                                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(event);
                                        }}
                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(event.event_id);
                                        }}
                                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 transition-colors">
                        {event.event_name}
                    </h3>

                    {/* Description */}
                    {event.description && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
                            {event.description}
                        </p>
                    )}

                    {/* Divider */}
                    <div className="my-3 h-px w-full" style={{ background: `${accent}10` }} />

                    {/* Detail tags */}
                    <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100/80 transition-colors hover:border-slate-200">
                            <Calendar className="h-3 w-3 text-slate-400" strokeWidth={2} />
                            {formatEventDate(event.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100/80 transition-colors hover:border-slate-200">
                            <Clock className="h-3 w-3 text-slate-400" strokeWidth={2} />
                            {event.time_start} – {event.time_end}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100/80 transition-colors hover:border-slate-200">
                            <MapPin className="h-3 w-3 text-slate-400" strokeWidth={2} />
                            {event.location}
                        </span>
                        {event.capacity && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100/80 transition-colors hover:border-slate-200">
                                <Users className="h-3 w-3 text-slate-400" strokeWidth={2} />
                                {event.attendees} / {event.capacity} attending
                            </span>
                        )}
                    </div>

                    {/* Capacity bar */}
                    {event.capacity && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${Math.min(capacityPercentage, 100)}%`,
                                        background: capacityPercentage > 90
                                            ? 'linear-gradient(90deg, #ef4444, #e11d48)'
                                            : capacityPercentage > 70
                                                ? 'linear-gradient(90deg, #f59e0b, #ea580c)'
                                                : `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                                    }}
                                />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                                style={{
                                    color: spotsRemaining > 0 ? accent : '#ef4444',
                                }}
                            >
                                {spotsRemaining > 0 ? `${spotsRemaining} spots left` : 'Full'}
                            </span>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}

function getAccentColor(eventType: string): string {
    switch (eventType?.toLowerCase()) {
        case 'career fair':
            return '#059669';
        case 'workshop':
            return '#7c3aed';
        case 'seminar':
            return '#2563eb';
        case 'networking':
            return '#d97706';
        default:
            return '#475569';
    }
}
