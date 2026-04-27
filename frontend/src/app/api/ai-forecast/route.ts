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
- **Formatting (CRITICAL)**: You MUST use rich Markdown formatting in every response. NEVER output a wall of plain text.
  - Use ## and ### headers to organize sections (e.g., "## Trend Analysis", "### Short-term Outlook", "### Strategic Recommendations").
  - Use bullet points (- ) or numbered lists (1. ) to enumerate items — never dump multiple items in a single paragraph.
  - **Bold** key numbers, years, percentages, and important takeaways.
  - Use horizontal rules (---) to visually separate major sections.
  - Keep paragraphs to 2-3 sentences max.
  - Use > blockquotes for important summary statements or key conclusions.

  **Example of the expected output format** (follow this structure):
  \`\`\`
  ## Trend Analysis

  > The employment rate is projected to **grow steadily** from **85.2%** in 2025 to **89.7%** by 2028.

  ---

  ### Short-term Outlook (2025-2026)

  - **2025 Forecast**: **85.2%** employment rate (CI: 82.1% – 88.3%)
  - **YoY Change**: +**2.1%** from the previous year — a positive upward trend.

  ---

  ### Strategic Recommendations

  1. **Expand industry partnerships** to capitalize on the upward trend.
  2. **Strengthen high-demand programs** in technology and data science.
  3. **Monitor the confidence intervals** — the widening CI in 2028 suggests increasing uncertainty.
  \`\`\`

- **Complexity**: Explain statistical concepts (like ARIMA or CI) simply if you mention them, but keep the focus on the implications of the results.
- **Length**: Keep it mid-length (250-400 words) to ensure it's comprehensive yet readable.

## What you should NOT do
- Do NOT hallucinate data not present in the JSON.
- Do NOT offer purely generic advice without connecting it to the specific forecast data.
- Do NOT guarantee future outcomes; use probabilistic language (e.g., "The model suggests," "Likely scenarios include").
- **IMPORTANT — Off-topic rejection**: If the user asks a question that is NOT related to employment forecasts, trends, statistical analysis, or institutional planning, you MUST politely decline and redirect. For example, if asked about cooking, general trivia, or personal advice, respond with: "I'm specifically designed to analyze employment forecast data and trends. Could I help you with something related to the forecast insights instead?" Do NOT answer off-topic questions under any circumstances.`;
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
        const { messages, forecastData } = body as {
            messages: ChatMessage[];
            forecastData: unknown;
        };

        if (!forecastData) {
            return NextResponse.json(
                { error: "Forecast data is required for context." },
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
                systemMessage,
                ...(messages || []).map(m => ({ role: m.role, content: m.content }))
            ],
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
