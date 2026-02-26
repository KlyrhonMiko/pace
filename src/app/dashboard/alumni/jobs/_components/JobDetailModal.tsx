"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface JobDetailModalProps {
    job: {
        id: number | string;
        title: string;
        company: string;
        location: string;
        salary: number;
        salaryDisplay: string;
        type: string;
        postedDate: Date;
        logo: string;
        experienceLevel: string;
        workType: string;
        link?: string;
        snippet?: string;
        description?: string;
    };
    onClose: () => void;
}

export default function JobDetailModal({ job, onClose }: JobDetailModalProps) {
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

    const getBadgeColors = () => {
        switch (job.type.toLowerCase()) {
            case "full-time":
                return { bg: "rgba(16, 185, 129, 0.15)", text: "#059669", dot: "#10b981" };
            case "internship":
                return { bg: "rgba(59, 130, 246, 0.15)", text: "#2563eb", dot: "#3b82f6" };
            case "part-time":
                return { bg: "rgba(245, 158, 11, 0.15)", text: "#d97706", dot: "#f59e0b" };
            default:
                return { bg: "rgba(100, 116, 139, 0.15)", text: "#475569", dot: "#94a3b8" };
        }
    };

    const badgeColors = getBadgeColors();

    const getLogoGradient = () => {
        const charCode = job.logo.charCodeAt(0);
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
    const fullDescription = job.description || job.snippet || "";

    const formattedDate = (() => {
        try {
            return new Date(job.postedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "Recently";
        }
    })();

    const modalContent = (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                animation: "jdmOverlayIn 0.2s ease-out",
            }}
        >
            <style>{`
                @keyframes jdmOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes jdmModalIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .jdm-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .jdm-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .jdm-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .jdm-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .jdm-cta {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .jdm-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px -5px rgba(5, 150, 105, 0.5), 0 4px 10px -3px rgba(0,0,0,0.1) !important;
                }
                .jdm-close-btn {
                    transition: all 0.2s ease;
                }
                .jdm-close-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: rotate(90deg);
                }
                .jdm-info-card {
                    transition: all 0.2s ease;
                }
                .jdm-info-card:hover {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }
            `}</style>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "720px",
                    maxHeight: "90vh",
                    borderRadius: "20px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "#ffffff",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)",
                    animation: "jdmModalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                {/* ═══════════════ HERO HEADER ═══════════════ */}
                <div
                    style={{
                        position: "relative",
                        padding: "32px 32px 28px",
                        background: `linear-gradient(135deg, ${gradStart}08 0%, ${gradEnd}12 100%)`,
                        borderBottom: "1px solid #f1f5f9",
                        flexShrink: 0,
                    }}
                >
                    {/* Subtle pattern overlay */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.03,
                            backgroundImage:
                                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                            backgroundSize: "24px 24px",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="jdm-close-btn"
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "36px",
                            width: "36px",
                            borderRadius: "12px",
                            border: "none",
                            cursor: "pointer",
                            background: "rgba(0,0,0,0.05)",
                            color: "#64748b",
                        }}
                        aria-label="Close"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Logo + Title */}
                    <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "16px", paddingRight: "40px" }}>
                        <div
                            style={{
                                flexShrink: 0,
                                width: "56px",
                                height: "56px",
                                borderRadius: "16px",
                                background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "22px",
                                fontWeight: 700,
                                boxShadow: `0 8px 20px -4px ${gradStart}50`,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {job.logo}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "1.35rem",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    lineHeight: 1.3,
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {job.title}
                            </h2>
                            <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>
                                {job.company}
                            </p>

                            {/* Badges */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "5px 12px",
                                        borderRadius: "8px",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        background: badgeColors.bg,
                                        color: badgeColors.text,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: "6px",
                                            height: "6px",
                                            borderRadius: "50%",
                                            background: badgeColors.dot,
                                        }}
                                    />
                                    {job.type}
                                </span>
                                {job.workType && (
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "5px 12px",
                                            borderRadius: "8px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            background: "#f1f5f9",
                                            color: "#475569",
                                        }}
                                    >
                                        {job.workType}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ INFO CARDS ROW ═══════════════ */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "0",
                        borderBottom: "1px solid #f1f5f9",
                        flexShrink: 0,
                    }}
                >
                    {[
                        {
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <circle cx="12" cy="11" r="3" />
                                </svg>
                            ),
                            label: "Location",
                            value: job.location,
                        },
                        {
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            ),
                            label: "Salary",
                            value: job.salaryDisplay,
                        },
                        {
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            ),
                            label: "Posted",
                            value: formattedDate,
                        },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="jdm-info-card"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                                padding: "18px 12px",
                                borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
                                cursor: "default",
                            }}
                        >
                            {item.icon}
                            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                                {item.label}
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", textAlign: "center", lineHeight: 1.3 }}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ═══════════════ DESCRIPTION ═══════════════ */}
                <div
                    className="jdm-scroll"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "28px 32px",
                        minHeight: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                        <div
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Job Description
                        </h3>
                    </div>

                    {fullDescription ? (
                        <div
                            style={{
                                fontSize: "14px",
                                lineHeight: 1.8,
                                color: "#475569",
                                wordBreak: "break-word",
                            }}
                            dangerouslySetInnerHTML={{ __html: fullDescription }}
                        />
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", textAlign: "center" }}>
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "14px",
                                    background: "#f8fafc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "12px",
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                No description available — view the original posting for full details.
                            </p>
                        </div>
                    )}
                </div>

                {/* ═══════════════ FOOTER ═══════════════ */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 32px",
                        borderTop: "1px solid #f1f5f9",
                        background: "#fafbfc",
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#64748b",
                            background: "transparent",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f1f5f9";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                    >
                        Close
                    </button>

                    {job.link ? (
                        <a
                            href={job.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jdm-cta"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 24px",
                                borderRadius: "12px",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#ffffff",
                                background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #059669 100%)",
                                backgroundSize: "200% 200%",
                                border: "none",
                                textDecoration: "none",
                                cursor: "pointer",
                                boxShadow: "0 4px 14px -3px rgba(5, 150, 105, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                                letterSpacing: "0.01em",
                            }}
                        >
                            View Original Posting
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </a>
                    ) : (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 20px",
                                borderRadius: "12px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#94a3b8",
                                background: "#f1f5f9",
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                            </svg>
                            No link available
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}
