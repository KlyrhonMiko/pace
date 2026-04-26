"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, X, Upload, CheckCircle2 } from "lucide-react";

interface ResumeUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File | null) => void;
    isApplying: boolean;
}

export function ResumeUploadModal({ isOpen, onClose, onConfirm, isApplying }: ResumeUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
                <div className="bg-slate-50 border-b border-slate-100 p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-slate-900">Attach Resume</DialogTitle>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            An attached resume helps employers understand your qualifications better.
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-8">
                    <label
                        htmlFor="resume-upload-modal"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                            ${isDragging
                                ? "bg-emerald-50 border-emerald-400 scale-[1.02] shadow-inner"
                                : selectedFile
                                    ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"}
                        `}
                    >
                        <input
                            type="file"
                            id="resume-upload-modal"
                            className="sr-only"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                        />

                        {selectedFile ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                                    <CheckCircle2 className="h-7 w-7" />
                                </div>
                                <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                                    {selectedFile.name}
                                </span>
                                <span className="text-xs text-slate-500 mt-1">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <div className="h-14 w-14 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="h-7 w-7" />
                                </div>
                                <span className="font-semibold text-slate-900">Click to upload or drag and drop</span>
                                <span className="text-xs text-slate-500 mt-1">
                                    PDF, DOC, or DOCX (Max 5MB)
                                </span>
                            </div>
                        )}
                    </label>

                    {selectedFile && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(null);
                            }}
                            className="mt-4 text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 mx-auto transition-colors"
                        >
                            <X className="h-3 w-3" /> Remove file
                        </button>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sm:gap-0 sm:justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(selectedFile)}
                        disabled={isApplying}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        {isApplying ? "Applying..." : selectedFile ? "Attach & Apply" : "Apply Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
