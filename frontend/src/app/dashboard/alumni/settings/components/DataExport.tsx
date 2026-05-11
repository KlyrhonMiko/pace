"use client";

import { useState, useRef } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { SettingsCard } from "./SettingsUI";
import { toast } from "sonner";
import { PDFExportRenderer, PDFExportHandle } from "./PDFExportRenderer";
import { getApiBaseUrl } from "@/lib/api-base-url";

export function DataExport() {
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const pdfRendererRef = useRef<PDFExportHandle>(null);

    const handleDownloadExcel = async () => {
        setIsDownloadingExcel(true);
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/alumni/me/export/excel`, {
                credentials: "include",
            });
            
            if (!response.ok) throw new Error("Failed to download data");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            let filename = "My_Pace_Data.xlsx";
            const disposition = response.headers.get("content-disposition");
            if (disposition && disposition.indexOf("filename=") !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success("Data export downloaded successfully");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to download data export");
        } finally {
            setIsDownloadingExcel(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!pdfRendererRef.current) return;
        setIsGeneratingPdf(true);
        try {
            await pdfRendererRef.current.generatePdf();
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <SettingsCard
            title="Data & Export"
            subtitle="Download or export your account data"
            icon={<Download size={18} />}
            iconContainerClass="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
        >
            <div className="flex flex-col sm:flex-row gap-3 py-3">
                <button 
                    onClick={handleDownloadExcel}
                    disabled={isDownloadingExcel || isGeneratingPdf}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex-1 disabled:opacity-50"
                >
                    {isDownloadingExcel ? (
                        <Loader2 size={16} className="text-gray-500 animate-spin" />
                    ) : (
                        <Download size={16} className="text-gray-500" />
                    )}
                    {isDownloadingExcel ? "Exporting..." : "Download My Data"}
                </button>
                <button 
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf || isDownloadingExcel}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex-1 disabled:opacity-50"
                >
                    {isGeneratingPdf ? (
                        <Loader2 size={16} className="text-gray-500 animate-spin" />
                    ) : (
                        <FileText size={16} className="text-gray-500" />
                    )}
                    {isGeneratingPdf ? "Generating..." : "Export Profile as PDF"}
                </button>
            </div>
            <p className="text-xs text-gray-400 pb-3 leading-relaxed">
                Your data will be compiled and available for download. This may take a few moments.
            </p>

            <PDFExportRenderer ref={pdfRendererRef} />
        </SettingsCard>
    );
}
