import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

type ChatModel = "gpt-4o" | "claude-sonnet" | "gemini-pro";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: ChatModel;
  timestamp: Date;
  streaming?: boolean;
}

interface ModelConfig {
  id: ChatModel;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  quota?: string;
}

export default function ChatPanel() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<ChatModel>("gemini-pro");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Feature flag check
  const isChatEnabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === "true";

  const models: ModelConfig[] = [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Most capable OpenAI model",
      icon: "🤖",
      color: "bg-green-500",
      enabled: true,
      quota: "0/0", // Updated from API
    },
    {
      id: "claude-sonnet",
      name: "Claude Sonnet 3.5",
      description: "Anthropic's reasoning model",
      icon: "🎭",
      color: "bg-purple-500",
      enabled: true,
      quota: "0/0",
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      description: "Google's latest model",
      icon: "✨",
      color: "bg-blue-500",
      enabled: true,
      quota: "0/10M",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMessageId = () =>
    `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const assistantMessageId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      model: selectedModel,
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue("");
    setIsStreaming(true);
    setStreamingMessageId(assistantMessageId);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: inputValue },
          ],
          model: selectedModel,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, streaming: false } : m
        )
      );
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Request was cancelled
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      } else {
        // Show error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `Error: ${error.message}`,
                  streaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  if (!isChatEnabled) {
    return (
      <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-title-3 font-semibold text-text-main mb-2">
            Chat Feature Disabled
          </h3>
          <p className="text-body text-text-muted">
            The multi-model chat feature is currently disabled. Please contact
            support to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden h-[700px] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-title-3 font-semibold text-text-main tracking-tight">
            AI Chat
          </h3>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-text-muted hover:text-text-main text-caption-1 font-medium transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Model Selection Pills */}
        <div className="flex flex-wrap gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => !isStreaming && setSelectedModel(model.id)}
              disabled={!model.enabled || isStreaming}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-caption-1 font-medium transition-all duration-200 ${
                selectedModel === model.id
                  ? "border-primary bg-primary/10 text-primary shadow-primary-glow"
                  : model.enabled
                    ? "border-border/30 bg-surface/60 text-text-muted hover:border-primary/30 hover:text-text-main"
                    : "border-border/20 bg-surface/30 text-text-muted/50 cursor-not-allowed"
              }`}
            >
              <span>{model.icon}</span>
              <span>{model.name}</span>
              {model.quota && (
                <span className="text-xs opacity-60">({model.quota})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h4 className="text-title-3 font-semibold text-text-main mb-2">
              Start a conversation
            </h4>
            <p className="text-body text-text-muted max-w-md mx-auto">
              Choose a model above and ask me anything. I can help with writing,
              analysis, coding, and more.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.model === "gpt-4o"
                      ? "bg-green-500/20"
                      : message.model === "claude-sonnet"
                        ? "bg-purple-500/20"
                        : "bg-blue-500/20"
                  }`}
                >
                  <span className="text-sm">
                    {message.model === "gpt-4o"
                      ? "🤖"
                      : message.model === "claude-sonnet"
                        ? "🎭"
                        : "✨"}
                  </span>
                </div>
              )}

              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-white ml-auto"
                    : "bg-surface border border-border/30"
                }`}
              >
                <div
                  className={`text-callout ${
                    message.role === "user" ? "text-white" : "text-text-main"
                  }`}
                >
                  {message.content}
                  {message.streaming && (
                    <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                  )}
                </div>

                {message.role === "assistant" && (
                  <div className="text-caption-2 text-text-muted mt-2 flex items-center space-x-2">
                    <span>
                      {models.find((m) => m.id === message.model)?.name}
                    </span>
                    <span>•</span>
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border/30">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              placeholder={`Message ${models.find((m) => m.id === selectedModel)?.name}...`}
              disabled={isStreaming}
              className="w-full p-4 bg-surface border border-border/30 rounded-2xl text-callout text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {isStreaming ? (
            <button
              onClick={handleStopGeneration}
              className="px-6 py-4 bg-accent text-white rounded-2xl font-medium text-callout hover:bg-accent/90 transition-colors flex items-center space-x-2"
            >
              <span>⏹️</span>
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-6 py-4 bg-primary text-white rounded-2xl font-medium text-callout hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <span>📤</span>
              <span>Send</span>
            </button>
          )}
        </div>

        <div className="mt-3 text-caption-2 text-text-muted text-center">
          Press Enter to send • Model:{" "}
          {models.find((m) => m.id === selectedModel)?.name}
        </div>
      </div>
    </div>
  );
}
