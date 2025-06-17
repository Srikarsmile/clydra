import React, { useState, useRef, useEffect } from "react";

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
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;

    onSendMessage?.(inputMessage, selectedModel);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Model Selection Pills */}
      <div className="p-4 border-b border-border/30 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
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
        {messages.length === 0 ? (
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
                  Choose a model above and ask anything. I'm here to help with
                  your questions and tasks.
                </p>
              </div>
            </div>
          </div>
        ) : (
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

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border/30 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse animation-delay-100"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse animation-delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Prompt Input */}
      <div className="p-4 border-t border-border/30 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-body text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-primary text-white p-3 rounded-xl hover:shadow-primary-glow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
