import { UserPlus, Check, GraduationCap, ShieldCheck, Clock, Circle } from "lucide-react";

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
                        <UserPlus className="h-5 w-5" strokeWidth={2} />
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
                                        <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                    ) : (
                                        <Circle className="w-2 h-2 text-white fill-current" strokeWidth={0} />
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
                                <GraduationCap className="w-3 h-3 text-emerald-700" strokeWidth={2} />
                                {user.role}
                            </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-3 hidden md:flex justify-center">
                            {user.status === "verified" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-100/60">
                                    <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50/80 text-amber-600 ring-1 ring-amber-100/60">
                                    <Clock className="w-3 h-3" strokeWidth={2.5} />
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
