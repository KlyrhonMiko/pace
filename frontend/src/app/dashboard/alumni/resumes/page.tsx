"use client";

import ResumeBuilder from "@/components/resumes/ResumeBuilder";
import PageHeader from "@/components/dashboard/PageHeader";

export default function ResumesPage() {
    return (
        <div className="relative space-y-6">
            <PageHeader
                title="Career Profile & Resumes"
                description="Build an ATS-friendly resume or extract data from an existing one."
                currentPage="Resumes"
            />

            <div className="flex-1 w-full relative">
                <ResumeBuilder />
            </div>
        </div>
    );
}
