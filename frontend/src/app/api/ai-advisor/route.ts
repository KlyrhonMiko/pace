import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Types ──────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// ── System prompt ──────────────────────────────────────────────

function buildSystemPrompt(insightsJson: string): string {
    return `You are a professional AI Career Advisor embedded in a university's Employability Insights dashboard.

Your role is to act as a warm, knowledgeable career counselor who analyzes an alumni's ML-predicted employability data and provides actionable, encouraging guidance. The user is an alumnus who has already graduated.

## Alumni's Employability Insights Data
\`\`\`json
${insightsJson}
\`\`\`

## Guidelines
- **Tone**: Professional yet approachable. Be encouraging but honest.
- **Specificity**: Reference the actual numbers, skills, and factors from the data above. Never give generic advice — always ground your recommendations in the alumni's specific data.
- **Structure**: Use clear formatting with bullet points and short paragraphs. Bold key takeaways.
- **Actionability**: Every suggestion should be something the alumni can act on (courses, projects, certifications, habits).
- **Career mapping**: When discussing career paths, explain WHY they fit based on the alumni's specific strengths.
- **Improvement focus**: When discussing weak areas, frame them as growth opportunities, not failures.
- **Length**: Keep responses concise — aim for 150-300 words per reply unless the user asks for more detail.

## What you can help with
- Analyzing the alumni's employability score and what it means
- Identifying their strongest skills and how to leverage them
- Suggesting specific improvements for their weakest areas
- Recommending career paths that align with their skill profile
- Advising on certifications, courses, or projects to boost employability
- Providing interview preparation tips based on their strengths
- Offering resume and portfolio suggestions

## What you should NOT do
- Make up data that isn't in the insights
- Give medical, legal, or financial advice
- Guarantee employment outcomes
- Be discouraging or negative about the alumni's prospects`;
}

// ── POST handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

        if (!apiKey) {
            console.error("[AI Advisor] Missing GEMINI_API_KEY");
            return NextResponse.json(
                { error: "Gemini API key is not configured." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { messages, insightsData } = body as {
            messages: ChatMessage[];
            insightsData: unknown;
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "Messages array is required." },
                { status: 400 }
            );
        }

        if (!insightsData) {
            return NextResponse.json(
                { error: "Insights data is required." },
                { status: 400 }
            );
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-2.5-flash as confirmed by REST API list
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: buildSystemPrompt(JSON.stringify(insightsData, null, 2)),
        });

        // Build conversation history for Gemini
        // Gemini expects alternating user/model roles
        const history = messages.slice(0, -1).map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({ history });

        // Send the latest user message
        const lastMessage = messages[messages.length - 1];

        try {
            const result = await chat.sendMessage(lastMessage.content);
            const reply = result.response.text();
            return NextResponse.json({ reply });
        } catch (execError: any) {
            console.error("[AI Advisor] Gemini Execution Error:", execError);
            throw execError;
        }
    } catch (error: any) {
        console.error("[AI Advisor] Request Error:", error);

        const message = error?.message || "An unexpected error occurred.";
        const stack = error?.stack;

        // Detect rate limit errors
        const isRateLimit = message.includes("429") || message.includes("quota") || message.includes("Too Many Requests");

        if (isRateLimit) {
            return NextResponse.json(
                {
                    error: "AI service rate limit reached. Please wait a minute before trying again.",
                    retryable: true,
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                error: message,
                details: process.env.NODE_ENV === "development" ? stack : undefined
            },
            { status: 500 }
        );
    }
}
