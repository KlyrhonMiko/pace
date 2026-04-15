import { jsPDF } from "jspdf";
import { ResumeData } from "./AtsResumeTemplate";

export function generateAtsDocxPdf(data: ResumeData) {
    const doc = new jsPDF({
        unit: "pt",
        orientation: "portrait",
        format: "letter" // 612 x 792 pt
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
        }
    };

    const addWrappedText = (text: string, x: number, maxWidth: number, lineHeight: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        checkPageBreak(lines.length * lineHeight);
        doc.text(lines, x, yPos);
        yPos += lines.length * lineHeight;
    };

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const title = `${data.personal.firstName || "FIRST"} ${data.personal.lastName || "LAST NAME"}`.toUpperCase();
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPos);
    yPos += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const contacts = [];
    if (data.personal.email) contacts.push(data.personal.email);
    if (data.personal.phone) contacts.push(data.personal.phone);
    if (data.personal.location) contacts.push(data.personal.location);
    const contactText = contacts.join("  •  ");
    const contactWidth = doc.getTextWidth(contactText);
    doc.text(contactText, (pageWidth - contactWidth) / 2, yPos);
    yPos += 30;

    // --- Summary ---
    if (data.personal.summary) {
        doc.setTextColor(30, 30, 30);
        addWrappedText(data.personal.summary, margin, contentWidth, 14);
        doc.setTextColor(0, 0, 0);
        yPos += 15;
    }

    // Helper for Section Headers
    const addSectionHeader = (title: string) => {
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title.toUpperCase(), margin, yPos);
        yPos += 6;
        doc.setLineWidth(1);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 16;
    };

    // --- Experience ---
    if (data.experience.length > 0) {
        addSectionHeader("Experience");
        data.experience.forEach((exp) => {
            checkPageBreak(40);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);

            const jobTitle = `${exp.position || exp.title}${exp.company ? ` at ${exp.company}` : ""}`;
            doc.text(jobTitle, margin, yPos);

            doc.setFont("helvetica", "normal");
            const dates = `${exp.startDate} ${exp.endDate ? `— ${exp.endDate}` : ""}`;
            const datesWidth = doc.getTextWidth(dates);
            doc.text(dates, pageWidth - margin - datesWidth, yPos);

            yPos += 16;

            if (exp.description) {
                doc.setTextColor(40, 40, 40);
                addWrappedText(exp.description, margin, contentWidth, 14);
                doc.setTextColor(0, 0, 0);
            }
            yPos += 8;
        });
        yPos += 8;
    }

    // --- Education ---
    if (data.education.length > 0) {
        addSectionHeader("Education");
        data.education.forEach((edu) => {
            checkPageBreak(30);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);

            doc.text(edu.institution, margin, yPos);

            doc.setFont("helvetica", "normal");
            const dates = `${edu.startDate} ${edu.endDate ? `— ${edu.endDate}` : ""}`;
            const datesWidth = doc.getTextWidth(dates);
            doc.text(dates, pageWidth - margin - datesWidth, yPos);

            yPos += 14;

            if (edu.degree || edu.field) {
                doc.setTextColor(40, 40, 40);
                const eduDetails = `${edu.degree}${edu.degree && edu.field ? " in " : ""}${edu.field}`;
                doc.text(eduDetails, margin, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 14;
            }
            yPos += 8;
        });
        yPos += 8;
    }

    // --- Skills ---
    if (data.skills.length > 0) {
        addSectionHeader("Skills");
        doc.setFontSize(10);
        data.skills.filter(s => s.name).forEach((skill) => {
            doc.setFont("helvetica", "bold");
            const prefix = `${skill.name}:`;
            doc.text(prefix, margin + 12, yPos);
            const prefixWidth = doc.getTextWidth(`${prefix} `);

            doc.setFont("helvetica", "normal");
            doc.circle(margin + 5, yPos - 3, 1.5, "F");

            if (skill.notes) {
                const maxNoteWidth = contentWidth - 12 - prefixWidth;
                const lines = doc.splitTextToSize(skill.notes, maxNoteWidth);

                checkPageBreak(lines.length * 14);
                doc.text(lines[0], margin + 12 + prefixWidth, yPos);

                if (lines.length > 1) {
                    for (let i = 1; i < lines.length; i++) {
                        yPos += 14;
                        checkPageBreak(14);
                        doc.text(lines[i], margin + 12 + prefixWidth, yPos);
                    }
                }
            } else {
                checkPageBreak(14);
            }
            yPos += 18;
        });
    }

    const filename = `${data.personal.firstName || "Resume"}_${data.personal.lastName || ""}.pdf`;
    doc.save(filename);
}
