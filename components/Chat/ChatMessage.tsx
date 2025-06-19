import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  role,
  timestamp = new Date(),
}) => {
  const isUser = role === "user";
  
  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-prose rounded-lg shadow-sm/5 px-4 py-3",
          isUser
            ? "bg-brand-50 text-brand-600 self-end"
            : "bg-surface text-txt-main dark:bg-[#1E1E1E]"
        )}
        style={{ fontSize: "clamp(0.875rem,0.8rem+0.3vw,1.125rem)" }}
      >
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {timestamp && (
          <p className="text-xs opacity-70 mt-2">
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
