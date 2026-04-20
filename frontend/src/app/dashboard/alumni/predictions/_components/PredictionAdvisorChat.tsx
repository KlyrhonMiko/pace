"use client";

import { useState, useRef, useEffect } from "react";
import { RegressionPrediction } from "../_lib/api";
import { usePredictionAdvisor, ChatMessage } from "../_hooks/usePredictionAdvisor";
import {
    Bot,
    Send,
    User,
    Sparkles,
    AlertCircle,
    Loader2,
    RotateCcw,
    X,
    Minimize2,
    Maximize2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAIInsightsStore } from "./ai-insights-store";

// ── Constants ──────────────────────────────────────────────────

const SUGGESTIONS = [
    "How can I increase my predicted salary?",
    "What skills should I develop to get hired faster?",
    "What career paths match my profile?",
    "Give me a 90-day career action plan",
];

const AI_GRADIENT = "bg-gradient-to-br from-emerald-700 to-emerald-600";
const AI_SHADOW = "shadow-lg shadow-emerald-500/25";

// ── Main chat component ────────────────────────────────────────

export default function PredictionAdvisorChat({
    predictionData,
}: {
    predictionData: RegressionPrediction;
}) {
    const { isOpen, setIsOpen, initialQuery, clearQuery } = useAIInsightsStore();
    const [isMinimized, setIsMinimized] = useState(false);

    const {
        messages,
        isLoading,
        error,
        sendMessage,
        initializeChat,
        clearChat,
        isInitialized,
        hasFailedInit,
    } = usePredictionAdvisor(predictionData);

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized && (messages.length > 0 || isLoading)) {
            scrollToBottom();
        }
    }, [messages, isLoading, isOpen, isMinimized]);

    useEffect(() => {
        if (!isLoading && isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isLoading, isOpen, isMinimized]);

    // Auto-submit initial query if provided from external trigger
    useEffect(() => {
        if (initialQuery && !isLoading) {
            sendMessage(initialQuery);
            clearQuery();
            setIsMinimized(false);
        }
    }, [initialQuery, isLoading, sendMessage, clearQuery]);

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
        initializeChat();
    };

    const visibleMessages = messages.filter((m) => !m.hidden);

    // Chat Trigger Button (if not open)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 group z-50 cursor-pointer"
                title="Career Advisor"
            >
                <Sparkles size={24} className="group-hover:animate-pulse" />
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${isMinimized ? "w-80 h-16" : "w-[400px] h-[600px] max-h-[85vh]"
                } sm:right-6 right-0 max-w-full animate-in fade-in slide-in-from-bottom-4 duration-300`}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between px-4 py-4 ${AI_GRADIENT} text-white cursor-pointer`}
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">AI Career Advisor</h3>
                        {!isMinimized && (
                            <p className="text-[10px] text-emerald-100 font-medium">
                                Career & Salary Guidance
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        className="p-1.5 hover:bg-white/20 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                        {visibleMessages.length === 0 && !isLoading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex max-w-[85%] gap-2 items-end">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                        <Bot size={12} />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl text-sm bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm">
                                        Hi! I'm your P.A.C.E. AI Career Advisor. I've analyzed your career predictions — would you like me to explain what they mean or suggest how you can improve your outlook?
                                    </div>
                                </div>
                            </div>
                        )}

                        {visibleMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className="flex max-w-[85%] gap-2 items-end">
                                    {msg.role === "assistant" && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                            <Bot size={12} />
                                        </div>
                                    )}

                                    <div
                                        className={`px-4 py-3 rounded-2xl text-sm ${msg.role === "user"
                                            ? "bg-gray-900 text-white rounded-br-sm shadow-sm"
                                            : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm prose prose-sm max-w-none prose-p:leading-snug prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5"
                                            }`}
                                    >
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>

                                    {msg.role === "user" && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                            <User size={12} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && isInitialized && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                        <Bot size={12} />
                                    </div>
                                    <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && !hasFailedInit && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-700">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold">Error</p>
                                    <p className="text-red-600 break-words">{error}</p>
                                </div>
                            </div>
                        )}

                        {!isLoading && visibleMessages.length === 0 && (
                            <div className="space-y-2 pt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Try asking...</p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSuggestion(s)}
                                            className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all duration-200 cursor-pointer"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="relative flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about your career outlook..."
                                disabled={isLoading}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-1.5 text-emerald-600 disabled:text-gray-300 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            AI-powered · Suggestions are not guarantees
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
