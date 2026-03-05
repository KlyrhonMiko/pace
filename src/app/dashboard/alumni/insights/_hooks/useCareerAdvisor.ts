"use client";

import { useState, useCallback, useRef } from "react";
import { EmployabilityResult } from "../../_lib/api";

// ── Types ──────────────────────────────────────────────────────

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface UseCareerAdvisorReturn {
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

export function useCareerAdvisor(
    insightsData: EmployabilityResult
): UseCareerAdvisorReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasFailedInit, setHasFailedInit] = useState(false);
    const initRef = useRef(false);

    const createMessage = (
        role: "user" | "assistant",
        content: string
    ): ChatMessage => ({
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: new Date(),
    });

    const callAPI = useCallback(
        async (chatMessages: ChatMessage[]): Promise<string> => {
            const response = await fetch("/api/ai-advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: chatMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    insightsData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get AI response.");
            }

            return data.reply;
        },
        [insightsData]
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (isLoading || !content.trim()) return;

            const userMessage = createMessage("user", content.trim());

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            try {
                const allMessages = [...messages, userMessage];
                const reply = await callAPI(allMessages);
                const aiMessage = createMessage("assistant", reply);
                setMessages((prev) => [...prev, aiMessage]);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Something went wrong.";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, messages, callAPI]
    );

    const initializeChat = useCallback(async () => {
        // Prevent re-entry AND prevent retrying after failure
        if (initRef.current || hasFailedInit) return;
        initRef.current = true;

        setIsLoading(true);
        setError(null);
        setHasFailedInit(false);

        const initialPrompt = createMessage(
            "user",
            "Please analyze my employability insights and give me an overview of my career readiness. Highlight my strongest areas, areas needing improvement, and give me 2-3 specific action items I can start working on right away."
        );

        try {
            const reply = await callAPI([initialPrompt]);
            const aiMessage = createMessage("assistant", reply);
            // Don't show the initial prompt in the UI — only show the AI's analysis
            setMessages([aiMessage]);
            setIsInitialized(true);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to initialize chat.";
            setError(errorMessage);
            // Do NOT reset initRef — mark as failed instead to prevent infinite retries
            setHasFailedInit(true);
        } finally {
            setIsLoading(false);
        }
    }, [callAPI, hasFailedInit]);

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
