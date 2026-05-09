"use client";

import { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Users, GraduationCap, Building2 } from "lucide-react";
import { getAlumniByAcademic, AlumniFullProfile } from "../../../_lib/academic";
import Avatar from "@/components/Avatar";
import { useCallback } from "react";

interface AlumniListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    course_abbv?: string;
    college_dept_abbv?: string;
}

export function AlumniListModal({ isOpen, onClose, title, course_abbv, college_dept_abbv }: AlumniListModalProps) {
    const [alumni, setAlumni] = useState<AlumniFullProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const limit = 5;

    const fetchAlumni = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getAlumniByAcademic({
                course_abbv,
                college_dept_abbv,
                limit,
                offset: page * limit
            });
            if (res.success) {
                setAlumni(res.data.alumni);
                setTotal(res.data.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch alumni:", error);
        } finally {
            setIsLoading(false);
        }
    }, [course_abbv, college_dept_abbv, page]);

    useEffect(() => {
        if (isOpen) {
            fetchAlumni();
        } else {
            setAlumni([]);
            setPage(0);
        }
    }, [isOpen, fetchAlumni]);

    const totalPages = Math.ceil(total / limit);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <Users size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900">
                                Alumni List
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 mt-0.5">
                                {course_abbv ? (
                                    <>
                                        <GraduationCap size={14} />
                                        Program: {title}
                                    </>
                                ) : (
                                    <>
                                        <Building2 size={14} />
                                        Department: {title}
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {isLoading && alumni.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                            <p className="text-sm font-bold text-gray-400">Loading graduates...</p>
                        </div>
                    ) : alumni.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <Users size={48} className="text-gray-200 mb-4" />
                            <p className="text-sm font-bold text-gray-500">No alumni records found</p>
                            <p className="text-xs text-gray-400 mt-1">There are no registered graduates under this program yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-3">
                                {alumni.map((person) => (
                                    <div 
                                        key={person.alumni_id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-600/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar 
                                                    name={`${person.first_name} ${person.last_name}`} 
                                                    className="h-12 w-12 rounded-xl border-2 border-white shadow-sm group-hover:scale-105 transition-transform" 
                                                />
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {person.first_name} {person.last_name}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{person.alumni_id}</span>
                                                    <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <span className="text-xs font-medium text-gray-500">Batch {person.year_graduated}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <p className="text-xs text-gray-400 font-bold">
                                        Total: <span className="text-gray-900">{total}</span> graduates
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            disabled={page === 0 || isLoading}
                                            onClick={() => setPage(p => p - 1)}
                                            className="h-8 text-xs font-bold rounded-lg"
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setPage(i)}
                                                    className={`h-6 w-6 rounded-md text-[10px] font-bold transition-all ${
                                                        page === i 
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                                            : "text-gray-400 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            disabled={page >= totalPages - 1 || isLoading}
                                            onClick={() => setPage(p => p + 1)}
                                            className="h-8 text-xs font-bold rounded-lg"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
