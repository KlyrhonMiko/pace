"use client";

import { Database, Download, Trash2, History, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface TransactionLog {
    tl_id: string;
    tl_name: string;
    tl_date: string;
    performed_by: string | null;
    before: unknown;
    after: unknown;
}

function logsToCSV(logs: TransactionLog[]): string {
    const headers = ["ID", "Action", "Date", "Performed By", "Before", "After"];
    const rows = logs.map((l) => [
        l.tl_id,
        l.tl_name,
        l.tl_date,
        l.performed_by ?? "",
        l.before ? JSON.stringify(l.before) : "",
        l.after ? JSON.stringify(l.after) : "",
    ]);

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [headers, ...rows].map((row) => row.map(String).map(escape).join(",")).join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function formatNow(): string {
    return new Date().toLocaleString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const LAST_EXPORT_KEY = "pace_admin_last_export";

export function SystemData() {
    const [isExporting, setIsExporting] = useState(false);
    const [lastExport, setLastExport] = useState<string>(
        () => (typeof window !== "undefined" ? localStorage.getItem(LAST_EXPORT_KEY) ?? "Never" : "Never")
    );

    // Purge dialog state
    const [purgeOpen, setPurgeOpen] = useState(false);
    const [purgeInput, setPurgeInput] = useState("");
    const [isPurging, setIsPurging] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch all logs (no limit)
            const res = await apiFetch<{ data: { transaction_logs: TransactionLog[] } }>(
                "/transaction-logs?limit=0&skip=0"
            );
            const logs = res.data?.transaction_logs ?? [];

            if (logs.length === 0) {
                toast.info("No transaction logs to export.");
                return;
            }

            const csv = logsToCSV(logs);
            const filename = `pace_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            downloadFile(csv, filename, "text/csv;charset=utf-8;");

            const ts = formatNow();
            setLastExport(ts);
            localStorage.setItem(LAST_EXPORT_KEY, ts);
            toast.success(`Exported ${logs.length} records to ${filename}`);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePurge = async () => {
        if (purgeInput !== "PURGE") return;
        setIsPurging(true);
        try {
            const res = await apiFetch<{ data: { purged_count: number } }>("/transaction-logs/purge", {
                method: "DELETE",
            });
            const count = res.data?.purged_count ?? 0;
            toast.success(`Purged ${count} audit log record${count !== 1 ? "s" : ""}`);
            setPurgeOpen(false);
            setPurgeInput("");
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Purge failed. Please try again.");
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Database className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">System Data Management</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Export audit logs and manage system data</p>
                </div>
            </div>

            <div className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Export Section */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100/80 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Download className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-gray-800">Export Audit Logs</h4>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Download all transaction logs as CSV</p>
                                </div>
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-[11px] font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                {isExporting ? "Exporting…" : "Export to CSV"}
                            </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100/60">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <History className="w-3.5 h-3.5 text-gray-400" />
                                <span>Last export: <span className="font-bold text-gray-700">{lastExport}</span></span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Real-time Data
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="p-5 rounded-2xl bg-rose-50/30 border border-rose-100/50 flex flex-col justify-between">
                        <div>
                            <h4 className="text-[13px] font-bold text-rose-900">Danger Zone</h4>
                            <p className="text-[11px] text-rose-600/70 mt-1 leading-relaxed">
                                Permanently removes all audit log records from the platform.
                            </p>
                        </div>
                        <button
                            onClick={() => { setPurgeOpen(true); setPurgeInput(""); }}
                            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-50 transition-all shadow-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Purge Audit Logs
                        </button>
                    </div>
                </div>
            </div>

            {/* Purge Confirmation Dialog */}
            {purgeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                                <AlertTriangle className="w-5 h-5" strokeWidth={1.8} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-rose-900">Purge All Audit Logs</h3>
                                <p className="text-[11px] text-rose-500 mt-0.5">This action cannot be undone</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-[13px] text-gray-600 leading-relaxed">
                                This will permanently delete <span className="font-bold text-gray-900">all transaction log records</span> from the platform. Consider exporting first.
                            </p>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                    Type <span className="font-mono text-rose-600">PURGE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={purgeInput}
                                    onChange={(e) => setPurgeInput(e.target.value)}
                                    placeholder="PURGE"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => { setPurgeOpen(false); setPurgeInput(""); }}
                                disabled={isPurging}
                                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePurge}
                                disabled={purgeInput !== "PURGE" || isPurging}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isPurging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {isPurging ? "Purging…" : "Confirm Purge"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
