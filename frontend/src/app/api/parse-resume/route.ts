import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse/lib/pdf.js";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to buffer for pdf-parse
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF
        const pdfData = await pdfParse(buffer);
        const textContent = pdfData.text;

        if (!textContent || textContent.trim().length === 0) {
            return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
        }

        // Pass to Gemini
        const prompt = `
    You are an AI resume parser. Extract the following information from the text of the resume provided below.
    Format your response as a tight JSON object WITH NO MARKDOWN FORMATTING (no \`\`\`json etc) and NO EXTRA TEXT.
    
    Structure the JSON as:
    {
      "personal": {
        "firstName": "",
        "lastName": "",
        "email": "",
        "phone": "",
        "location": "",
        "summary": ""
      },
      "education": [
        { "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "" }
      ],
      "experience": [
        { "company": "", "position": "", "title": "", "startDate": "", "endDate": "", "description": "" }
      ],
      "skills": ["skill1", "skill2"]
    }

    Resume Text:
    ${textContent}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text();

        // Cleanup AI output just in case
        jsonText = jsonText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

        const parsedData = JSON.parse(jsonText);

        return NextResponse.json(parsedData);
    } catch (error: any) {
        console.error("Resume parsing error:", error);
        return NextResponse.json({ error: "Failed to parse resume. " + error.message }, { status: 500 });
    }
}
