import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ArrowRight, Briefcase, Users, Zap } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-emerald-50/50 pt-0 pb-12 lg:pt-10 lg:pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                            Elevating <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">PLP Graduates</span> to Global Heights
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-xl border-l-4 border-emerald-500/30 pl-6">
                            The P.A.C.E. system bridges <span className="font-semibold text-slate-900">Pamantasan ng Lungsod ng Pasig</span> alumni with premium career opportunities, strategic industry partnerships, and a thriving professional network.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/dashboard/alumni">
                                <Button size="lg" className="h-14 px-8 text-base bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 rounded-lg font-semibold group">
                                    Access Portal
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="#features">
                                <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg font-medium">
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="lg:w-1/2 relative lg:h-[550px] w-full flex items-center justify-center pt-8 pr-4"> {/* Added padding to prevent clip */}
                        {/* Abstract decorative background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-emerald-200/40 via-transparent to-amber-100/40 blur-3xl rounded-full -z-10" />

                        {/* Main Dashboard Mockup Interface */}
                        <div className="relative w-full max-w-[500px] aspect-[4/3] bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-700 delay-200">
                            {/* Mockup Window Controls */}
                            <div className="h-3 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                            </div>

                            {/* Mockup Main Content */}
                            <div className="flex h-full">

                                {/* Mockup Sidebar */}
                                <div className="w-16 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-6 gap-6">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <Zap className="h-4 w-4" strokeWidth={2} />
                                    </div>
                                    <div className="w-full px-4 space-y-4">
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                                    </div>
                                </div>

                                {/* Mockup Body */}
                                <div className="flex-1 p-6 bg-white">
                                    {/* Header Mock */}
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <div className="h-4 w-32 bg-slate-800 rounded-md mb-2" />
                                            <div className="h-3 w-48 bg-slate-300 rounded-md" />
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-slate-100" />
                                    </div>

                                    {/* Job Cards List Mock */}
                                    <div className="space-y-4">
                                        {/* Job Item 1 */}
                                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-emerald-100 transition-colors flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Briefcase size={18} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="h-3 w-24 bg-slate-800 rounded-full" />
                                                <div className="h-2 w-16 bg-slate-400 rounded-full" />
                                            </div>
                                        </div>

                                        {/* Job Item 2 */}
                                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4 opacity-75">
                                            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                <Briefcase size={18} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="h-3 w-28 bg-slate-800 rounded-full" />
                                                <div className="h-2 w-20 bg-slate-400 rounded-full" />
                                            </div>
                                        </div>

                                        {/* Job Item 3 */}
                                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4 opacity-50">
                                            <div className="h-10 w-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                                                <Briefcase size={18} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="h-3 w-20 bg-slate-800 rounded-full" />
                                                <div className="h-2 w-14 bg-slate-400 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card: Career Match */}
                        <div className="absolute top-[10%] -right-4 lg:right-0 z-20 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                            <div className="w-48 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 animate-bounce-slow">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                                        <Briefcase size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Job Alerts</p>
                                        <p className="text-sm font-bold text-slate-900 leading-snug">New Roles Available</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card: Stats */}
                        <div className="absolute bottom-[10%] -left-8 lg:-left-12 bg-white p-5 rounded-2xl shadow-xl shadow-emerald-900/5 border border-slate-100 animate-in slide-in-from-left-4 fade-in duration-1000 delay-500 z-20">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                                    <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-300" />
                                    <div className="h-10 w-10 rounded-full border-2 border-white bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Users size={16} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-slate-900 leading-none mb-1">Alumni Network</p>
                                    <p className="text-xs text-slate-500 font-medium">Connect with peers</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
