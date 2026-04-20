"use client";

import { useState, useCallback, useRef } from "react";
import { RegressionPrediction } from "../_lib/api";

// ── Types ──────────────────────────────────────────────────────

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    hidden?: boolean;
}

interface UsePredictionAdvisorReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    initializeChat: () => Promise<void>;
    clearChat: () => void;
    isInitialized: boolean;
    hasFailedInit: boolean;
}

// ── Hook ───────────────────────────────────────────────────────

export function usePredictionAdvisor(
    predictionData: RegressionPrediction
): UsePredictionAdvisorReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasFailedInit, setHasFailedInit] = useState(false);
    const initRef = useRef(false);

    const createMessage = (
        role: "user" | "assistant",
        content: string,
        hidden?: boolean
    ): ChatMessage => ({
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: new Date(),
        hidden: hidden || false,
    });

    const processStream = useCallback(
        async (response: Response, onChunk: (text: string) => void) => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No reader found");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                onChunk(chunk);
            }
        },
        []
    );

    const callStreamingAPI = useCallback(
        async (chatMessages: ChatMessage[], aiMsgId: string) => {
            const response = await fetch("/api/ai-advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: chatMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    insightsData: {
                        type: "career_prediction",
                        predicted_salary: predictionData.predicted_salary,
                        predicted_duration_weeks: predictionData.predicted_duration_weeks,
                        salary_band: predictionData.salary_band,
                        search_outlook: predictionData.search_outlook,
                        input_data: predictionData.input_data,
                        prediction_result: predictionData.prediction_result,
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({ error: "Failed to get AI response." }));
                throw new Error(data.error || "Failed to get AI response.");
            }

            await processStream(response, (chunk) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === aiMsgId
                            ? { ...msg, content: msg.content + chunk }
                            : msg
                    )
                );
            });
        },
        [predictionData, processStream]
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (isLoading || !content.trim()) return;

            const userMessage = createMessage("user", content.trim());
            const aiMessage = createMessage("assistant", "");

            setMessages((prev) => [...prev, userMessage, aiMessage]);
            setIsLoading(true);
            setError(null);

            try {
                const historyForAPI = [...messages, userMessage];
                await callStreamingAPI(historyForAPI, aiMessage.id);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Something went wrong.";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, messages, callStreamingAPI]
    );

    const initializeChat = useCallback(async () => {
        if (initRef.current || hasFailedInit) return;
        initRef.current = true;

        setIsLoading(true);
        setError(null);
        setHasFailedInit(false);

        const initialPrompt = createMessage(
            "user",
            "As a graduate, please analyze my career prediction results — my predicted starting salary, job search duration, and the academic factors used. Give me an overview of where I stand, highlight what's working in my favor, identify areas for improvement, and suggest 2-3 specific action items I can take to improve my salary prospects and shorten my job search.",
            true
        );
        const aiMessage = createMessage("assistant", "");

        setMessages([initialPrompt, aiMessage]);

        try {
            await callStreamingAPI([initialPrompt], aiMessage.id);
            setIsInitialized(true);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to initialize chat.";
            setError(errorMessage);
            setHasFailedInit(true);
        } finally {
            setIsLoading(false);
        }
    }, [callStreamingAPI, hasFailedInit]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
        setIsInitialized(false);
        setHasFailedInit(false);
        initRef.current = false;
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        initializeChat,
        clearChat,
        isInitialized,
        hasFailedInit,
    };
}
