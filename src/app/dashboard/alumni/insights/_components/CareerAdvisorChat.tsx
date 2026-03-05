"use client";

import { useState, useRef, useEffect } from "react";
import { EmployabilityResult } from "../../_lib/api";
import { useCareerAdvisor, ChatMessage } from "../_hooks/useCareerAdvisor";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Bot, Send, User, Sparkles, AlertCircle, Loader2, RotateCcw } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────

const SUGGESTIONS = [
    "What career paths suit my profile?",
    "How can I improve my weakest skills?",
    "What certifications should I pursue?",
    "Give me a 90-day improvement plan",
];

const AI_GRADIENT = "bg-gradient-to-br from-emerald-500 to-green-600";
const AI_SHADOW = "shadow-md shadow-emerald-500/20";

// ── Shared avatar ──────────────────────────────────────────────

function ChatAvatar({ variant, size = "sm" }: { variant: "ai" | "user"; size?: "sm" | "lg" }) {
    const dim = size === "sm" ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-xl";
    const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    if (variant === "user") {
        return (
            <div className={`flex items-center justify-center ${dim} bg-gray-900 text-white flex-shrink-0`}>
                <User className={icon} strokeWidth={2} />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${dim} ${AI_GRADIENT} ${AI_SHADOW} text-white flex-shrink-0`}>
            <Bot className={icon} strokeWidth={2} />
        </div>
    );
}

// ── Markdown-lite renderer ─────────────────────────────────────

function formatMessage(text: string) {
    return text.split("\n").map((line, i) => {
        const processed = line.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold">$1</strong>'
        );

        if (processed.match(/^[\s]*[-•*]\s/)) {
            return (
                <div key={i} className="flex gap-2 py-0.5">
                    <span className="text-emerald-500 mt-1 flex-shrink-0">•</span>
                    <span
                        className="break-words overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: processed.replace(/^[\s]*[-•*]\s/, "") }}
                    />
                </div>
            );
        }

        if (processed.match(/^[\s]*\d+\.\s/)) {
            return (
                <div key={i} className="pl-2 py-0.5 break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: processed }} />
            );
        }

        if (!processed.trim()) return <div key={i} className="h-2" />;

        return (
            <div key={i} className="py-0.5 break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: processed }} />
        );
    });
}

// ── Message bubble ─────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            <ChatAvatar variant={isUser ? "user" : "ai"} />

            <div
                className={`flex-1 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden ${
                    isUser
                        ? "bg-gray-900 text-white rounded-tr-sm"
                        : "bg-gray-50 text-gray-700 border border-gray-100 rounded-tl-sm"
                }`}
            >
                {isUser ? (
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className="space-y-0 break-words [overflow-wrap:anywhere]">{formatMessage(message.content)}</div>
                )}
            </div>
        </div>
    );
}

// ── Loading indicator ──────────────────────────────────────────

function LoadingBubble() {
    return (
        <div className="flex gap-3">
            <ChatAvatar variant="ai" />
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                    {[0, 150, 300].map((delay) => (
                        <div key={delay} className={`h-2 w-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:${delay}ms]`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main chat component ────────────────────────────────────────

export default function CareerAdvisorChat({
    insightsData,
    open,
    onOpenChange,
}: {
    insightsData: EmployabilityResult;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const {
        messages,
        isLoading,
        error,
        sendMessage,
        initializeChat,
        clearChat,
        isInitialized,
        hasFailedInit,
    } = useCareerAdvisor(insightsData);

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-initialize when dialog opens — but NOT if init already failed
    useEffect(() => {
        if (open && !isInitialized && !isLoading && !hasFailedInit) {
            initializeChat();
        }
    }, [open, isInitialized, isLoading, hasFailedInit, initializeChat]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Focus input after AI replies
    useEffect(() => {
        if (!isLoading && isInitialized) {
            inputRef.current?.focus();
        }
    }, [isLoading, isInitialized]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const msg = input;
        setInput("");
        await sendMessage(msg);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestion = async (suggestion: string) => {
        if (isLoading) return;
        await sendMessage(suggestion);
    };

    const handleRetry = () => {
        clearChat();
    };

    // Filter out hidden messages for rendering
    const visibleMessages = messages.filter((m) => !m.hidden);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-2xl h-[80vh] max-h-[700px] flex flex-col p-0 gap-0 overflow-hidden"
                showCloseButton={true}
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${AI_GRADIENT} text-white shadow-lg shadow-emerald-500/25`}>
                            <Sparkles className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-900">
                                AI Career Advisor
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                Powered by Gemini · Personalized career guidance
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-w-0">
                    {/* Initial loading state */}
                    {!isInitialized && isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${AI_GRADIENT} text-white shadow-xl shadow-emerald-500/25`}>
                                <Sparkles className="h-8 w-8 animate-pulse" strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">Analyzing your insights...</p>
                                <p className="text-xs text-gray-500 mt-1">Preparing personalized career guidance</p>
                            </div>
                        </div>
                    )}

                    {/* Failed init state — show retry button instead of infinite loop */}
                    {hasFailedInit && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-400">
                                <AlertCircle className="h-8 w-8" strokeWidth={1.5} />
                            </div>
                            <div className="text-center max-w-sm">
                                <p className="text-sm font-medium text-gray-900">
                                    Unable to connect
                                </p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    {error || "The AI service is temporarily unavailable. This may be due to rate limits — please wait a moment and try again."}
                                </p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
                            >
                                <RotateCcw className="h-4 w-4" strokeWidth={2} />
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Visible messages only */}
                    {visibleMessages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {/* Typing indicator */}
                    {isLoading && isInitialized && <LoadingBubble />}

                    {/* Error state (for send errors, not init errors) */}
                    {error && !hasFailedInit && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-medium">Something went wrong</p>
                                <p className="text-xs text-red-600 mt-0.5 break-words">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Suggestion chips — show after initial analysis */}
                    {isInitialized && !isLoading && visibleMessages.length <= 1 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Try asking...</p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleSuggestion(s)}
                                        className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all duration-200 cursor-pointer"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                hasFailedInit
                                    ? "Click 'Try Again' above to start..."
                                    : isInitialized
                                    ? "Ask a follow-up question..."
                                    : "Analyzing your data..."
                            }
                            disabled={!isInitialized || isLoading || hasFailedInit}
                            className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || !isInitialized}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 cursor-pointer"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" strokeWidth={2} />
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        AI-powered by Gemini · Responses are suggestions, not guarantees
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
