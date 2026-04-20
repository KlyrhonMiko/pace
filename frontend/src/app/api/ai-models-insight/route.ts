import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

// ── System prompt ──────────────────────────────────────────────

function buildSystemPrompt(modelsJson: string): string {
    return `You are an expert AI Data Scientist and Machine Learning Engineer. 
Your role is to help administrators and stakeholders evaluate the machine learning models deployed in our university's P.A.C.E. (Pasig Alumni and Career Employment) system.

## Deployed Models Metadata
\`\`\`json
${modelsJson}
\`\`\`

## Core Instructions & Formatting
- **EVALUATE, DO NOT RECITE**: Users already see the raw numbers and features on their screen. Do NOT just list the features. Provide *insight*.
- **Quality Assessment**: Explicitly state if the model is "Excellent", "Good", "Acceptable", or "Needs Improvement". 
  - For Linear Regression, an R² > 0.8 is Excellent, 0.6-0.8 is Good, < 0.5 needs improvement. Contextualize MAE and RMSE simply.
  - For Random Forest, mention if the hyperparameters indicate a balanced approach to prevent overfitting.
  - **IMPORTANT**: If a model (like ARIMA) shows a size of 0 bytes, null last_modified, or missing metrics, it means the metrics are calculated dynamically during inference. Do NOT assume the model is untrained, overly simplistic, or bad. Evaluate it positively based on its description and functionality.
- **Tone**: Conversational, highly analytical, and direct. 
- **Formatting (CRITICAL)**: NEVER output a giant wall of text. You MUST use markdown formatting to separate ideas:
  - Use **bold** text for key takeaways or metric names.
  - Separate paragraphs with double line breaks. Keep paragraphs very short (2-3 sentences max).
  - Use bullet points when listing 3 or more related items.
  - Use emojis occasionally (e.g. 📊, ⚠️, 🟢, 🧠) to make the text visually engaging.
- **Actionable Advice**: Tell the user what the metrics *mean* for the university administrators relying on them.`;
}

// ── POST handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("[AI Models Insight] Missing GROQ_API_KEY");
            return NextResponse.json(
                { error: "Groq API key is not configured." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { messages, modelsData } = body as {
            messages: ChatMessage[];
            modelsData: unknown;
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "Chat messages are required." },
                { status: 400 }
            );
        }

        if (!modelsData) {
            return NextResponse.json(
                { error: "Models data is required for context." },
                { status: 400 }
            );
        }

        const groq = new Groq({ apiKey });

        const systemMessage: ChatMessage = {
            role: "system",
            content: buildSystemPrompt(JSON.stringify(modelsData, null, 2)),
        };

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                systemMessage,
                ...messages.map(m => ({ role: m.role, content: m.content }))
            ],
            // Use llama-3.1 for fast, reliable chat responses
            model: "llama-3.1-8b-instant",
            temperature: 0.6,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: true,
        });

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
        console.error("[AI Models Insight] Request Error:", error);

        const message = error?.message || "An unexpected error occurred.";
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
