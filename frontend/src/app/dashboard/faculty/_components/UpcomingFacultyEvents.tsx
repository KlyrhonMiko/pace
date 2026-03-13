import { CalendarDays, MapPin, Users } from "lucide-react";

const events = [
    {
        title: "Career Fair 2026",
        month: "MAR",
        day: "20",
        location: "PLP Main Hall",
        attendees: 245,
        status: "Organizing",
        gradient: "from-emerald-700 to-emerald-800",
        hex: "#10b981",
        statusStyle: "bg-emerald-50/80 text-emerald-700 ring-emerald-100/60",
    },
    {
        title: "Industry Talk: AI in Tech",
        month: "MAR",
        day: "5",
        location: "Online (Zoom)",
        attendees: 89,
        status: "Confirmed",
        gradient: "from-blue-500 to-blue-600",
        hex: "#3b82f6",
        statusStyle: "bg-blue-50/80 text-blue-700 ring-blue-100/60",
    },
    {
        title: "Resume Workshop",
        month: "FEB",
        day: "28",
        location: "Room 204",
        attendees: 32,
        status: "This Week",
        gradient: "from-violet-500 to-violet-600",
        hex: "#8b5cf6",
        statusStyle: "bg-amber-50/80 text-amber-700 ring-amber-100/60",
    },
];

export default function UpcomingFacultyEvents() {


    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Your Events</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Events you&apos;re organizing</p>
                    </div>
                </div>
                <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                    View All
                </button>
            </div>

            {/* Events List */}
            <div className="px-6 pb-2 flex-1 space-y-3">
                {events.slice(0, 3).map((event, idx) => (
                    <div
                        key={idx}
                        className="group/item relative rounded-xl border border-gray-100/60 bg-gradient-to-b from-gray-50/50 to-white p-4 hover:border-gray-200/80 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            {/* Date block */}
                            <div
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${event.gradient} text-white flex-shrink-0 transition-transform duration-300 group-hover/item:scale-105`}
                                style={{ boxShadow: `0 4px 14px ${event.hex}30` }}
                            >
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{event.month}</span>
                                <span className="text-xl font-extrabold leading-tight">{event.day}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 truncate group-hover/item:text-gray-900">{event.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <MapPin className="h-3 w-3 text-gray-400" />
                                        {event.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                        <Users className="h-3 w-3 text-gray-400" />
                                        {event.attendees}
                                    </span>
                                </div>
                            </div>

                            {/* Status badge */}
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 flex-shrink-0 ${event.statusStyle}`}>
                                {event.status}
                            </span>
                        </div>


                    </div>
                ))}
            </div>


        </div>
    );
}
