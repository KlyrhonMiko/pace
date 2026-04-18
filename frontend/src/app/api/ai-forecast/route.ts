import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

// ── System prompt ──────────────────────────────────────────────

function buildSystemPrompt(forecastJson: string): string {
    return `You are a professional Senior Statistical Analyst and Institutional Planner. 
Your role is to analyze ARIMA-based employment forecast data for a university and provide clear, actionable insights for faculty and administrators.

## ARIMA Forecast Data
\`\`\`json
${forecastJson}
\`\`\`

## Guidelines
- **Tone**: Professional, analytical, and objective. Use data-driven language.
- **Specificity**: Reference specific years, point forecasts, and confidence intervals from the data.
- **Key Analysis Points**:
    1. **Trend Identification**: Is the employment rate projected to grow, decline, or remains stable?
    2. **Short-term vs Long-term**: Pivot the analysis on immediate (1-year) vs distant (3+ years) outlook.
    3. **Confidence Assessment**: Mention the Lower/Upper 95% Confidence Intervals to show the level of uncertainty.
    4. **YoY Change**: Highlight significant year-over-year shifts.
    5. **Strategic Recommendations**: Suggest institutional responses (e.g., "Strengthen industry partnerships if trend is down" or "Expand capacity for popular programs if trend is high").
- **Structure**: Use clear formatting with headers and bullet points. Bold key numbers.
- **Complexity**: Explain statistical concepts (like ARIMA or CI) simply if you mention them, but keep the focus on the implications of the results.
- **Length**: Keep it mid-length (250-400 words) to ensure it's comprehensive yet readable.

## What you should NOT do
- Do NOT hallucinate data not present in the JSON.
- Do NOT offer purely generic advice without connecting it to the specific forecast data.
- Do NOT guarantee future outcomes; use probabilistic language (e.g., "The model suggests," "Likely scenarios include").`;
}

// ── POST handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("[AI Forecast] Missing GROQ_API_KEY");
            return NextResponse.json(
                { error: "Groq API key is not configured." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { forecastData } = body as {
            forecastData: unknown;
        };

        if (!forecastData) {
            return NextResponse.json(
                { error: "Forecast data is required." },
                { status: 400 }
            );
        }

        const groq = new Groq({ apiKey });

        const systemMessage: ChatMessage = {
            role: "system",
            content: buildSystemPrompt(JSON.stringify(forecastData, null, 2)),
        };

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemMessage.content,
                },
                {
                    role: "user",
                    content: "Please analyze the provided employment forecast data and explain the key trends and institutional implications.",
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.5, // Lower temperature for more analytical/consistent output
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
        console.error("[AI Forecast] Request Error:", error);

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
