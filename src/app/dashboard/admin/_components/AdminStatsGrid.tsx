"use client";

export default function AdminStatsGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        +48
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">1,247</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Total Users</p>
                {/* Mini sparkline */}
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[3, 5, 4, 7, 6, 8, 9, 7, 10, 12].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-emerald-100 group-hover:bg-emerald-200 transition-colors" style={{ height: `${(v / 12) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Alumni */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        +32
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">892</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Verified Alumni</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[4, 6, 5, 8, 7, 9, 8, 10, 9, 11].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-blue-100 group-hover:bg-blue-200 transition-colors" style={{ height: `${(v / 12) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Active Jobs */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        +12
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">156</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Active Jobs</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[2, 4, 3, 5, 4, 6, 7, 5, 8, 9].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-violet-100 group-hover:bg-violet-200 transition-colors" style={{ height: `${(v / 10) * 100}%` }} />
                    ))}
                </div>
            </div>

            {/* Events */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        +5
                    </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">18</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Upcoming Events</p>
                <div className="flex items-end gap-[3px] mt-3 h-6">
                    {[1, 2, 1, 3, 2, 4, 3, 5, 4, 6].map((v, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-amber-100 group-hover:bg-amber-200 transition-colors" style={{ height: `${(v / 7) * 100}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
