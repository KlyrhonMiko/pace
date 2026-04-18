import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant" | "system";
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
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("[AI Advisor] Missing GROQ_API_KEY");
            return NextResponse.json(
                { error: "Groq API key is not configured." },
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

        const groq = new Groq({ apiKey });

        const systemMessage: ChatMessage = {
            role: "system",
            content: buildSystemPrompt(JSON.stringify(insightsData, null, 2)),
        };

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                systemMessage,
                ...messages.map(m => ({
                    role: m.role as "user" | "assistant",
                    content: m.content
                }))
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: true,
        });

        // Create a ReadableStream for streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of chatCompletion) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("[AI Advisor] Request Error:", error);

        const message = error?.message || "An unexpected error occurred.";

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
            { error: message },
            { status: 500 }
        );
    }
}
