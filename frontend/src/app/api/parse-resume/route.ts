import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const maxDuration = 60;

function parseAtsResumeText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentSection = 'personal';

  const parsedData = {
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      summary: ""
    },
    education: [] as any[],
    experience: [] as any[],
    skills: [] as any[]
  };

  const sectionRegex = {
    summary: /^(PROFESSIONAL\s+)?SUMMARY|PROFILE|ABOUT\s+ME$/i,
    experience: /^EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT\s+HISTORY|PROFESSIONAL\s+EXPERIENCE$/i,
    education: /^EDUCATION|ACADEMIC\s+BACKGROUND$/i,
    skills: /^SKILLS|CORE\s+COMPETENCIES|TECHNICAL\s+SKILLS$/i,
  };

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

  let currentExp: any = null;
  let currentEdu: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('--') && line.includes('of')) continue;

    // Check if line is a section header
    if (sectionRegex.summary.test(line)) { currentSection = 'summary'; continue; }
    else if (sectionRegex.experience.test(line)) { currentSection = 'experience'; currentExp = null; continue; }
    else if (sectionRegex.education.test(line)) { currentSection = 'education'; currentEdu = null; continue; }
    else if (sectionRegex.skills.test(line)) { currentSection = 'skills'; continue; }

    if (currentSection === 'personal') {
      if (i === 0) {
        const nameParts = line.split(/\s+/);
        parsedData.personal.firstName = nameParts[0] || "";
        parsedData.personal.lastName = nameParts.slice(1).join(" ") || "";
      } else if (line.includes('•') || line.includes('|') || line.match(emailRegex) || line.match(phoneRegex)) {
        // Contacts line
        const parts = line.split(/•|\|/).map(p => p.trim());
        parts.forEach(part => {
          if (part.match(emailRegex)) parsedData.personal.email = part;
          else if (part.match(phoneRegex)) parsedData.personal.phone = part;
          else if (part.length > 0 && !parsedData.personal.location) parsedData.personal.location = part;
        });
      } else {
        parsedData.personal.summary += (parsedData.personal.summary ? " " : "") + line;
      }
    } else if (currentSection === 'summary') {
      parsedData.personal.summary += (parsedData.personal.summary ? " " : "") + line;
    } else if (currentSection === 'experience') {
      const dateMatch = line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:19|20)\d{2}|(?:19|20)\d{2})\s*(?:-|—|to)\s*(Present|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:19|20)\d{2}|(?:19|20)\d{2})\b/i);
      const lineCleaned = dateMatch ? line.replace(dateMatch[0], '').trim() : line;

      if (!currentExp || (currentExp.description.length > 30 && lineCleaned.length < 80 && !lineCleaned.includes('.') && /^[A-Z]/.test(lineCleaned))) {
        let title = lineCleaned;
        let company = "";
        if (title.includes(" at ")) {
          const parts = title.split(" at ");
          title = parts[0].trim();
          company = parts[1].trim();
        }

        currentExp = {
          company: company,
          position: title,
          title: title,
          startDate: dateMatch ? dateMatch[1] : "",
          endDate: dateMatch ? dateMatch[2] : "",
          description: ""
        };
        parsedData.experience.push(currentExp);
      } else if (currentExp && !currentExp.title && lineCleaned.length < 80 && !lineCleaned.includes('.')) {
        currentExp.title = lineCleaned;
        currentExp.position = lineCleaned;
      } else if (currentExp && dateMatch && (!currentExp.startDate)) {
        currentExp.startDate = dateMatch[1];
        currentExp.endDate = dateMatch[2];
      } else if (currentExp) {
        currentExp.description += (currentExp.description ? " " : "") + line;
      }

    } else if (currentSection === 'education') {
      const dateMatch = line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:19|20)\d{2}|(?:19|20)\d{2})\s*(?:-|—|to)\s*(Present|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:19|20)\d{2}|(?:19|20)\d{2})\b/i);
      const lineCleaned = dateMatch ? line.replace(dateMatch[0], '').trim() : line;

      if (!currentEdu || (currentEdu.degree && lineCleaned.length < 80 && !lineCleaned.includes('.'))) {
        currentEdu = {
          institution: lineCleaned,
          degree: "",
          field: "",
          startDate: dateMatch ? dateMatch[1] : "",
          endDate: dateMatch ? dateMatch[2] : ""
        };
        parsedData.education.push(currentEdu);
      } else if (currentEdu && !currentEdu.degree && lineCleaned.length < 120) {
        let degree = lineCleaned;
        let field = "";
        if (degree.includes(" in ")) {
          const parts = degree.split(" in ");
          degree = parts[0].trim();
          field = parts[1].trim();
        }
        currentEdu.degree = degree;
        currentEdu.field = field;
      } else if (currentEdu && dateMatch && !currentEdu.endDate) {
        currentEdu.startDate = dateMatch[1];
        currentEdu.endDate = dateMatch[2];
      }
    } else if (currentSection === 'skills') {
      if (line.includes(':')) {
        const parts = line.split(':');
        parsedData.skills.push({
          name: parts[0].replace(/•|\n/g, '').trim(),
          notes: parts.slice(1).join(':').trim()
        } as any);
      } else if (parsedData.skills.length > 0) {
        parsedData.skills[parsedData.skills.length - 1].notes += " " + line.replace(/•|\n/g, '').trim();
      } else {
        const splitSkills = line.split(/[,|•]/).map(s => s.trim()).filter(s => s.length > 0);
        splitSkills.forEach(s => parsedData.skills.push({ name: s, notes: "" } as any));
      }
    }
  }

  return parsedData;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();

    // Parse PDF
    const parser = new PDFParse({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false // disable worker internal fetches
    });

    // Explicitly bypass Node-side worker resolution trick in recent versions natively
    // by disabling it locally before calling getText
    const textResult = await parser.getText();
    const textContent = textResult.text;

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    const parsedData = parseAtsResumeText(textContent);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return NextResponse.json({ error: "Failed to parse resume. " + error.message }, { status: 500 });
  }
}
