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
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                        </svg>
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
                                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        {event.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                        </svg>
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
