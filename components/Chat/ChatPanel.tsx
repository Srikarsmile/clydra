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
import { ChatModel } from "@/types/chatModels"; // @fluid-ui
import UpgradeCTA from "../UpgradeCTA";

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
  const [model, setModel] = useState<ChatModel>('openai/gpt-4o'); // @fluid-ui
  const [showUpgrade, setShowUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          console.error('Failed to load messages:', error);
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
    <div className="h-full flex flex-col bg-white">
      {/* @fluid-ui - T3.chat style messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          // @fluid-ui - T3.chat welcome section with fade-in animation
          <div className="max-w-4xl mx-auto py-16 lg:py-24 animate-fadeInUp">
            {/* @ux-refresh - Updated headline with spacing and fade-in */}
            <h1 className="text-3xl lg:text-5xl font-semibold text-center text-txt-main
                           mt-24 lg:mt-32 mb-12 animate-[fadeUp_.6s_ease-out]">
              How can I help you, {user?.firstName}?
            </h1>
            {/* @ux-refresh - End updated headline */}
            
            {/* @fluid-ui - Model selector */}
            <div className="flex justify-center mb-8">
              <ModelSelect model={model} setModel={setModel} />
            </div>

            {/* @fluid-ui - Suggestions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">✨ Creative Writing</div>
                <div className="text-xs text-gray-500">Help me write a story or poem</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">🧠 Problem Solving</div>
                <div className="text-xs text-gray-500">Analyze and solve complex problems</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">💻 Code Review</div>
                <div className="text-xs text-gray-500">Review and improve my code</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-brand/50 hover:bg-brand/5 transition-colors text-left">
                <div className="text-sm font-medium text-gray-900 mb-1">📊 Data Analysis</div>
                <div className="text-xs text-gray-500">Help analyze data and insights</div>
              </button>
            </div>
          </div>
        )}

        {/* @fluid-ui - Messages when conversation exists */}
        {messages.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 space-y-4">
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
                  style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)" }}
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
        )}
      </div>

      {/* @fluid-ui - T3.chat input area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* @ux-refresh - Updated form styling with refined shadow and colors */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 shadow-md/10 border border-gray-200 px-3 py-2 rounded-md bg-surface">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isMutating}
              className="flex-1 px-1 py-1 bg-transparent text-gray-900 placeholder-gray-500 border-none outline-none"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isMutating}
              className="bg-brand hover:bg-brand/90 text-white px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {/* @ux-refresh - End updated form styling */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press ⌘/Ctrl + Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
