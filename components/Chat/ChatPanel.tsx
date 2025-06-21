/**
 * @clydra-core
 * Convo Core - Chat Panel Component
 *
 * Main chat interface with message list, input, model selection, and usage tracking
 */

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Loader2 } from "lucide-react";
import useSWRMutation from "swr/mutation";
import { Button } from "../ui/button";
import { ModelSelect } from "./ModelSelect"; // @fluid-ui
import { ChatModel, MODEL_ALIASES } from "@/types/chatModels"; // @fluid-ui
import UpgradeCTA from "../UpgradeCTA";
import { cn } from "@/lib/utils"; // @spacing-fix

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

// @fluid-ui - Remove local ChatModel type in favor of imported one

// SWR fetcher for chat API
const sendMessage = async (
  url: string,
  { arg }: { arg: { messages: Message[]; model: ChatModel; threadId?: string } } // @threads
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
  threadId?: string; // @threads - Add threadId prop
}

export default function ChatPanel({ threadId }: ChatPanelProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ChatModel>("openai/gpt-4o"); // @fluid-ui
  const [showUpgrade, setShowUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // @focus-fix

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
      setMessages([]); // Clear messages if no thread
    }
  }, [threadId]);

  // SWR mutation for sending messages
  const { trigger, isMutating } = useSWRMutation(
    "/api/chat/proxy",
    sendMessage,
    {
      onSuccess: (data) => {
        setMessages((prev) => [...prev, data.message]);
        setShowUpgrade(false);
      },
      onError: (error) => {
        console.error("Chat error:", error);
        if (error.message.includes("Daily message limit exceeded")) {
          setShowUpgrade(true);
        }
      },
    }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // @focus-fix - Auto-focus input on mount and after sending
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // @focus-fix - Focus input after message is sent
  useEffect(() => {
    if (!isMutating) {
      inputRef.current?.focus();
    }
  }, [isMutating]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
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
        threadId, // @threads - Pass threadId
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // @fluid-ui - All models unlocked, no need for upgrade checks

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
      {/* @layout-fix - sticky badge */}
      <div className="sticky top-0 z-10 flex justify-center pt-4 bg-bglight/80 backdrop-blur">
        <span className="inline-flex items-center gap-1 rounded-full
                         bg-brand-50 text-brand-600 px-3 py-1 text-xs shadow-sm/5">
          <span className="w-2 h-2 rounded-full bg-brand-500"/> 
          Using&nbsp;{MODEL_ALIASES[model]}
        </span>
      </div>

      {/* @fluid-ui - T3.chat style messages area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {messages.length === 0 && (
          // @fluid-ui - T3.chat welcome section with fade-in animation
          <div className="max-w-4xl mx-auto py-16 lg:py-24 animate-fadeInUp">
            {/* @dedupe - Updated headline with spacing and fade-in */}
            <h1
              className="text-3xl lg:text-5xl font-semibold text-center text-txt-main
                           mt-24 lg:mt-28 mb-8 animate-[fadeUp_.6s_ease-out]" // @dedupe
            >
              How can I help you,&nbsp;{user?.firstName}? {/* @dedupe */}
            </h1>
            {/* @dedupe - End updated headline */}

            {/* @fluid-ui - Model selector */}
            <div className="flex justify-center mb-8">
              <ModelSelect model={model} setModel={setModel} />
            </div>

            {/* @fluid-ui - Suggestions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  ✨ Creative Writing
                </div>
                <div className="text-xs text-gray-500">
                  Help me write a story or poem
                </div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  🧠 Problem Solving
                </div>
                <div className="text-xs text-gray-500">
                  Analyze and solve complex problems
                </div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  💻 Code Review
                </div>
                <div className="text-xs text-gray-500">
                  Review and improve my code
                </div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  📊 Data Analysis
                </div>
                <div className="text-xs text-gray-500">
                  Help analyze data and insights
                </div>
              </button>
            </div>
          </div>
        )}

        {/* @expand-chat - message column – full width */}
        <div className={cn(
          "flex flex-col w-full px-4", // @expand-chat
          messages.length === 0 ? "mt-0" : "space-y-4"
        )}>
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
                // @fluid-ui - T3.chat responsive font sizing
                style={{
                  fontSize: "clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)",
                }}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* @fluid-ui - Loading indicator */}
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
      </div>

      {/* @fix-overlap - T3.chat input area - avoid sidebar overlap */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 right-0 left-64 z-20
                   bg-surface/95 backdrop-blur
                   border-t border-gray-200 dark:border-[#2A2A2E]" // @fix-overlap
      >
        <div className="w-full px-4 py-3"> {/* @expand-chat */}
          <div 
            className="flex items-center gap-2 rounded-full bg-surface
                          border border-gray-200 shadow-sm/5 px-4 py-2
                          focus-within:ring-2 focus-within:ring-brand-200"
            onClick={() => inputRef.current?.focus()} // @focus-fix
          >
            <input
              ref={inputRef} // @focus-fix
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isMutating}
              autoFocus // @focus-fix
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
