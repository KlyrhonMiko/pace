const sessions = [
    {
        title: "Career Counseling",
        student: "Carlos Reyes",
        time: "2:00 PM",
        day: "Today",
        type: "1-on-1",
        isLive: true,
        color: "emerald",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
        ),
    },
    {
        title: "Resume Review",
        student: "Ana Dela Cruz",
        time: "4:30 PM",
        day: "Today",
        type: "1-on-1",
        isLive: true,
        color: "blue",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
    {
        title: "Group Mentoring",
        student: "BSIT 4th Year (12)",
        time: "10:00 AM",
        day: "Tomorrow",
        type: "Group",
        isLive: false,
        color: "violet",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
        ),
    },
    {
        title: "Mock Interview",
        student: "Lea Garcia",
        time: "1:00 PM",
        day: "Wed",
        type: "1-on-1",
        isLive: false,
        color: "amber",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
        ),
    },
];

const colorMap: Record<string, { gradient: string; hex: string; bg: string; text: string; ring: string }> = {
    emerald: { gradient: "from-emerald-600 to-emerald-700", hex: "#10b981", bg: "bg-emerald-50", text: "text-emerald-800", ring: "ring-emerald-100/60" },
    blue: { gradient: "from-blue-400 to-blue-500", hex: "#3b82f6", bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100/60" },
    violet: { gradient: "from-violet-400 to-violet-500", hex: "#8b5cf6", bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100/60" },
    amber: { gradient: "from-amber-400 to-amber-500", hex: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100/60" },
};

export default function UpcomingSessions() {
    const todayCount = sessions.filter((s) => s.day === "Today").length;

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Upcoming Sessions</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Mentoring schedule</p>
                    </div>
                </div>

            </div>

            {/* Sessions List */}
            <div className="px-6 pb-2 flex-1">
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div
                        className="absolute left-[15px] top-[20px] bottom-[20px] w-px"
                        style={{
                            background: "linear-gradient(to bottom, #e2e8f0, #e2e8f0 60%, transparent)",
                        }}
                    />

                    <div className="space-y-0.5">
                        {sessions.map((s, idx) => {
                            const colors = colorMap[s.color];
                            return (
                                <div
                                    key={idx}
                                    className="group/item relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/60 transition-all duration-200 cursor-pointer"
                                >
                                    {/* Icon node */}
                                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                                        <div
                                            className={`w-[30px] h-[30px] rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white ring-[3px] ring-white transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-md`}
                                            style={{ boxShadow: `0 4px 12px ${colors.hex}25` }}
                                        >
                                            {s.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-semibold text-gray-800 leading-tight group-hover/item:text-gray-900 transition-colors">
                                                {s.title}
                                            </p>
                                            {s.isLive && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-700 text-[8px] font-bold text-white uppercase tracking-wider">
                                                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] text-gray-500">{s.student}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className={`text-[11px] font-semibold ${s.isLive ? colors.text : "text-gray-500"}`}>
                                                {s.day}, {s.time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Type badge */}
                                    <div className="flex-shrink-0 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 ${s.type === "Group"
                                            ? "bg-violet-50/80 text-violet-700 ring-violet-100/60"
                                            : "bg-gray-50/80 text-gray-600 ring-gray-100/60"
                                            } group-hover/item:ring-gray-200/80 transition-all`}>
                                            {s.type}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>


        </div>
    );
}
