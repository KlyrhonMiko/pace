"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, X, Minimize2, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { useAIInsightsStore } from "./ai-insights-store";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function ModelInsightsChat({ modelsData }: { modelsData: any }) {
    const { isOpen, setIsOpen, initialQuery, clearQuery } = useAIInsightsStore();
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm the P.A.C.E. Model Insight Assistant. I can help you understand the deployed ML models, their performance metrics, and input features. What would you like to know?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized]);

    // Auto-submit initial query
    useEffect(() => {
        if (initialQuery && !isTyping) {
            submitMessage(initialQuery);
            clearQuery();
        }
    }, [initialQuery]);

    const submitMessage = async (text: string) => {
        const userMsg = text.trim();
        if (!userMsg) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userMsg
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsTyping(true);
        setIsMinimized(false);

        try {
            const chatHistory = messages
                .filter(m => m.id !== "welcome")
                .map(m => ({ role: m.role, content: m.content }));

            chatHistory.push({ role: "user", content: userMsg });

            const response = await fetch("/api/ai-models-insight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: chatHistory,
                    modelsData: modelsData
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to fetch response");
            }

            const assistantMessageId = (Date.now() + 1).toString();
            setMessages(prev => [
                ...prev,
                { id: assistantMessageId, role: "assistant", content: "" }
            ]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No response body");

            let assistantText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantText += chunk;

                setMessages(prev => prev.map(m =>
                    m.id === assistantMessageId
                        ? { ...m, content: assistantText }
                        : m
                ));
            }

        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: `**Error:** I'm having trouble connecting right now. ${error.message}`
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;
        const text = input;
        setInput("");
        await submitMessage(text);
    };

    // Chat Trigger Button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 group z-50"
            >
                <Sparkles size={24} className="group-hover:animate-pulse" />
            </button>
        );
    }

    // Chat Interface
    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${isMinimized ? "w-80 h-16" : "w-[380px] h-[600px] max-h-[85vh]"
                } sm:right-6 right-0 max-w-full`}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white cursor-pointer"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">AI Model Insights</h3>
                        {!isMinimized && <p className="text-[10px] text-emerald-100 font-medium">Ask me about the ML models</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1.5 hover:bg-white/20 hover:text-red-200 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Body (hidden if minimized) */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                        {messages.map((msg) => (
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
                                            ? "bg-gray-900 text-white rounded-br-sm"
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

                        {isTyping && (
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
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form onSubmit={handleSubmit} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about model performance..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 p-1.5 text-emerald-600 disabled:text-gray-300 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
