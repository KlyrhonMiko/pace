import { Eye, Bookmark } from "lucide-react";

export default function StatsGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">

            {/* Profile Views */}
            <div className="group relative rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                        <Eye className="h-5 w-5" />
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
                        <Bookmark className="h-5 w-5" />
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
