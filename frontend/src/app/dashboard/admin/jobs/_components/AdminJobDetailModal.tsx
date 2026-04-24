"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, CircleDollarSign, Calendar, FileText, ExternalLink, Pencil, EyeOff, Eye, Building2, Briefcase, Trash2 } from "lucide-react";

interface AdminJobDetailModalProps {
    job: any;
    onClose: () => void;
    onEdit?: () => void;
    onToggleHide?: () => void;
    onDelete?: () => void;
}

export default function AdminJobDetailModal({ job, onClose, onEdit, onToggleHide, onDelete }: AdminJobDetailModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    if (!job) return null;

    const {
        title,
        company,
        location,
        salaryDisplay,
        type,
        postedDate,
        description,
        snippet,
        link,
        experienceLevel,
        workType,
        isActive,
        logo
    } = job;

    const getLogoGradient = () => {
        const charCode = logo?.charCodeAt(0) || 0;
        const gradients = [
            ["#8b5cf6", "#a855f7"],
            ["#3b82f6", "#06b6d4"],
            ["#059669", "#14b8a6"],
            ["#f43f5e", "#ec4899"],
            ["#f97316", "#ef4444"],
            ["#6366f1", "#3b82f6"],
            ["#f59e0b", "#f97316"],
        ];
        return gradients[charCode % gradients.length];
    };

    const [gradStart, gradEnd] = getLogoGradient();

    const modalContent = (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HERO HEADER */}
                <div
                    className="relative px-8 py-10 border-b border-gray-100 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradStart}08 0%, ${gradEnd}12 100%)` }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100/50 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all active:scale-95"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    <div className="relative flex items-center gap-4">
                        <div
                            className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-emerald-500/10 overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})` }}
                        >
                            {logo?.startsWith("http") ? (
                                <img src={logo} alt={company} className="w-full h-full object-cover" />
                            ) : (
                                logo || company?.charAt(0)
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-extrabold text-gray-900 leading-tight truncate">{title}</h2>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mt-1">{company}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Key Info Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center gap-1.5">
                            <MapPin size={18} className="text-emerald-600" />
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Location</span>
                            <span className="text-xs font-bold text-gray-900 truncate w-full">{location}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center gap-1.5">
                            <CircleDollarSign size={18} className="text-emerald-600" />
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Salary</span>
                            <span className="text-xs font-bold text-gray-900 truncate w-full">{salaryDisplay || "Undisclosed"}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center gap-1.5">
                            <Briefcase size={18} className="text-emerald-600" />
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Job Type</span>
                            <span className="text-xs font-bold text-gray-900">{type}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center gap-1.5">
                            <Calendar size={18} className="text-emerald-600" />
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Posted</span>
                            <span className="text-xs font-bold text-gray-900">{new Date(postedDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/30">
                            <Building2 size={20} className="text-emerald-700" />
                            <div>
                                <p className="text-[10px] uppercase text-emerald-600/70 font-bold tracking-wider">Work Setting</p>
                                <p className="text-sm font-bold text-gray-900">{workType || "Not specified"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/30">
                            <Briefcase size={20} className="text-emerald-700" />
                            <div>
                                <p className="text-[10px] uppercase text-emerald-600/70 font-bold tracking-wider">Experience</p>
                                <p className="text-sm font-bold text-gray-900">{experienceLevel || "Not specified"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} className="text-emerald-600" />
                            Job Description
                        </h3>
                        <div
                            className="text-sm leading-relaxed text-gray-600 space-y-4 prose prose-emerald max-w-none"
                            dangerouslySetInnerHTML={{ __html: description || snippet || "No detailed description available." }}
                        />
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 order-2 sm:order-1">
                        <button
                            onClick={onClose}
                            className="text-sm font-bold text-gray-400 hover:text-gray-600 px-4 py-2"
                        >
                            Close
                        </button>
                        {!onEdit && link && (
                            <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all"
                            >
                                Apply for this Position
                                <ExternalLink size={18} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}

function Button({ children, className, onClick, variant = "primary", ...props }: any) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center justify-center transition-all ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
