import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import ChatMessage from "./Chat/ChatMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages?: Message[];
  onSendMessage?: (message: string, model: string) => void;
  isLoading?: boolean;
}

interface StreamReader {
  read(): Promise<{ done: boolean; value: Uint8Array }>;
}

interface StreamResponse extends Response {
  body: ReadableStream<Uint8Array> | null;
}

export default function ChatInterface({
  messages = [],
  onSendMessage,
  isLoading = false,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    "anthropic/claude-3-sonnet-20240229"
  );
  const [streamingMessage, setStreamingMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Removed unused chat history loading

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Optimized model selection handler
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  // Optimized input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputMessage(e.target.value);
    },
    []
  );

  // Models array - memoized
  const models = useMemo(
    () => [
      {
        id: "anthropic/claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        description: "Best for most tasks",
        color: "bg-orange-400",
      },
      {
        id: "anthropic/claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Most capable",
        color: "bg-purple-400",
      },
      {
        id: "openai/gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Latest OpenAI model",
        color: "bg-green-400",
      },
      {
        id: "google/gemini-1.0-pro",
        name: "Gemini Pro",
        description: "Google's advanced model",
        color: "bg-blue-400",
      },
      {
        id: "mistral/mistral-large-2024-01",
        name: "Mistral Large",
        description: "Powerful reasoning",
        color: "bg-red-400",
      },
    ],
    []
  );

  // Optimized submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [inputMessage, isLoading, selectedModel, messages, onSendMessage]
  );

  // Memoized empty state
  const emptyState = useMemo(
    () => (
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
    ),
    []
  );

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

      {/* Messages List - now using proper ChatMessage component */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          emptyState
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                role={message.role as "user" | "assistant"}
                timestamp={message.timestamp}
              />
            ))}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl p-4 bg-surface/60">
                  <ChatMessage
                    content={streamingMessage}
                    role="assistant"
                    timestamp={new Date()}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Optimized input */}
      <div className="p-4 border-t border-border/30 bg-surface/50">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <select
                value={selectedModel}
                onChange={(e) => handleModelSelect(e.target.value)}
                className="px-4 py-2 rounded-xl bg-surface border border-gray-200/50 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-200 shadow-sm/5"
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
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 rounded-xl bg-surface border border-gray-200/50 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-200 selection:bg-brand-200 selection:text-text-main shadow-sm/5"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm/5 hover:shadow-md/10"
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
