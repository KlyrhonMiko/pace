"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { AtsResumeTemplate, ResumeData, emptyResumeData } from "./AtsResumeTemplate";
import { getMyProfile } from "@/app/dashboard/alumni/profile/_lib/api";

export default function ResumeBuilder() {
    const [data, setData] = useState<ResumeData>(emptyResumeData);
    const [isParsing, setIsParsing] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getMyProfile();
                if (profile) {
                    // Extract start year from alumni_id or student_id (e.g., "23-00790" -> "2023")
                    let startYear = "";
                    const idsToTry = [profile.student_id, profile.alumni_id].filter(Boolean);

                    for (const id of idsToTry) {
                        const strId = String(id).trim();
                        // Look for a 2-digit year at the start, possibly followed by a hyphen
                        const match = strId.match(/^(\d{2})/);
                        if (match) {
                            startYear = `20${match[1]}`;
                            break;
                        }
                    }

                    // Create a default education entry if we have some info
                    const defaultEdu = {
                        institution: "Pamantasan ng Lungsod ng Pasig",
                        degree: "Bachelor's Degree",
                        field: profile.course_name || "",
                        startDate: startYear,
                        endDate: profile.year_graduated?.toString() || "",
                    };

                    setData(prev => ({
                        ...prev,
                        personal: {
                            ...prev.personal,
                            firstName: profile.first_name || "",
                            lastName: profile.last_name || "",
                            email: profile.email || "",
                        },
                        education: [defaultEdu]
                    }));
                }
            } catch (error) {
                console.error("Failed to load profile for resume:", error);
            } finally {
                setIsLoadingProfile(false);
            }
        }
        loadProfile();
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `${data.personal.firstName || "Generated"}_${data.personal.lastName || "Resume"}`,
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const toastId = toast.loading("Parsing resume with AI...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to parse resume");
            }

            const parsed: Partial<ResumeData> = await res.json();

            setData((prev) => {
                const newPersonal = { ...prev.personal, ...(parsed.personal || {}) };
                return {
                    ...prev,
                    personal: {
                        firstName: newPersonal.firstName || "",
                        lastName: newPersonal.lastName || "",
                        email: newPersonal.email || "",
                        phone: newPersonal.phone || "",
                        location: newPersonal.location || "",
                        summary: newPersonal.summary || "",
                    },
                    education: parsed.education?.length ? parsed.education : prev.education,
                    experience: parsed.experience?.length ? parsed.experience : prev.experience,
                    skills: parsed.skills?.length ? parsed.skills : prev.skills,
                }
            });

            toast.success("Resume parsed successfully!", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Failed to parse resume", { id: toastId });
            console.error(error);
        } finally {
            setIsParsing(false);
            if (e.target) e.target.value = '';
        }
    };

    const handlePersonalChange = (field: keyof ResumeData["personal"], value: string) => {
        setData((prev) => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
    };

    const handleArrayAdd = (field: "education" | "experience") => {
        setData((prev) => ({
            ...prev,
            [field]: [
                ...prev[field],
                field === "education"
                    ? { institution: "", degree: "", field: "", startDate: "", endDate: "" }
                    : { company: "", position: "", title: "", startDate: "", endDate: "", description: "" }
            ] as any,
        }));
    };

    const handleArrayUpdate = (field: "education" | "experience", index: number, itemField: string, value: string) => {
        setData((prev) => {
            const newArray = [...prev[field]];
            newArray[index] = { ...newArray[index], [itemField]: value };
            return { ...prev, [field]: newArray as any };
        });
    };

    const handleArrayRemove = (field: "education" | "experience", index: number) => {
        setData((prev) => {
            const newArray = [...prev[field]];
            newArray.splice(index, 1);
            return { ...prev, [field]: newArray as any };
        });
    };

    const handleSkillsChange = (value: string) => {
        setData((prev) => ({ ...prev, skills: value.split(",").map(s => s.trim()).filter(Boolean) }));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[800px]">

            {/* Editor Column */}
            <div className="w-full lg:w-1/2 flex flex-col space-y-6 overflow-y-auto pr-4 custom-scrollbar">

                {/* Actions header */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                    <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-900">ATS Resume Generator</h3>
                        <p className="text-xs text-gray-500 mt-1">Upload an existing PDF or fill manually.</p>
                    </div>
                    <div className="flex space-x-2">
                        <label className="relative cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span>{isParsing ? "Parsing..." : "AI Parse PDF"}</span>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="absolute invisible"
                                onChange={handleFileUpload}
                                disabled={isParsing}
                            />
                        </label>
                        <button
                            // @ts-ignore
                            onClick={handlePrint}
                            className="bg-emerald-700 text-white hover:bg-emerald-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>

                {/* Forms */}
                <div className="space-y-8 relative">
                    {isLoadingProfile && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                            <div className="flex flex-col items-center space-y-2">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                <p className="text-sm font-medium text-gray-500">Fetching profile...</p>
                            </div>
                        </div>
                    )}

                    {/* Personal Info */}
                    <section className="space-y-4">
                        <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-semibold text-gray-900">Personal Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={data.personal.firstName} onChange={e => handlePersonalChange("firstName", e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={data.personal.lastName} onChange={e => handlePersonalChange("lastName", e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={data.personal.email} onChange={e => handlePersonalChange("email", e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={data.personal.phone} onChange={e => handlePersonalChange("phone", e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Location / Address</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={data.personal.location} onChange={e => handlePersonalChange("location", e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Professional Summary</label>
                                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[80px]" value={data.personal.summary} onChange={e => handlePersonalChange("summary", e.target.value)} />
                            </div>
                        </div>
                    </section>

                    {/* Experience Info */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-semibold text-gray-900">Experience</h3>
                            </div>
                            <button
                                onClick={() => handleArrayAdd("experience")}
                                className="text-emerald-700 hover:text-emerald-800 text-xs font-medium flex items-center bg-emerald-50 px-2 py-1 rounded"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Experience
                            </button>
                        </div>

                        {data.experience.map((exp, index) => (
                            <div key={index} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-4 relative group">
                                <button onClick={() => handleArrayRemove("experience", index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-2 gap-4 pr-8">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={exp.company || ""} onChange={e => handleArrayUpdate("experience", index, "company", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Position / Title</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={exp.position || exp.title || ""} onChange={e => handleArrayUpdate("experience", index, "position", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Jan 2021" value={exp.startDate || ""} onChange={e => handleArrayUpdate("experience", index, "startDate", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Present" value={exp.endDate || ""} onChange={e => handleArrayUpdate("experience", index, "endDate", e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                        <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]" value={exp.description || ""} onChange={e => handleArrayUpdate("experience", index, "description", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Education Info */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-semibold text-gray-900">Education</h3>
                            </div>
                            <button
                                onClick={() => handleArrayAdd("education")}
                                className="text-emerald-700 hover:text-emerald-800 text-xs font-medium flex items-center bg-emerald-50 px-2 py-1 rounded"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Education
                            </button>
                        </div>

                        {data.education.map((edu, index) => (
                            <div key={index} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-4 relative group">
                                <button onClick={() => handleArrayRemove("education", index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-2 gap-4 pr-8">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={edu.institution || ""} onChange={e => handleArrayUpdate("education", index, "institution", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={edu.degree || ""} onChange={e => handleArrayUpdate("education", index, "degree", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Field of Study</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={edu.field || ""} onChange={e => handleArrayUpdate("education", index, "field", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={edu.startDate || ""} onChange={e => handleArrayUpdate("education", index, "startDate", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={edu.endDate || ""} onChange={e => handleArrayUpdate("education", index, "endDate", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Skills Info */}
                    <section className="space-y-4">
                        <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-semibold text-gray-900">Skills</h3>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Provide skills separated by comma</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]"
                                placeholder="e.g. JavaScript, React, Node.js, Project Management"
                                value={data.skills.join(", ")}
                                onChange={e => handleSkillsChange(e.target.value)}
                            />
                        </div>
                    </section>

                </div>
            </div>

            {/* Preview Column */}
            <div className="w-full lg:w-1/2 bg-gray-200/50 rounded-2xl flex items-start justify-center overflow-auto p-4 custom-scrollbar">
                <div className="scale-[0.3] sm:scale-[0.4] md:scale-[0.5] lg:scale-[0.55] xl:scale-[0.65] 2xl:scale-[0.8] transform-gpu origin-top transition-transform h-fit">
                    <AtsResumeTemplate data={data} printRef={componentRef} />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />

        </div>
    );
}
