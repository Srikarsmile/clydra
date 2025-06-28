import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Model {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface ChatInterfaceProps {
  messages?: Message[];
  onSendMessage?: (message: string, model: string) => void;
  isLoading?: boolean;
  chatId?: string;
}

// Removed unused ChatHistory interface

interface StreamReader {
  read(): Promise<{ done: boolean; value: Uint8Array }>;
}

interface StreamResponse extends Response {
  body: ReadableStream<Uint8Array>;
}

// Memoized models array outside component
const models: Model[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Latest OpenAI model",
    color: "bg-green-500",
  },
  {
    id: "sonnet",
    name: "Sonnet",
    description: "Claude 3.5 Sonnet",
    color: "bg-purple-500",
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google Gemini Pro",
    color: "bg-blue-500",
  },
];

export default function ChatInterface({
  messages = [],
  onSendMessage,
  isLoading = false,
}: ChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [inputMessage, setInputMessage] = useState("");
  // Removed unused chatHistory state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState("");

  // Removed unused chat history loading

  // Optimized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  // Optimized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);

  // Optimized model selection handler
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  // Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    try {
      const response = (await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, { role: "user", content: userMessage }],
          stream: true,
        }),
      })) as StreamResponse;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader() as StreamReader;
      let partialMessage = "";
      setStreamingMessage("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                partialMessage += data.choices[0].delta.content;
                setStreamingMessage(partialMessage);
              }
            } catch (e) {
              console.error("Error parsing SSE message:", e);
            }
          }
        }
      }

      onSendMessage?.(userMessage, selectedModel);
      setStreamingMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [inputMessage, isLoading, selectedModel, messages, onSendMessage]);

  // Memoized empty state
  const emptyState = useMemo(() => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-neo-wave rounded-2xl flex items-center justify-center mx-auto shadow-primary-glow">
          <span className="text-2xl">💬</span>
        </div>
        <div>
          <h3 className="text-title-3 font-semibold text-text-main mb-2">
            Start a conversation
          </h3>
          <p className="text-body text-text-muted max-w-md">
            Choose a model above and ask anything. I&apos;m here to help with
            your questions and tasks.
          </p>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Simplified model selection pills */}
      <div className="p-4 border-b border-border/30 bg-white/50">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                selectedModel === model.id
                  ? "bg-primary text-white shadow-primary-glow"
                  : "bg-surface text-text-muted hover:text-text-main hover:bg-surface/80 border border-border/30"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${model.color}`}></div>
              <span className="text-callout font-medium">{model.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? emptyState : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-white shadow-primary-glow"
                      : "bg-surface border border-border/30 text-text-main"
                  }`}
                >
                  <div className="text-body whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-white/70"
                        : "text-text-muted"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl p-4 bg-surface/60">
                  <p className="text-body whitespace-pre-wrap">
                    {streamingMessage}
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Optimized input */}
      <div className="p-4 border-t border-border/30 bg-white/50">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <select
                value={selectedModel}
                onChange={(e) => handleModelSelect(e.target.value)}
                className="px-4 py-2 rounded-xl bg-surface border border-border/50 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="anthropic/claude-3-sonnet-20240229">
                  Claude 3 Sonnet
                </option>
                <option value="anthropic/claude-3-opus-20240229">
                  Claude 3 Opus
                </option>
                <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                <option value="google/gemini-1.0-pro">Gemini Pro</option>
                <option value="mistral/mistral-large-2024-01">
                  Mistral Large
                </option>
              </select>
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-xl bg-surface border border-border/50 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:shadow-primary-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
