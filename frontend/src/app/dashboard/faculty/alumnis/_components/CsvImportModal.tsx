"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Download,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  parseCsvText,
  downloadCsvTemplate,
  importAlumniCsv,
  type ParsedRow,
  type CsvRowResult,
  type CsvImportResponse,
} from "../_lib/alumni-csv-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "upload" | "review" | "importing" | "results";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBadge({ step, current }: { step: Step; current: Step }) {
  const steps: Step[] = ["upload", "review", "importing", "results"];
  const labels: Record<Step, string> = {
    upload: "Upload",
    review: "Review",
    importing: "Import",
    results: "Results",
  };
  const idx = steps.indexOf(step);
  const curIdx = steps.indexOf(current);
  const done = idx < curIdx;
  const active = idx === curIdx;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          done
            ? "bg-emerald-600 text-white"
            : active
            ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
      </div>
      <span
        className={`text-xs font-semibold ${
          active ? "text-emerald-700" : done ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {labels[step]}
      </span>
    </div>
  );
}

function PreviewTable({
  rows,
  maxVisible = 10,
}: {
  rows: ParsedRow[];
  maxVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, maxVisible);
  const valid = rows.filter((r) => r.errors.length === 0).length;
  const invalid = rows.length - valid;

  return (
    <div className="space-y-3">
      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {valid} valid
        </span>
        {invalid > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            {invalid} with errors
          </span>
        )}
        <span className="text-xs text-slate-400">{rows.length} total rows</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-12">#</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Email</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Student ID</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Course</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => {
                const ok = row.errors.length === 0;
                return (
                  <tr
                    key={row.rowNum}
                    className={`transition-colors ${
                      ok ? "bg-white hover:bg-slate-50" : "bg-red-50/60 hover:bg-red-50"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-slate-400 font-mono">{row.rowNum}</td>
                    <td className="px-3 py-2.5 text-slate-700 font-medium truncate max-w-[140px]">
                      {row.data?.email ?? <span className="text-red-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 truncate max-w-[120px]">
                      {row.data
                        ? `${row.data.first_name} ${row.data.last_name}`
                        : <span className="text-red-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {row.data?.student_id ?? <span className="text-red-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {row.data?.course_abbv ?? <span className="text-red-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {ok ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-red-600 font-semibold cursor-help"
                          title={row.errors.join(" | ")}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          {row.errors.length} error{row.errors.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > maxVisible && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5" /> Show all {rows.length} rows
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultsTable({ results }: { results: CsvRowResult[] }) {
  const [expanded, setExpanded] = useState(false);
  const maxVisible = 15;
  const visible = expanded ? results : results.slice(0, maxVisible);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-12">Row</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Email</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Username</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Result</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r) => (
              <tr
                key={r.row}
                className={r.success ? "bg-white hover:bg-emerald-50/30" : "bg-red-50/60 hover:bg-red-50"}
              >
                <td className="px-3 py-2.5 text-slate-400 font-mono">{r.row}</td>
                <td className="px-3 py-2.5 text-slate-700 truncate max-w-[140px]">{r.email ?? "—"}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">{r.username ?? "—"}</td>
                <td className="px-3 py-2.5">
                  {r.success ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-500 max-w-[180px] truncate" title={r.message}>
                  {r.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {results.length > maxVisible && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? (
            <><ChevronDown className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronRight className="w-3.5 h-3.5" /> Show all {results.length} results</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CsvImportModal({ open, onOpenChange, onImportComplete }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<Step>("upload");
  const [importResult, setImportResult] = useState<CsvImportResponse | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const resetState = useCallback(() => {
    setFileName(null);
    setParsedRows([]);
    setStep("upload");
    setImportResult(null);
    setIsImporting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isImporting) return;
    resetState();
    onOpenChange(false);
  }, [isImporting, resetState, onOpenChange]);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsvText(text);
      if (rows.length === 0) {
        toast.error("File appears to be empty or has no data rows.");
        return;
      }
      if (rows.length > 2000) {
        toast.error("File has more than 2,000 rows. Please split it into smaller batches.");
        return;
      }
      setFileName(file.name);
      setParsedRows(rows);
      setStep("review");
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }
    setIsImporting(true);
    setStep("importing");
    try {
      const result = await importAlumniCsv(validRows.map((r) => r.data!));
      setImportResult(result);
      setStep("results");
      if (result.successful > 0) {
        onImportComplete();
        toast.success(`${result.successful} alumni registered successfully.`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} rows failed. Check the results table for details.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed. Please try again.";
      toast.error(msg);
      setStep("review");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={!isImporting}
        className="sm:max-w-3xl p-0 gap-0 rounded-2xl border-slate-100 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Mass Alumni Registration
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Upload a CSV to register alumni accounts in bulk. Credentials are auto-generated and emailed.
              </DialogDescription>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {(["upload", "review", "importing", "results"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <StepBadge step={s} current={step} />
                {i < 3 && <div className="h-px w-6 bg-slate-200 hidden sm:block" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">

          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 scale-[1.01]"
                    : "border-slate-200 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/30"
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-emerald-100" : "bg-white border border-slate-200 shadow-sm"}`}>
                  <Upload className={`w-7 h-7 ${isDragging ? "text-emerald-600" : "text-slate-400"}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Drag & drop your CSV here, or <span className="text-emerald-600">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Up to 2,000 rows · Max 5MB · .csv format only</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="csv-upload-input"
                />
              </div>

              {/* Download template */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">CSV Template</p>
                    <p className="text-xs text-slate-400">Download with all required columns pre-filled</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); downloadCsvTemplate(); }}
                  className="gap-2 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>

              {/* Required fields guide */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Required fields
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  All fields are required except <code className="bg-amber-100 px-1 rounded">middle_name</code>.
                  Gender must be one of: <code className="bg-amber-100 px-1 rounded">MALE</code>,{" "}
                  <code className="bg-amber-100 px-1 rounded">FEMALE</code>,{" "}
                  <code className="bg-amber-100 px-1 rounded">NON_BINARY</code>,{" "}
                  <code className="bg-amber-100 px-1 rounded">PREFER_NOT_TO_SAY</code>.
                  Birthdate format: <code className="bg-amber-100 px-1 rounded">YYYY-MM-DD</code>.
                  Boolean fields: <code className="bg-amber-100 px-1 rounded">true</code> or{" "}
                  <code className="bg-amber-100 px-1 rounded">false</code>.
                </p>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{fileName}</span>
                </div>
                <button
                  onClick={resetState}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Change file
                </button>
              </div>

              {invalidRows.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>{invalidRows.length} row{invalidRows.length === 1 ? "" : "s"} have errors</strong> and will be skipped.
                    Only the <strong>{validRows.length} valid row{validRows.length === 1 ? "" : "s"}</strong> will be imported.
                    Hover over the error count to see details.
                  </p>
                </div>
              )}

              <PreviewTable rows={parsedRows} />
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">Registering alumni…</p>
                <p className="text-xs text-slate-400 mt-1">
                  Processing {validRows.length} record{validRows.length === 1 ? "" : "s"}. This may take a moment.
                </p>
              </div>
            </div>
          )}

          {/* Results Step */}
          {step === "results" && importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-800">{importResult.total}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Rows</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{importResult.successful}</p>
                  <p className="text-xs text-emerald-600 mt-1">Registered</p>
                </div>
                <div className={`rounded-xl border p-4 text-center ${importResult.failed > 0 ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
                  <p className={`text-2xl font-bold ${importResult.failed > 0 ? "text-red-700" : "text-slate-400"}`}>
                    {importResult.failed}
                  </p>
                  <p className={`text-xs mt-1 ${importResult.failed > 0 ? "text-red-600" : "text-slate-400"}`}>Failed</p>
                </div>
              </div>

              {importResult.successful > 0 && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Credentials have been emailed to each registered alumni. They must change their username and password on first login.
                  </p>
                </div>
              )}

              <ResultsTable results={importResult.results} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isImporting}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {step === "results" ? "Close" : "Cancel"}
          </Button>

          <div className="flex items-center gap-2.5">
            {step === "review" && (
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                Register {validRows.length} Alumni
              </Button>
            )}
            {step === "results" && importResult && importResult.failed > 0 && (
              <Button
                variant="outline"
                onClick={resetState}
                className="text-sm font-semibold"
              >
                Import Another File
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
