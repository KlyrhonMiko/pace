"use client";

import { Search, SlidersHorizontal, Plus, Loader2 } from "lucide-react";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";

interface EventFiltersProps {
    searchQuery: string;
    handleSearch: (query: string) => void;
    openCreateModal: () => void;
    isLoading: boolean;
}

export default function EventFilters({
    searchQuery,
    handleSearch,
    openCreateModal,
    isLoading,
}: EventFiltersProps) {
    return (
        <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Actions & Filters
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Manage event visibility
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Create Button */}
                    <Button
                        onClick={openCreateModal}
                        className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 gap-2"
                    >
                        <Plus className="h-5 w-5" strokeWidth={3} />
                        Create New Event
                    </Button>

                    <div className="h-px bg-slate-100 my-2" />

                    {/* Search Bar */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Events</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search event name..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:border-emerald-600 focus-visible:ring-emerald-700/20 rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
