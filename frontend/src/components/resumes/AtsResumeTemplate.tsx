import React from "react";

export interface ResumeData {
    personal: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        location: string;
        summary: string;
    };
    education: Array<{
        institution: string;
        degree: string;
        field: string;
        startDate: string;
        endDate: string;
    }>;
    experience: Array<{
        company: string;
        position: string;
        title: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    skills: Array<{ name: string; notes: string }>;
}

export const emptyResumeData: ResumeData = {
    personal: { firstName: "", lastName: "", email: "", phone: "", location: "", summary: "" },
    education: [],
    experience: [],
    skills: []
};

interface Props {
    data: ResumeData;
    printRef?: React.RefObject<HTMLDivElement | null>;
}

export function AtsResumeTemplate({ data, printRef }: Props) {
    return (
        <div
            ref={printRef as any}
            className="bg-white mx-auto print:mx-0 shadow-lg print:shadow-none min-h-[1056px] w-[816px] max-w-full print:w-full print:min-h-0 text-black leading-snug tracking-tight font-sans overflow-hidden"
            style={{ padding: "48px 96px 96px 96px" }}
        >
            {/* Header */}
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">
                    {data.personal.firstName || "FIRST"} {data.personal.lastName || "LAST NAME"}
                </h1>
                <div className="text-sm flex flex-wrap justify-center gap-2 text-gray-700">
                    {data.personal.email && <span>{data.personal.email}</span>}
                    {data.personal.email && data.personal.phone && <span>•</span>}
                    {data.personal.phone && <span>{data.personal.phone}</span>}
                    {(data.personal.email || data.personal.phone) && data.personal.location && <span>•</span>}
                    {data.personal.location && <span>{data.personal.location}</span>}
                </div>
            </header>

            {/* Summary */}
            {data.personal.summary && (
                <section className="mb-6">
                    <p className="text-sm text-gray-800 text-justify">{data.personal.summary}</p>
                </section>
            )}

            {/* Experience */}
            {data.experience.some(exp => exp.company || exp.position || exp.title || exp.description) && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b-[1.5px] border-black pb-1 mb-3">
                        Experience
                    </h2>
                    <div className="space-y-4">
                        {data.experience.map((exp, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-sm">
                                        {exp.position || exp.title}{exp.company && <span className="font-normal text-gray-800"> at {exp.company}</span>}
                                    </h3>
                                    <span className="text-xs font-semibold whitespace-nowrap ml-4">
                                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : ""}
                                    </span>
                                </div>
                                {exp.description?.includes("\n") || exp.description?.startsWith("•") || exp.description?.startsWith("-") ? (
                                    <ul className="list-disc list-outside ml-4 space-y-1">
                                        {exp.description
                                            .split("\n")
                                            .filter((line) => line.trim() !== "")
                                            .map((line, i) => (
                                                <li key={i} className="text-sm text-gray-800">
                                                    {line.replace(/^[•\s*-]+/, "").trim()}
                                                </li>
                                            ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{exp.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {data.education.some(edu => edu.institution || edu.degree || edu.field) && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b-[1.5px] border-black pb-1 mb-3">
                        Education
                    </h2>
                    <div className="space-y-3">
                        {data.education.map((edu, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-sm">{edu.institution}</h3>
                                    <span className="text-xs font-semibold whitespace-nowrap ml-4">
                                        {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""}
                                    </span>
                                </div>
                                {(edu.degree || edu.field) && (
                                    <p className="text-sm mt-0.5 text-gray-800">
                                        {edu.degree}{edu.degree && edu.field && " in "}{edu.field}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {data.skills.some(s => s.name.trim() !== "") && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b-[1.5px] border-black pb-1 mb-3">
                        Skills
                    </h2>
                    <ul className="list-disc list-inside space-y-1">
                        {data.skills
                            .filter(s => s.name)
                            .map((s, i) => (
                                <li key={i} className="text-sm text-gray-800 leading-relaxed font-medium">
                                    <span className="font-bold">{s.name}</span>: {s.notes}
                                </li>
                            ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
