export default function StatsGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Applications - with mini trend */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        +3
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">12</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Total Applications</p>
                {/* Mini sparkline */}
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[3, 5, 4, 7, 6, 8, 9, 7, 10, 12].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-blue-100 group-hover:bg-blue-200 transition-colors" style={{ height: `${(v / 12) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Interviews */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        +2
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">3</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Interviews Scheduled</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[1, 0, 1, 2, 1, 0, 2, 1, 3, 3].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-emerald-100 group-hover:bg-emerald-200 transition-colors" style={{ height: `${Math.max((v / 3) * 100, 8)}%` }} />
                    ))}
                </div>
            </div>

            {/* Profile Views */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +23%
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">156</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Profile Views</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[20, 35, 28, 42, 55, 48, 62, 70, 85, 100].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-violet-100 group-hover:bg-violet-200 transition-colors" style={{ height: `${(v / 100) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Saved Jobs */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        --
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">24</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Saved Jobs</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[15, 18, 16, 20, 19, 22, 21, 23, 24, 24].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-amber-100 group-hover:bg-amber-200 transition-colors" style={{ height: `${(v / 24) * 100}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
