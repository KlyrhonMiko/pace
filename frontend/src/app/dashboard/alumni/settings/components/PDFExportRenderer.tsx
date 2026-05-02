"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { getMyProfile, getSavedResume } from "../../profile/_lib/api";
import { getMySkills, getLatestPrediction } from "../../_lib/api";
import { getMyRegressionPredictions } from "../../predictions/_lib/api";
import { AtsResumeTemplate } from "@/components/resumes/AtsResumeTemplate";
import { format } from "date-fns";

export interface PDFExportHandle {
    generatePdf: () => Promise<void>;
}

export const PDFExportRenderer = forwardRef<PDFExportHandle>((_, ref) => {
    const page1Ref = useRef<HTMLDivElement>(null);
    const page2Ref = useRef<HTMLDivElement>(null);
    const page3Ref = useRef<HTMLDivElement>(null); // Resume

    const [data, setData] = useState<any>(null);

    useImperativeHandle(ref, () => ({
        generatePdf: async () => {
            const toastId = toast.loading("Fetching data for PDF...");
            try {
                // Fetch all needed data
                const profile = await getMyProfile();
                if (!profile) throw new Error("Could not load profile");
                const resume = await getSavedResume();
                const skills = await getMySkills(profile.alumni_id);
                const prediction = await getLatestPrediction(undefined, profile.alumni_id);
                const regression = await getMyRegressionPredictions(undefined, 1);

                setData({
                    profile,
                    resume,
                    skills,
                    prediction,
                    regression: regression.length > 0 ? regression[0] : null
                });

                toast.loading("Generating PDF document...", { id: toastId });

                // Wait for React to render the data
                await new Promise(resolve => setTimeout(resolve, 1000));

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [794, 1123] // A4 size in pixels at 96 DPI
                });

                const capturePage = async (elRef: React.RefObject<HTMLDivElement | null>, addPage: boolean) => {
                    if (elRef.current) {
                        const imgData = await toJpeg(elRef.current, { 
                            cacheBust: true, 
                            pixelRatio: 1.5,
                            quality: 0.9,
                            backgroundColor: '#ffffff'
                        });
                        if (addPage) pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123, undefined, 'FAST');
                    }
                };

                await capturePage(page1Ref, false); // First page
                await capturePage(page2Ref, true);  // Second page
                if (resume) {
                    await capturePage(page3Ref, true);  // Third page (Resume)
                }

                pdf.save(`${profile.last_name}_${profile.first_name}_Profile.pdf`);
                toast.success("PDF generated successfully!", { id: toastId });

            } catch (error: any) {
                console.error("PDF generation error:", error);
                toast.error(error.message || "Failed to generate PDF.", { id: toastId });
            } finally {
                // Clear data to hide DOM nodes
                setTimeout(() => setData(null), 1000);
            }
        }
    }));

    if (!data) return null;

    const { profile, resume, skills, prediction, regression } = data;

    return (
        <div className="absolute top-0 -left-[9999px] flex flex-col gap-10 opacity-0 pointer-events-none">
            {/* Page 1: Profile */}
            <div 
                ref={page1Ref} 
                className="w-[794px] h-[1123px] bg-white p-12 text-black flex flex-col"
                style={{ fontFamily: 'sans-serif' }}
            >
                <div className="border-b-2 border-black pb-6 mb-8">
                    <h1 className="text-4xl font-bold uppercase tracking-tight">
                        {profile.first_name} {profile.middle_name ? profile.middle_name.charAt(0) + '.' : ''} {profile.last_name}
                    </h1>
                    <p className="text-lg text-gray-700 mt-2">PACE Alumni Profile • {profile.alumni_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Contact & Demographics</h2>
                        <ul className="space-y-3 text-sm">
                            <li><span className="font-semibold w-32 inline-block">Email:</span> {profile.email}</li>
                            <li><span className="font-semibold w-32 inline-block">Gender:</span> {profile.gender}</li>
                            <li><span className="font-semibold w-32 inline-block">Age:</span> {profile.age}</li>
                            <li><span className="font-semibold w-32 inline-block">Birthdate:</span> {profile.birthdate ? format(new Date(profile.birthdate), 'MMMM dd, yyyy') : 'N/A'}</li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Academic Record</h2>
                        <ul className="space-y-3 text-sm">
                            <li><span className="font-semibold w-40 inline-block">Degree:</span> {profile.course_name || 'N/A'}</li>
                            <li><span className="font-semibold w-40 inline-block">Graduation Year:</span> {profile.year_graduated || 'N/A'}</li>
                            <li><span className="font-semibold w-40 inline-block">GWA:</span> {profile.gwa || 'N/A'}</li>
                            <li><span className="font-semibold w-40 inline-block">Leadership Position:</span> {profile.leadership_pos ? 'Yes' : 'No'}</li>
                            <li><span className="font-semibold w-40 inline-block">Active Member:</span> {profile.act_member_pos ? 'Yes' : 'No'}</li>
                        </ul>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Employment Details</h2>
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <ul className="space-y-3">
                            <li><span className="font-semibold w-40 inline-block">Status:</span> {profile.employment_status || 'N/A'}</li>
                            <li><span className="font-semibold w-40 inline-block">Sector:</span> {profile.employment_sector || 'N/A'}</li>
                        </ul>
                        <ul className="space-y-3">
                            <li><span className="font-semibold w-40 inline-block">Salary Package:</span> {profile.salary_package || 'N/A'}</li>
                            <li><span className="font-semibold w-40 inline-block">Offers Received:</span> {profile.offers_received || '0'}</li>
                        </ul>
                    </div>
                </div>
                
                <div className="mt-auto border-t border-gray-300 pt-4 flex justify-between text-xs text-gray-500">
                    <span>Generated by PACE System</span>
                    <span>{format(new Date(), 'MMMM dd, yyyy')} • Page 1 of {resume ? '3' : '2'}</span>
                </div>
            </div>

            {/* Page 2: Insights */}
            <div 
                ref={page2Ref} 
                className="w-[794px] h-[1123px] bg-white p-12 text-black flex flex-col"
                style={{ fontFamily: 'sans-serif' }}
            >
                <div className="border-b-2 border-black pb-6 mb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-tight">Professional Insights & Predictions</h1>
                    <p className="text-lg text-gray-700 mt-2">{profile.first_name} {profile.last_name}</p>
                </div>

                <div className="mb-8">
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Skill Assessment</h2>
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <ul className="space-y-3">
                            <li><span className="font-semibold w-48 inline-block">Soft Skills Average:</span> {skills?.soft_skills_ave ?? 'N/A'}%</li>
                            <li><span className="font-semibold w-48 inline-block">Hard Skills Average:</span> {skills?.hard_skills_ave ?? 'N/A'}%</li>
                        </ul>
                        <ul className="space-y-3">
                            <li><span className="font-semibold w-48 inline-block">Program Skills Average:</span> {skills?.program_skills_average ?? 'N/A'}%</li>
                        </ul>
                    </div>
                    {skills?.program_skills && Object.keys(skills.program_skills).length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Program Specific Skills:</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(skills.program_skills).map(([key, val]) => (
                                    <div key={key} className="flex justify-between border-b border-gray-100 py-1">
                                        <span>{key}</span>
                                        <span className="font-medium">{val as number}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {prediction && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Employability Assessment</h2>
                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block font-semibold mb-1">Realistic Prediction</span>
                                    <span className="text-lg font-bold">{prediction.realistic_assessment.prediction}</span>
                                    <div className="text-gray-500 mt-1">Probability: {Math.round(prediction.realistic_assessment.probability * 100)}%</div>
                                </div>
                                <div>
                                    <span className="block font-semibold mb-1">Top Factors</span>
                                    <ul className="list-disc pl-4">
                                        {prediction.top_factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {regression && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Career Regression Projections</h2>
                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <span className="block font-semibold mb-1">Estimated Starting Salary</span>
                                <span className="text-xl font-bold">PHP {regression.prediction_result.predictions.starting_salary.value.toLocaleString()}</span>
                                <div className="text-gray-500 mt-1">Band: {regression.salary_band}</div>
                            </div>
                            <div>
                                <span className="block font-semibold mb-1">Estimated Job Search Duration</span>
                                <span className="text-xl font-bold">{regression.prediction_result.predictions.job_search_duration.value} Weeks</span>
                                <div className="text-gray-500 mt-1">Outlook: {regression.search_outlook}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto border-t border-gray-300 pt-4 flex justify-between text-xs text-gray-500">
                    <span>Generated by PACE System</span>
                    <span>{format(new Date(), 'MMMM dd, yyyy')} • Page 2 of {resume ? '3' : '2'}</span>
                </div>
            </div>

            {/* Page 3: Resume */}
            {resume && (
                <div 
                    ref={page3Ref} 
                    className="w-[794px] h-[1123px] bg-white flex flex-col"
                >
                    <AtsResumeTemplate data={resume} isPdfMode={true} />
                </div>
            )}
        </div>
    );
});

PDFExportRenderer.displayName = "PDFExportRenderer";
