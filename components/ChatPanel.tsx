import React, { useState, useRef, useEffect } from "react";

// @or Simple utility for classnames (inline replacement for cn)
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatModel {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
  features: string[];
  category: "basic" | "advanced" | "specialized";
  contextWindow?: number;
  pricePerToken?: string;
}

interface ChatPanelProps {
  onUpgradeClick: () => void;
  userPlan: "free" | "pro";
}

const CHAT_MODELS: ChatModel[] = [
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and reliable for everyday tasks",
    isPro: false,
    category: "basic",
    features: ["Quick responses", "General knowledge", "Basic coding"],
    contextWindow: 16385,
    pricePerToken: "$0.0015/1K",
  },
  {
    id: "anthropic/claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    description: "Balanced intelligence and speed",
    isPro: true,
    category: "advanced",
    features: ["Complex reasoning", "Code generation", "Technical writing"],
    contextWindow: 200000,
    pricePerToken: "$0.015/1K",
  },
  {
    id: "anthropic/claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Anthropic's most capable model",
    isPro: true,
    category: "specialized",
    features: ["Expert analysis", "Complex tasks", "Research assistance"],
    contextWindow: 200000,
    pricePerToken: "$0.025/1K",
  },
  {
    id: "google/gemini-1.0-pro",
    name: "Gemini Pro",
    description: "Google's latest model with advanced reasoning",
    isPro: true,
    category: "advanced",
    features: ["Strong math", "Multilingual", "Creative writing"],
    contextWindow: 128000,
    pricePerToken: "$0.0015/1K",
  },
  {
    id: "mistral/mistral-large-2024-01",
    name: "Mistral Large",
    description: "High-performance model with strong reasoning",
    isPro: true,
    category: "advanced",
    features: ["Efficient processing", "Accurate responses", "Multilingual"],
    contextWindow: 32768,
    pricePerToken: "$0.008/1K",
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Latest GPT-4 with enhanced capabilities",
    isPro: true,
    category: "specialized",
    features: ["Advanced reasoning", "Expert coding", "Complex analysis"],
    contextWindow: 128000,
    pricePerToken: "$0.01/1K",
  },
];

interface ModelOptionProps {
  model: ChatModel;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

const ModelOption = ({
  model,
  isSelected,
  isLocked,
  onSelect,
}: ModelOptionProps) => (
  <button
    onClick={onSelect}
    className={cn(
      "w-full p-3 text-left rounded-xl transition-all",
      isSelected ? "bg-[#F0F9FF]" : "hover:bg-[#F0F9FF]"
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#0369A1]">{model.name}</span>
          {isLocked && <span className="text-sm">🔒</span>}
        </div>
        <p className="text-sm text-[#0369A1]/60 mt-1">{model.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-[#0369A1]/70">
          <span>Context: {(model.contextWindow! / 1000).toFixed(0)}K</span>
          <span>•</span>
          <span>{model.pricePerToken}</span>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mt-2">
      {model.features.map((feature, i) => (
        <span
          key={i}
          className="px-2 py-0.5 text-xs rounded-full bg-[#E0F2FE] text-[#0369A1]"
        >
          {feature}
        </span>
      ))}
    </div>
  </button>
);

export default function ChatPanel({
  onUpgradeClick,
  userPlan = "pro",
}: ChatPanelProps) {
  const [selectedModel, setSelectedModel] = useState<ChatModel["id"]>(
    "openai/gpt-3.5-turbo"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

  // Close model select on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelSelectRef.current &&
        !modelSelectRef.current.contains(event.target as Node)
      ) {
        setShowModelSelect(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleModelSelect = (modelId: ChatModel["id"]) => {
    const model = CHAT_MODELS.find((m) => m.id === modelId);
    if (model?.isPro && userPlan === "free") {
      onUpgradeClick();
      return;
    }
    setSelectedModel(modelId);
  };

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
            <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
              <button
                onClick={() => setInputValue("How does AI work?")}
                className="px-4 py-2 rounded-full bg-white text-[#0369A1] hover:bg-[#E0F2FE] transition-all"
              >
                How does AI work?
              </button>
              <button
                onClick={() => setInputValue("Are black holes real?")}
                className="px-4 py-2 rounded-full bg-white text-[#0369A1] hover:bg-[#E0F2FE] transition-all"
              >
                Are black holes real?
              </button>
              <button
                onClick={() =>
                  setInputValue(
                    "How many Rs are in the word &quot;strawberry&quot;?"
                  )
                }
                className="px-4 py-2 rounded-full bg-white text-[#0369A1] hover:bg-[#E0F2FE] transition-all"
              >
                Count Rs in &quot;strawberry&quot;
              </button>
              <button
                onClick={() => setInputValue("What is the meaning of life?")}
                className="px-4 py-2 rounded-full bg-white text-[#0369A1] hover:bg-[#E0F2FE] transition-all"
              >
                What is the meaning of life?
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] p-4 rounded-2xl",
                    message.role === "user"
                      ? "bg-[#0369A1] text-white"
                      : "bg-white shadow-sm"
                  )}
                >
                  <p className="text-[15px] whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
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
      <div className="border-t border-[#BAE6FD] p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <button
                onClick={() => setShowModelSelect(!showModelSelect)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-[#F0F9FF] text-[#0369A1] hover:bg-[#E0F2FE] transition-all"
              >
                {CHAT_MODELS.find((m) => m.id === selectedModel)?.name}
                <span className="opacity-60">▼</span>
              </button>

              {showModelSelect && (
                <div
                  ref={modelSelectRef}
                  className="absolute bottom-full left-0 w-96 mb-2 p-2 bg-white rounded-2xl shadow-xl border border-[#BAE6FD]"
                >
                  <div className="mb-3 px-3">
                    <h3 className="text-lg font-semibold text-[#0369A1]">
                      {userPlan === "free"
                        ? "Unlock all models"
                        : "Available Models"}
                    </h3>
                    {userPlan === "free" && (
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-2xl font-bold text-[#0369A1]">
                          $8<span className="text-sm font-normal">/month</span>
                        </span>
                        <button
                          onClick={onUpgradeClick}
                          className="px-4 py-1.5 rounded-full bg-[#0369A1] text-white text-sm hover:bg-[#0284C7] transition-all"
                        >
                          Upgrade now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Basic Models */}
                  <div className="mb-4">
                    <div className="px-3 mb-2">
                      <h4 className="text-sm font-medium text-[#0369A1]/70">
                        Basic
                      </h4>
                    </div>
                    {CHAT_MODELS.filter((m) => m.category === "basic").map(
                      (model) => (
                        <ModelOption
                          key={model.id}
                          model={model}
                          isSelected={selectedModel === model.id}
                          isLocked={model.isPro && userPlan === "free"}
                          onSelect={() => {
                            if (model.isPro && userPlan === "free") {
                              onUpgradeClick();
                            } else {
                              handleModelSelect(model.id);
                              setShowModelSelect(false);
                            }
                          }}
                        />
                      )
                    )}
                  </div>

                  {/* Advanced Models */}
                  <div className="mb-4">
                    <div className="px-3 mb-2">
                      <h4 className="text-sm font-medium text-[#0369A1]/70">
                        Advanced
                      </h4>
                    </div>
                    {CHAT_MODELS.filter((m) => m.category === "advanced").map(
                      (model) => (
                        <ModelOption
                          key={model.id}
                          model={model}
                          isSelected={selectedModel === model.id}
                          isLocked={model.isPro && userPlan === "free"}
                          onSelect={() => {
                            if (model.isPro && userPlan === "free") {
                              onUpgradeClick();
                            } else {
                              handleModelSelect(model.id);
                              setShowModelSelect(false);
                            }
                          }}
                        />
                      )
                    )}
                  </div>

                  {/* Specialized Models */}
                  <div>
                    <div className="px-3 mb-2">
                      <h4 className="text-sm font-medium text-[#0369A1]/70">
                        Specialized
                      </h4>
                    </div>
                    {CHAT_MODELS.filter(
                      (m) => m.category === "specialized"
                    ).map((model) => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        isLocked={model.isPro && userPlan === "free"}
                        onSelect={() => {
                          if (model.isPro && userPlan === "free") {
                            onUpgradeClick();
                          } else {
                            handleModelSelect(model.id);
                            setShowModelSelect(false);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
