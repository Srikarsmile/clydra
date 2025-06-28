import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import ChatMessage from "./Chat/ChatMessage"; // Import the proper ChatMessage component

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onUpgradeClick: () => void;
  userPlan?: "free" | "pro" | "max";
}

const MODEL_OPTIONS = [
  { id: "openai/gpt-4o", name: "GPT-4o", plan: "free" },
  { id: "google/gemini-2.5-flash", name: "Gemini Flash", plan: "free" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude Sonnet", plan: "pro" },
  { id: "google/gemini-2.5-pro", name: "Gemini Pro", plan: "pro" },
  { id: "anthropic/claude-3-opus", name: "Claude Opus", plan: "max" },
];

export default function ChatPanel({
  onUpgradeClick,
  userPlan = "pro",
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // @or Debug logging
    console.log("Sending chat request:", {
      model: selectedModel,
      messageCount: messages.length + 1,
    });

    try {
      // @or Call real OpenRouter API with credentials
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // @or Include cookies for Clerk auth
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // @or Check if response is HTML (redirect/error page)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error("Authentication required. Please sign in again.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.message.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Chat error:", error);

      // Show error message in chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F9FF]">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <h1 className="text-4xl font-bold text-[#0369A1] mb-6">
              How can I help you?
            </h1>

            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
              {[
                "✨ Write a story",
                "🔍 Explain a concept",
                "💻 Debug my code",
                "📊 Analyze data",
                "🎨 Creative ideas",
                "📝 Write content",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(suggestion.split(" ").slice(1).join(" "))}
                  className="px-4 py-2 bg-white text-[#0369A1] rounded-full border border-[#0369A1]/20 hover:bg-[#0369A1]/10 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {MODEL_OPTIONS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedModel === model.id
                      ? "bg-[#0369A1] text-white"
                      : "bg-white text-[#0369A1] border border-[#0369A1]/20 hover:bg-[#0369A1]/10"
                  }`}
                >
                  {model.name}
                  <span className="ml-1 text-[10px] opacity-60">
                    {model.plan.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                role={message.role as "user" | "assistant"}
                timestamp={message.timestamp}
              />
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="max-w-[70%] p-4 rounded-2xl bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0369A1] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[#0369A1]">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area with Model Selection */}
      <div className="p-6 bg-white border-t border-[#E5E7EB]">
        {/* Model Selector */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                disabled={
                  (model.plan === "pro" && userPlan === "free") ||
                  (model.plan === "max" && userPlan !== "max")
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedModel === model.id
                    ? "bg-[#0369A1] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {model.name}
                <span className="ml-1 text-[10px] opacity-60">
                  {model.plan.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {/* Upgrade prompt for locked models */}
          {((selectedModel.includes("claude") || selectedModel.includes("gemini-2.5-pro")) && userPlan === "free") || 
           (selectedModel.includes("opus") && userPlan !== "max") ? (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
              <span className="text-sm text-gray-700">
                🔒 This model requires {selectedModel.includes("opus") ? "Max" : "Pro"} plan
              </span>
              <button
                onClick={onUpgradeClick}
                className="text-sm bg-[#0369A1] text-white px-3 py-1 rounded-md hover:bg-[#0284C7] transition-colors"
              >
                Upgrade
              </button>
            </div>
          ) : null}
        </div>

        {/* Chat Input */}
        <div className="border border-gray-300 rounded-2xl bg-white focus-within:border-[#0369A1] transition-colors">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Gemini..."
                disabled={isLoading}
                className="w-full p-4 pr-12 rounded-2xl bg-[#F0F9FF] resize-none focus:outline-none focus:ring-2 focus:ring-[#0369A1] transition-all text-[15px] text-[#0369A1] placeholder-[#0369A1]/40"
                rows={1}
                style={{ minHeight: "60px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-4 rounded-2xl bg-[#0369A1] text-white hover:bg-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-lg">↑</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
