/**
 * @clydra-core
 * Convo Core - Chat Panel Component
 *
 * Main chat interface with message list, input, model selection, and usage tracking
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Loader2 } from "lucide-react";
import useSWRMutation from "swr/mutation";
import { Button } from "../ui/button";
import { ModelSelect } from "./ModelSelect"; // @fluid-ui
import { ChatModel, MODEL_ALIASES } from "@/types/chatModels"; // @fluid-ui
import UpgradeCTA from "../UpgradeCTA";
import ChatMessage from "./ChatMessage"; // Import the proper ChatMessage component

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

// SWR fetcher for sending messages
const sendMessage = async (
  url: string,
  { arg }: { arg: { messages: Message[]; model: ChatModel; threadId?: string } }
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    } else {
      // If not JSON, use status text
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  // Check if successful response is JSON
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
  const [model, setModel] = useState<ChatModel>("openai/gpt-4o");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing messages when threadId changes
  useEffect(() => {
    if (threadId) {
      const loadMessages = async () => {
        try {
          const response = await fetch(`/api/messages/${threadId}`);
          if (response.ok) {
            // Check if response is JSON before parsing
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              setMessages(data || []);
            } else {
              console.warn("API returned non-JSON response for messages");
              setMessages([]);
            }
          } else {
            console.warn(`Failed to load messages: ${response.status} ${response.statusText}`);
            setMessages([]);
          }
        } catch (error) {
          console.error("Failed to load messages:", error);
          setMessages([]);
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [threadId]);

  // Auto-scroll to bottom when messages change - optimized
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // SWR mutation for sending messages - optimized callbacks
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

  // Handle form submission - optimized with useCallback
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isMutating || !user) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      id: Date.now().toString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      await trigger({
        messages: newMessages,
        model,
        threadId,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [input, isMutating, user, messages, model, threadId, trigger]);

  // Handle keyboard shortcuts - optimized with useCallback
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Optimized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  // Memoized suggestions to prevent re-renders
  const suggestions = useMemo(() => [
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
  ], []);

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
    <section className="flex flex-col h-full bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(11,165,236,0.05),transparent_50%)] pointer-events-none" />
      
      {/* @ui-clean - Chat container with max-w-screen-md centric */}
      <div className="flex flex-col h-full mx-auto w-full max-w-screen-md px-4">
        
        {/* @ui-clean - Sticky badge top-right */}
        <div className="sticky top-2 self-end z-10 mb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md border border-primary-500/20 text-primary-500 px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" /> 
            Using&nbsp;{MODEL_ALIASES[model]}
          </span>
        </div>
        {/* @ui-clean - End sticky badge */}

        {/* Messages area with proper height and scrolling */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4 chat-scroll">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center text-center space-y-6 py-16 lg:py-24">
                <h1 className="text-4xl lg:text-6xl font-extrabold">
                  Hello,<span className="text-primary-500"> {user?.firstName}!</span>
                </h1>
                <p className="text-xl font-medium">
                  How can I assist you today?
                </p>

                <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl p-2 shadow-lg">
                  <ModelSelect model={model} setModel={setModel} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-center mt-10">
                  {suggestions.map((suggestion, index) => (
                    <button 
                      key={index}
                      onClick={() => setInput(suggestion.description)}
                      className="group p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:border-[#0BA5EC]/50 hover:bg-white/80 transition-all duration-300 text-left shadow-sm hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-700"
                      style={{ animationDelay: `${(index + 4) * 100}ms` }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-2xl bg-gradient-to-br from-[#0BA5EC]/20 to-[#0BA5EC]/10 rounded-xl p-2 group-hover:scale-110 transition-transform duration-300">
                          {suggestion.icon}
                        </div>
                        <div className="text-lg font-semibold text-gray-800 group-hover:text-[#0BA5EC] transition-colors duration-300">
                          {suggestion.title}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {suggestion.description}
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div 
                    key={message.id || index}
                    className="animate-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ChatMessage
                      content={message.content}
                      role={message.role as "user" | "assistant"}
                      timestamp={new Date()}
                    />
                  </div>
                ))}

                {isMutating && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-6 py-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Loader2 className="w-5 h-5 animate-spin text-[#0BA5EC]" />
                          <div className="absolute inset-0 w-5 h-5 rounded-full bg-[#0BA5EC]/20 animate-ping" />
                        </div>
                        <span className="text-gray-600 font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* @ui-clean - Input bar with surface card + teal send button */}
        <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isMutating}
              autoFocus
              className="flex-1 resize-none bg-transparent text-text-main placeholder-text-muted border-none outline-none text-[16px] focus:outline-none focus:ring-0 selection:bg-primary-100 selection:text-text-main"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isMutating}
              className="rounded-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 shadow-sm/5 hover:shadow-md/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isMutating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
        {/* @ui-clean - End input bar */}
      </div>
      {/* @ui-clean - End chat container */}
    </section>
  );
}
