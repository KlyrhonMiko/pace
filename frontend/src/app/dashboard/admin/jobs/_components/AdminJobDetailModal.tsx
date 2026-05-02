"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, CircleDollarSign, Calendar, ExternalLink, Link as LinkIcon, Briefcase, Building2, FileText, Pencil, EyeOff, Eye, Trash2 } from "lucide-react";

interface AdminJobDetailModalProps {
    job: any;
    onClose: () => void;
    onToggleHide?: (job: any) => void;
    onDelete?: (job: any) => void;
}

export default function AdminJobDetailModal({ job, onClose, onToggleHide, onDelete }: AdminJobDetailModalProps) {
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

    const getBadgeColors = () => {
        switch (type?.toLowerCase()) {
            case "full-time":
                return { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", dot: "#10b981" };
            case "internship":
                return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" };
            case "part-time":
                return { bg: "#fffbeb", text: "#b45309", border: "#fde68a", dot: "#f59e0b" };
            default:
                return { bg: "#f8fafc", text: "#475569", border: "#e2e8f0", dot: "#94a3b8" };
        }
    };

    const badgeColors = getBadgeColors();

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
    const hasImageLogo = !!(logo && (logo.startsWith("http") || logo.startsWith("/")));
    const fullDescription = description || snippet || "";

    const formattedDate = (() => {
        try {
            return new Date(postedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "Recently";
        }
    })();

    const infoItems = [
        {
            icon: <MapPin className="w-[15px] h-[15px]" strokeWidth={2} />,
            label: "Location",
            value: location || "—",
        },
        {
            icon: <CircleDollarSign className="w-[15px] h-[15px]" strokeWidth={2} />,
            label: "Salary",
            value: salaryDisplay || "—",
        },
        {
            icon: <Calendar className="w-[15px] h-[15px]" strokeWidth={2} />,
            label: "Posted",
            value: formattedDate,
        },
    ];

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
                backgroundColor: "rgba(15, 23, 42, 0.55)",
                backdropFilter: "blur(10px) saturate(140%)",
                WebkitBackdropFilter: "blur(10px) saturate(140%)",
                animation: "jdmOverlayIn 0.2s ease-out",
            }}
        >
            <style>{`
                @keyframes jdmOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes jdmModalIn {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .jdm-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .jdm-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .jdm-scroll::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 3px;
                }
                .jdm-scroll::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                .jdm-cta {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .jdm-cta:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 12px 24px -8px rgba(5, 150, 105, 0.45), 0 4px 8px -2px rgba(0,0,0,0.08) !important;
                }
                .jdm-cta:active {
                    transform: translateY(0);
                }
                .jdm-close-btn {
                    transition: background-color 0.2s ease, color 0.2s ease;
                }
                .jdm-close-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }
                .jdm-secondary-btn {
                    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
                }
                .jdm-secondary-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                }
                .jdm-danger-btn:hover {
                    background: #fef2f2;
                    border-color: #fecaca;
                    color: #dc2626;
                }
                .jdm-description p { margin: 0 0 12px; }
                .jdm-description p:last-child { margin-bottom: 0; }
                .jdm-description ul, .jdm-description ol { margin: 0 0 12px; padding-left: 20px; }
                .jdm-description li { margin-bottom: 6px; }
                .jdm-description strong, .jdm-description b { color: #0f172a; font-weight: 600; }
                .jdm-description a { color: #059669; text-decoration: underline; text-underline-offset: 2px; }
                .jdm-kbd {
                    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    box-shadow: 0 1px 0 #e2e8f0;
                }
            `}</style>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "680px",
                    maxHeight: "90vh",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "#ffffff",
                    boxShadow:
                        "0 40px 80px -20px rgba(15, 23, 42, 0.35), 0 10px 24px -8px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.04)",
                    animation: "jdmModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >

                {/* ═══════════════ HEADER ═══════════════ */}
                <div
                    style={{
                        position: "relative",
                        padding: "24px 28px 22px",
                        background: "#ffffff",
                        borderBottom: "1px solid #f1f5f9",
                        flexShrink: 0,
                    }}
                >
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
                            height: "32px",
                            width: "32px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            background: "transparent",
                            color: "#94a3b8",
                        }}
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={2.25} />
                    </button>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "16px",
                            paddingRight: "36px",
                        }}
                    >
                        {/* Logo */}
                        <div
                            style={{
                                flexShrink: 0,
                                width: "56px",
                                height: "56px",
                                borderRadius: "12px",
                                background: hasImageLogo
                                    ? "#ffffff"
                                    : `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "22px",
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                                overflow: "hidden",
                                border: hasImageLogo ? "1px solid #e2e8f0" : "none",
                                boxShadow: hasImageLogo
                                    ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                                    : `0 6px 16px -4px ${gradStart}55`,
                            }}
                        >
                            {hasImageLogo ? (
                                <img
                                    src={logo}
                                    alt={company}
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                            ) : (
                                logo || company?.charAt(0).toUpperCase()
                            )}
                        </div>

                        {/* Title block */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: "20px",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        lineHeight: 1.25,
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                                    {title}
                                </h2>
                                {!isActive && (
                                    <span style={{
                                        display: "inline-flex",
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        background: "#fee2e2",
                                        color: "#dc2626",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}>
                                        Inactive
                                    </span>
                                )}
                            </div>

                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginTop: "6px",
                                }}
                            >
                                <Building2 className="w-[13px] h-[13px]" strokeWidth={2} style={{ color: "#94a3b8" }} />
                                <span
                                    style={{
                                        fontSize: "13px",
                                        color: "#475569",
                                        fontWeight: 500,
                                    }}
                                >
                                    {company}
                                </span>
                            </div>

                            {/* Badges */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "3px 10px 3px 8px",
                                        borderRadius: "999px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        background: badgeColors.bg,
                                        color: badgeColors.text,
                                        border: `1px solid ${badgeColors.border}`,
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
                                    {type}
                                </span>
                                {workType && (
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            padding: "3px 10px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            background: "#f8fafc",
                                            color: "#475569",
                                            border: "1px solid #e2e8f0",
                                        }}
                                    >
                                        {workType}
                                    </span>
                                )}
                                {experienceLevel && (
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            padding: "3px 10px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            background: "#f8fafc",
                                            color: "#475569",
                                            border: "1px solid #e2e8f0",
                                        }}
                                    >
                                        {experienceLevel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ KEY DETAILS BAR ═══════════════ */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        background: "#fafbfc",
                        borderBottom: "1px solid #f1f5f9",
                        flexShrink: 0,
                    }}
                >
                    {infoItems.map((item, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                padding: "14px 20px",
                                borderRight: i < infoItems.length - 1 ? "1px solid #f1f5f9" : "none",
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    color: "#94a3b8",
                                }}
                            >
                                {item.icon}
                                <span
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    {item.label}
                                </span>
                            </div>
                            <span
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    lineHeight: 1.35,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                                title={item.value}
                            >
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
                        padding: "24px 28px 28px",
                        minHeight: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "14px",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#0f172a",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}
                        >
                            About this role
                        </h3>
                    </div>

                    {fullDescription ? (
                        <div
                            className="jdm-description"
                            style={{
                                fontSize: "14px",
                                lineHeight: 1.7,
                                color: "#334155",
                                wordBreak: "break-word",
                            }}
                            dangerouslySetInnerHTML={{ __html: fullDescription }}
                        />
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "32px 0 16px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    background: "#f8fafc",
                                    border: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "12px",
                                }}
                            >
                                <Briefcase className="w-5 h-5" strokeWidth={1.5} style={{ color: "#cbd5e1" }} />
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: "#64748b",
                                    maxWidth: "320px",
                                    lineHeight: 1.5,
                                }}
                            >
                                No description provided. View the original posting for full details.
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
                        gap: "12px",
                        padding: "14px 20px 14px 28px",
                        borderTop: "1px solid #f1f5f9",
                        background: "#fafbfc",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: "#94a3b8",
                        }}
                    >
                        <span className="jdm-kbd">Esc</span>
                        <span>to close</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            onClick={onClose}
                            className="jdm-secondary-btn"
                            style={{
                                padding: "8px 16px",
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#475569",
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>

                        <div style={{ display: "flex", gap: "8px", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", marginLeft: "4px" }}>

                            {onToggleHide && (
                                <button
                                    onClick={() => onToggleHide(job)}
                                    className="jdm-secondary-btn"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 12px",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#b45309",
                                        background: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        cursor: "pointer",
                                    }}
                                >
                                    {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {isActive ? "Hide" : "Show"}
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(job)}
                                    className="jdm-secondary-btn jdm-danger-btn"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 12px",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#dc2626",
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            )}
                            {link && (
                                <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="jdm-cta"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 18px",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#ffffff",
                                        background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                                        border: "none",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        boxShadow: "0 6px 16px -4px rgba(5, 150, 105, 0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    Original Post
                                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}
