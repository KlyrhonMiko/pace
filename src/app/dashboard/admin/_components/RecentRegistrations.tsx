const registrations = [
    { name: "Maria Santos", email: "maria.santos@plp.edu.ph", role: "Alumni", course: "BSIT", date: "2h ago", status: "verified" as const, initials: "MS", color: "from-emerald-700 to-emerald-800" },
    { name: "Carlos Reyes", email: "carlos.reyes@plp.edu.ph", role: "Alumni", course: "BSCS", date: "5h ago", status: "pending" as const, initials: "CR", color: "from-blue-500 to-blue-600" },
    { name: "Ana Dela Cruz", email: "ana.delacruz@plp.edu.ph", role: "Alumni", course: "BSIT", date: "Yesterday", status: "verified" as const, initials: "AD", color: "from-violet-500 to-violet-600" },
    { name: "Jose Rizal Jr.", email: "jose.rizal@plp.edu.ph", role: "Alumni", course: "BSCE", date: "2d ago", status: "verified" as const, initials: "JR", color: "from-rose-500 to-rose-600" },
];

export default function RecentRegistrations() {
    const verifiedCount = registrations.filter((r) => r.status === "verified").length;
    const pendingCount = registrations.filter((r) => r.status === "pending").length;

    return (
        <div className="group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/20 hover:border-gray-200/80 overflow-hidden flex flex-col lg:col-span-2">


            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight">Recent Registrations</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Newest platform accounts</p>
                    </div>
                </div>
                <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 ring-1 ring-gray-100/60 hover:ring-gray-200">
                    View All
                </button>
            </div>

            {/* Table header */}
            <div className="mx-6 grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/60 rounded-lg border border-gray-100/40">
                <div className="col-span-5">User</div>
                <div className="col-span-2 hidden sm:block text-center">Role</div>
                <div className="col-span-3 hidden md:block text-center">Status</div>
                <div className="col-span-2 text-right">Joined</div>
            </div>

            {/* Rows */}
            <div className="px-6 pt-1 pb-2 flex-1">
                {registrations.map((user, idx) => (
                    <div
                        key={idx}
                        className="group/row grid grid-cols-12 gap-3 px-4 py-3.5 items-center rounded-xl hover:bg-gray-50/60 transition-all duration-200 cursor-pointer"
                    >
                        {/* User info */}
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${user.color} text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover/row:scale-105`}
                                >
                                    {user.initials}
                                </div>
                                {/* Status dot overlay */}
                                <div
                                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white flex items-center justify-center ${user.status === "verified" ? "bg-emerald-700" : "bg-amber-400"
                                        }`}
                                >
                                    {user.status === "verified" ? (
                                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="4" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 truncate group-hover/row:text-gray-900">
                                    {user.name}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="col-span-2 hidden sm:flex justify-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50/80 text-emerald-700 ring-1 ring-emerald-100/60">
                                <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                                </svg>
                                {user.role}
                            </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-3 hidden md:flex justify-center">
                            {user.status === "verified" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-100/60">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50/80 text-amber-600 ring-1 ring-amber-100/60">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pending
                                </span>
                            )}
                        </div>

                        {/* Joined date */}
                        <div className="col-span-2 text-right">
                            <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md ring-1 ring-gray-100/40 group-hover/row:bg-white group-hover/row:ring-gray-200/60 transition-all">
                                {user.date}
                            </span>
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
}
