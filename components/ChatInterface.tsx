import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import ChatMessage from "./Chat/ChatMessage";
import { ChatErrorBoundary } from "./ErrorBoundary";

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
  releaseLock(): void;
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
    "google/gemini-2.5-flash-preview"
  );
  const [streamingMessage, setStreamingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Optimized model selection handler
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    setError(null); // Clear any previous errors
  }, []);

  // Optimized input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputMessage(e.target.value);
      setError(null); // Clear error on new input
    },
    []
  );

  // Updated models array - optimized for performance
  const models = useMemo(
    () => [
      {
        id: "google/gemini-2.5-flash-preview",
        name: "Gemini Flash",
        description: "Fast & free",
        color: "bg-blue-400",
      },
      {
        id: "anthropic/claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Best for reasoning",
        color: "bg-orange-400",
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        description: "Latest OpenAI",
        color: "bg-green-400",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        description: "Large language model",
        color: "bg-purple-400",
      },
      {
        id: "sarvamai/sarvam-m:free",
        name: "Sarvam M",
        description: "Wiki grounding",
        color: "bg-red-400",
      },
    ],
    []
  );

  // Optimized submit handler with proper error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim() || isLoading || isProcessing) return;

      const userMessage = inputMessage.trim();
      setInputMessage("");
      setError(null);
      setIsProcessing(true);

      try {
        // Use the correct API endpoint
        const response = (await fetch("/api/chat/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [...messages, { role: "user", content: userMessage }],
            stream: true,
            enableWebSearch: selectedModel === "anthropic/claude-3-5-sonnet-20241022",
            enableWikiGrounding: selectedModel === "sarvamai/sarvam-m:free",
          }),
        })) as StreamResponse;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader() as StreamReader;
        let partialMessage = "";
        setStreamingMessage("");

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                
                if (data === "[DONE]") {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    partialMessage += parsed.content;
                    setStreamingMessage(partialMessage);
                  }
                } catch {
                  // Handle non-JSON data or completion messages
                  console.log("Non-JSON data received:", data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Call the callback with the user message
        onSendMessage?.(userMessage, selectedModel);
        setStreamingMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [inputMessage, isLoading, isProcessing, selectedModel, messages, onSendMessage]
  );

  // Memoized empty state
  const emptyState = useMemo(
    () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-2xl">💬</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 max-w-md">
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
    <ChatErrorBoundary>
      <div className="flex flex-col h-full bg-gray-50">
      {/* Model selection pills */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                selectedModel === model.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${model.color}`}></div>
              <span className="text-sm font-medium">{model.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 text-sm">⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
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
                <div className="max-w-[80%] rounded-2xl p-4 bg-white shadow-sm">
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

      {/* Input form */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || isProcessing}
          />
          <button
            type="submit"
            disabled={isLoading || isProcessing || !inputMessage.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isProcessing ? "..." : "Send"}
          </button>
        </form>
        
        {/* Status indicators */}
        <div className="mt-2 text-xs text-gray-500">
          {selectedModel === "sarvamai/sarvam-m:free" && "✨ Wiki grounding enabled"}
          {selectedModel === "anthropic/claude-3-5-sonnet-20241022" && "🌐 Web search enabled"}
        </div>
      </div>
      </div>
    </ChatErrorBoundary>
  );
}
