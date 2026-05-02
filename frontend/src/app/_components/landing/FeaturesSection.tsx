import {
    Briefcase,
    GraduationCap,
    Users,
    ShieldCheck,
    CalendarDays,
    Building2,
    MapPin,
    Sparkles,
} from "lucide-react";

export function FeaturesSection() {
    return (
        <section className="py-24 bg-gray-50/80 relative overflow-hidden" id="features">
            {/* Subtle ambient background — same idiom as dashboard featured cards */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/40 via-transparent to-transparent blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-100/30 via-transparent to-transparent blur-3xl -z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section header — matches dashboard PageHeader / card-header idiom */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                        Why <span className="text-emerald-700">P.A.C.E.</span>?
                    </h2>
                    <p className="text-[13px] lg:text-sm text-gray-500 leading-relaxed">
                        A comprehensive platform custom-built to support the unique journey of every alumni from Pamantasan ng Lungsod ng Pasig.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 auto-rows-[minmax(180px,auto)] gap-4 lg:gap-5">

                    {/* ── TILE 1 — Career Opportunities (LARGE flagship) ─────── */}
                    {/* Mirrors ProfileStrength + EmployabilityScore featured card style */}
                    <article className="md:col-span-4 lg:col-span-3 lg:row-span-2 group relative rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-700 to-teal-500 text-white border border-emerald-800/20 shadow-lg shadow-emerald-500/20 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5">
                        {/* Decorative — same as ProfileStrength */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-teal-400/20 blur-2xl" />

                        <div className="relative p-6 lg:p-8 flex flex-col h-full">
                            {/* Header — matches dashboard card header pattern */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 shadow-sm">
                                        <Briefcase className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white leading-none">Career Opportunities</h3>
                                        <p className="text-[11px] text-emerald-100/80 font-medium mt-0.5">Flagship feature</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-full">
                                    Featured
                                </span>
                            </div>

                            {/* Title + description */}
                            <div className="mb-6">
                                <p className="text-2xl lg:text-[26px] font-extrabold tracking-tight leading-tight mb-2">
                                    Land roles built for PLP alumni.
                                </p>
                                <p className="text-[13px] text-emerald-50/90 leading-relaxed max-w-md">
                                    A centralized board of curated job openings and internships from trusted partners — surfaced just for the Pasig community.
                                </p>
                            </div>

                            {/* Mini job-board mockup — matches dashboard list-row idiom */}
                            <div className="mt-auto space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100/80 shadow-sm">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25 shrink-0">
                                        <Building2 className="h-4 w-4" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">Senior Frontend Engineer</p>
                                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" strokeWidth={2} />
                                            Pasig City · Remote
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                                        New
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/95 rounded-xl border border-gray-100/80 shadow-sm opacity-90">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/25 shrink-0">
                                        <Building2 className="h-4 w-4" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">Marketing Associate</p>
                                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" strokeWidth={2} />
                                            Ortigas · Hybrid
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* ── TILE 2 — Community Network (TALL) ─────── */}
                    <article className="md:col-span-2 lg:col-span-2 lg:row-span-2 group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200/80 hover:-translate-y-0.5">
                        <div className="p-6 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 leading-none">Community Network</h3>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Connect & engage</p>
                                </div>
                            </div>

                            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                                Reconnect with batchmates and build professional relationships within the alumni ecosystem.
                            </p>

                            {/* Avatar stack visual */}
                            <div className="mt-auto">
                                <div className="flex -space-x-2.5 mb-5">
                                    <div className="h-10 w-10 rounded-full border-[3px] border-white bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm" />
                                    <div className="h-10 w-10 rounded-full border-[3px] border-white bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm" />
                                    <div className="h-10 w-10 rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm" />
                                    <div className="h-10 w-10 rounded-full border-[3px] border-white bg-gradient-to-br from-pink-400 to-rose-500 shadow-sm" />
                                    <div className="h-10 w-10 rounded-full border-[3px] border-white bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700 shadow-sm">
                                        +98
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums leading-none">100+</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-1.5">Active alumni this month</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                                            Growing
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* ── TILE 3 — Professional Growth (SMALL) ─────── */}
                    <article className="md:col-span-2 lg:col-span-1 group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200/80 hover:-translate-y-0.5">
                        <div className="p-5 flex flex-col h-full">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/25 mb-4">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 leading-tight tracking-tight mb-1.5">
                                Professional Growth
                            </h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Seminars, workshops & resources to advance your career.
                            </p>
                        </div>
                    </article>

                    {/* ── TILE 4 — Employability Insights (SMALL) ─────── */}
                    <article className="md:col-span-2 lg:col-span-1 group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200/80 hover:-translate-y-0.5">
                        <div className="p-5 flex flex-col h-full">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 mb-4">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 leading-tight tracking-tight mb-1.5">
                                Employability Insights
                            </h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                AI-powered analysis of your career potential and growth areas.
                            </p>
                        </div>
                    </article>

                    {/* ── TILE 5 — Verified PLP Alumni (WIDE 2-col) ─────── */}
                    <article className="md:col-span-2 lg:col-span-2 group relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 shadow-lg shadow-gray-500/20 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-gray-500/30 hover:-translate-y-0.5">
                        {/* Subtle decorative glow */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />

                        <div className="relative p-5 flex items-center gap-4 h-full">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20 backdrop-blur-sm shrink-0">
                                <ShieldCheck className="h-6 w-6 text-emerald-400" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-white leading-none tracking-tight">
                                        Verified PLP Alumni
                                    </h3>
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                                    Every member is authenticated through PLP records. Trust by default.
                                </p>
                            </div>
                        </div>
                    </article>

                    {/* ── TILE 6 — Events & Reunions (WIDE 4-col) ─────── */}
                    <article className="md:col-span-4 lg:col-span-4 group relative rounded-2xl bg-white border border-gray-100/80 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200/80 hover:-translate-y-0.5">
                        <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-pink-50 blur-3xl opacity-70" />

                        <div className="relative p-6 flex flex-col sm:flex-row sm:items-center gap-6 h-full">
                            {/* Left: header + description */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 leading-none">Events & Reunions</h3>
                                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Stay connected</p>
                                    </div>
                                </div>
                                <p className="text-[13px] text-gray-500 leading-relaxed max-w-md mb-3">
                                    Stay in the loop on homecoming galas, batch reunions, and exclusive networking nights for PLP alumni.
                                </p>
                            </div>

                            {/* Right: mini event cards */}
                            <div className="grid grid-cols-2 gap-3 sm:w-72 shrink-0">
                                <div className="p-3.5 rounded-xl border border-gray-100/80 bg-gradient-to-br from-white to-gray-50/80 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Oct 18</p>
                                    </div>
                                    <p className="text-[12px] font-bold text-gray-900 leading-snug mb-2.5">Homecoming Gala</p>
                                    <div className="flex -space-x-1.5">
                                        <div className="h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br from-emerald-300 to-emerald-500" />
                                        <div className="h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-amber-500" />
                                        <div className="h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br from-blue-300 to-blue-500" />
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl border border-gray-100/80 bg-gradient-to-br from-white to-gray-50/80 shadow-sm opacity-85">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Nov 22</p>
                                    </div>
                                    <p className="text-[12px] font-bold text-gray-900 leading-snug mb-2.5">Career Mixer</p>
                                    <div className="flex -space-x-1.5">
                                        <div className="h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br from-indigo-300 to-indigo-500" />
                                        <div className="h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br from-pink-300 to-pink-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                </div>
            </div>
        </section>
    );
}
