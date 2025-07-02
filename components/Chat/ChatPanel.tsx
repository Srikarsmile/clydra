/**
 * @dashboard-redesign
 * Redesigned Chat Panel Component with fluid scrolling and smooth animations
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import useSWRMutation from "swr/mutation";
import { Button } from "../ui/button";
import { ChatModel, MODEL_ALIASES, getModelsByPlan } from "@/types/chatModels";
import UpgradeCTA from "../UpgradeCTA";
import ChatMessage from "./ChatMessage";
import InputBar from "./InputBar"; // @dashboard-redesign

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
}

interface ChatResponse {
  message: {
    role: "assistant";
    content: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// @performance - Streaming message sender for reduced latency
const sendStreamingMessage = async (
  url: string,
  {
    arg,
  }: {
    arg: {
      messages: Message[];
      model: ChatModel;
      threadId?: string;
      enableWebSearch?: boolean;
    };
  },
  onChunk: (content: string) => void
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...arg, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  let fullMessage = "";

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
              fullMessage += parsed.content;
              onChunk(parsed.content);
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    message: {
      role: "assistant" as const,
      content: fullMessage,
    },
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  };
};

// Fallback non-streaming fetcher
const sendMessage = async (
  url: string,
  {
    arg,
  }: {
    arg: {
      messages: Message[];
      model: ChatModel;
      threadId?: string;
      enableWebSearch?: boolean;
    };
  }
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...arg, stream: false }),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      } catch {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }
    } else {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    throw new Error("Server returned non-JSON response");
  }
};

interface ChatPanelProps {
  threadId?: string;
}

export default function ChatPanel({ threadId }: ChatPanelProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ChatModel>("anthropic/claude-sonnet-4");
  const [enableWebSearch] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>(""); // @performance - For live streaming
  const [isStreaming, setIsStreaming] = useState(false); // @performance - Track streaming state

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);

  // @dashboard-redesign - Load messages when threadId changes
  useEffect(() => {
    if (!threadId || !user) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${threadId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedMessages: Message[] = data.map(
            (msg: { role: string; content: string; id?: number }) => ({
              role: msg.role,
              content: msg.content,
              id: msg.id?.toString(),
            })
          );
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();
  }, [threadId, user]);

  // @dashboard-redesign - Clear messages when no threadId (new chat)
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
    }
  }, [threadId]);

  // @fluid-scroll - Enhanced smooth scroll with proper timing and user intent detection
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    // Only auto-scroll if user is near bottom or if forced (new message)
    if (force || isNearBottom) {
      setIsAutoScrolling(true);

      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });

        // Reset auto-scroll flag after animation
        setTimeout(() => setIsAutoScrolling(false), 300);
      });
    }
  }, []);

  // @fluid-scroll - Smart auto-scroll logic
  useEffect(() => {
    const currentLength = messages.length;

    if (currentLength > previousMessagesLength.current) {
      // New message added, scroll to bottom
      scrollToBottom(true);
    }

    previousMessagesLength.current = currentLength;
  }, [messages, scrollToBottom]);

  // @fluid-scroll - Intersection Observer for detecting scroll position
  useEffect(() => {
    if (!messagesEndRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isAutoScrolling) {
            // User manually scrolled to bottom
            setIsAutoScrolling(false);
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(messagesEndRef.current);

    return () => observer.disconnect();
  }, [isAutoScrolling]);

  // @performance - Streaming-first approach with fallback
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isStreaming || !user) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      id: Date.now().toString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    // Immediate scroll for user message
    requestAnimationFrame(() => scrollToBottom(true));

    try {
      // @performance - Optimized streaming with keepalive and priority hints
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch("/api/chat/proxy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // @performance - Connection optimization hints
          "Connection": "keep-alive",
          "Keep-Alive": "timeout=5, max=1000",
        },
        body: JSON.stringify({ 
          messages: newMessages, 
          model, 
          threadId, 
          enableWebSearch, 
          stream: true 
        }),
        signal: controller.signal,
        // @performance - Browser optimization hints
        cache: "no-cache",
        priority: "high",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      let fullMessage = "";

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
                  fullMessage += parsed.content;
                  setStreamingMessage(fullMessage);
                  // @performance - Throttled scrolling for better performance
                  requestAnimationFrame(() => scrollToBottom(false));
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Add the complete streamed message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: fullMessage,
          id: (Date.now() + 1).toString(),
        },
      ]);
      setStreamingMessage("");
      setShowUpgrade(false);
    } catch (error: unknown) {
      console.error(
        "Streaming failed, falling back to regular request:",
        error
      );

      // @performance - Fallback to non-streaming if streaming fails
      try {
        const response = await fetch("/api/chat/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            model,
            threadId,
            enableWebSearch,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            id: (Date.now() + 1).toString(),
          },
        ]);
        setShowUpgrade(false);
      } catch (fallbackError) {
        console.error("Both streaming and fallback failed:", fallbackError);
        if (
          fallbackError instanceof Error &&
          fallbackError.message.includes("Daily message limit exceeded")
        ) {
          setShowUpgrade(true);
        }
      }

      setStreamingMessage("");
    } finally {
      setIsStreaming(false);
    }
  }, [
    input,
    isStreaming,
    user,
    messages,
    model,
    threadId,
    enableWebSearch,
    scrollToBottom,
  ]);

  // Legacy SWR mutation for compatibility (not used in main flow)
  const { trigger, isMutating } = useSWRMutation(
    "/api/chat/proxy",
    sendMessage,
    {
      onSuccess: useCallback((data: ChatResponse) => {
        setMessages((prev) => [...prev, data.message]);
        setShowUpgrade(false);
      }, []),
      onError: useCallback((error: Error) => {
        console.error("Chat error:", error);
        if (error.message.includes("Daily message limit exceeded")) {
          setShowUpgrade(true);
        }
      }, []),
    }
  );

  // @dashboard-redesign - Retry last message with different model
  const handleRetryWithModel = useCallback(
    async (newModel: ChatModel) => {
      if (isMutating || !user || messages.length === 0) return;

      // Find the last user message
      const lastUserMessageIndex = messages.findLastIndex(
        (msg) => msg.role === "user"
      );
      if (lastUserMessageIndex === -1) return;

      // Get messages up to and including the last user message (exclude any AI responses after it)
      const messagesToSend = messages.slice(0, lastUserMessageIndex + 1);

      // Remove any AI responses after the last user message
      setMessages(messagesToSend);

      // Set the new model
      setModel(newModel);

      try {
        await trigger({
          messages: messagesToSend,
          model: newModel,
          threadId,
          enableWebSearch,
        });
      } catch (error) {
        console.error("Failed to retry with new model:", error);
      }
    },
    [isMutating, user, messages, threadId, enableWebSearch, trigger]
  );

  // @dashboard-redesign - Switch model and continue conversation
  const handleModelChange = useCallback(
    (newModel: ChatModel) => {
      if (newModel !== model) {
        // Simply switch to the new model and continue the conversation
        setModel(newModel);
      }
    },
    [model]
  );

  // @dashboard-redesign - Suggestions for empty state
  const suggestions = useMemo(
    () => [
      {
        icon: "✨",
        title: "Creative Writing",
        description: "Help me write a story or poem",
      },
      {
        icon: "🧠",
        title: "Problem Solving",
        description: "Analyze and solve complex problems",
      },
      {
        icon: "💻",
        title: "Code Review",
        description: "Review and improve my code",
      },
      {
        icon: "📊",
        title: "Data Analysis",
        description: "Help analyze data and insights",
      },
    ],
    []
  );

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to use chat</p>
        </div>
      </div>
    );
  }

  if (showUpgrade) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <UpgradeCTA />
          <Button
            variant="outline"
            onClick={() => setShowUpgrade(false)}
            className="w-full mt-4"
          >
            Continue with Free Plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 relative overflow-hidden">
      {/* @dashboard-redesign - Chat container expanded to full width */}
      <div className="flex-1 flex flex-col w-full px-6 pb-32 min-h-0">
        {/* @dashboard-redesign - Single model badge in top-right corner */}
        <div className="sticky top-2 self-end z-10 mb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface/80 backdrop-blur-md border border-brand-500/20 text-brand-500 px-4 py-2 text-sm shadow-sm transition-all duration-300">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Using {MODEL_ALIASES[model]}
          </span>
        </div>

        {/* @fluid-scroll - Enhanced messages area with smooth scrolling */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 chat-scroll scroll-smooth"
          style={{ height: "100%", overflowY: "auto" }}
        >
          <div className="space-y-6 py-4 pb-6 min-h-full">
            {messages.length === 0 ? (
              // @dashboard-redesign - Empty state with smooth animations
              <div className="flex flex-col items-center space-y-6 py-16 animate-fade-in-up">
                <h1 className="text-4xl font-bold text-center">
                  Hello{" "}
                  <span className="text-brand-500">{user?.firstName}!</span>
                </h1>
                <p className="text-xl text-text-muted text-center">
                  How can I assist you today?
                </p>

                {/* @dashboard-redesign - 4 suggestion cards with stagger animation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full mt-8 animate-stagger">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion.description)}
                      className="group p-4 bg-surface border border-gray-200 rounded-xl hover:border-brand-300 hover:shadow-lg transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-xl transition-transform duration-300 group-hover:scale-110">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium text-text-main">
                          {suggestion.title}
                        </div>
                      </div>
                      <div className="text-sm text-text-muted">
                        {suggestion.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* @fluid-scroll - Message list with expanded widths for larger screens */}
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                    style={{
                      animationDelay: `${Math.min(index * 50, 500)}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-4xl ${
                        message.role === "assistant"
                          ? "bg-surface text-text-main shadow-md"
                          : "bg-brand-50 text-brand-600 shadow-sm"
                      } rounded-2xl px-6 py-4 relative group transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]`}
                    >
                      {/* Show model name for assistant messages */}
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-brand-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          {MODEL_ALIASES[model]}
                        </div>
                      )}
                      <ChatMessage
                        content={message.content}
                        role={message.role as "user" | "assistant"}
                        timestamp={new Date()}
                      />

                      {/* @dashboard-redesign - Retry button for assistant messages */}
                      {message.role === "assistant" &&
                        index === messages.length - 1 && (
                          <div className="absolute -bottom-12 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="flex gap-2 text-xs">
                              {getModelsByPlan("pro")
                                .filter((m: ChatModel) => m !== model)
                                .slice(0, 3)
                                .map((altModel: ChatModel) => (
                                  <button
                                    key={altModel}
                                    onClick={() =>
                                      handleRetryWithModel(altModel)
                                    }
                                    disabled={isMutating}
                                    className="px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 disabled:opacity-50 transform hover:scale-105"
                                  >
                                    Retry with {MODEL_ALIASES[altModel]}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {/* @performance - Real-time streaming message display */}
                {streamingMessage && (
                  <div className="flex justify-start animate-fade-in-up">
                    <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-4xl bg-surface text-text-main shadow-md rounded-2xl px-6 py-4 relative">
                      {/* Show model name when there's actual output */}
                      <div className="flex items-center gap-2 mb-2 text-xs text-brand-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                        {MODEL_ALIASES[model]}
                      </div>
                      <ChatMessage
                        content={streamingMessage}
                        role="assistant"
                        timestamp={new Date()}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-8" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* @dashboard-redesign - InputBar component with model selector */}
      <InputBar
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isStreaming || isMutating} // @performance - Disable during streaming
        placeholder="Type your message..."
        selectedModel={model}
        onModelChange={handleModelChange}
        userPlan="pro"
      />
    </div>
  );
}
