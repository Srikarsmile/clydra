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
// Removed unused cn import

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

// SWR fetcher for chat API - moved outside component to prevent re-creation
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
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json() as Promise<ChatResponse>;
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

  // @threads - Load messages for thread
  useEffect(() => {
    if (threadId) {
      const loadMessages = async () => {
        try {
          const response = await fetch(`/api/messages/${threadId}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          }
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [threadId]);

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

  // Auto-scroll to bottom when new messages arrive - optimized
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-focus input - optimized
  useEffect(() => {
    if (!isMutating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMutating]);

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

  // Memoized empty state
  const emptyState = useMemo(() => (
    <div className="max-w-4xl mx-auto py-16 lg:py-24">
      <h1 className="text-3xl lg:text-5xl font-semibold text-center text-txt-main mt-24 lg:mt-28 mb-8">
        How can I help you,&nbsp;{user?.firstName}?
      </h1>

      <div className="flex justify-center mb-8">
        <ModelSelect model={model} setModel={setModel} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
        {suggestions.map((suggestion, index) => (
          <button 
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left"
          >
            <div className="text-sm font-medium text-gray-900 mb-1">
              {suggestion.icon} {suggestion.title}
            </div>
            <div className="text-xs text-gray-500">
              {suggestion.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  ), [user?.firstName, model, setModel, suggestions]);

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
    <section className="flex flex-col h-full">
      {/* Simplified sticky badge */}
      <div className="sticky top-0 z-10 flex justify-center pt-4 bg-white/80">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-3 py-1 text-xs">
          <span className="w-2 h-2 rounded-full bg-brand-500" /> 
          Using&nbsp;{MODEL_ALIASES[model]}
        </span>
      </div>

      {/* Messages area - optimized */}
      <div className="flex-1 overflow-y-auto pb-24">
        {messages.length === 0 ? emptyState : (
          <div className="flex flex-col w-full px-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-prose rounded-lg shadow-sm px-4 py-3 ${
                    message.role === "user"
                      ? "bg-brand/10 text-brand"
                      : "bg-white border"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isMutating && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                    <span className="text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Optimized input area */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 right-0 left-64 z-20 bg-white/95 border-t border-gray-200"
      >
        <div className="w-full px-4 py-3">
          <div 
            className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-brand-200"
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isMutating}
              autoFocus
              className="flex-1 px-1 py-1 bg-transparent text-gray-900 placeholder-gray-500 border-none outline-none"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isMutating}
              className="bg-brand hover:bg-brand/90 text-white px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press ⌘/Ctrl + Enter to send
          </p>
        </div>
      </form>
    </section>
  );
}
