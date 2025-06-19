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
  return (
    <div
      className={cn(
        "flex gap-3",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-prose px-4 py-3 rounded-lg shadow-sm", // @clydra-palette
          role === "user"
            ? "bg-brand-50 text-brand-600 self-end" // @clydra-palette
            : "bg-surface-light dark:bg-surface-dark" // @clydra-palette
        )}
        style={{ fontSize: "clamp(0.875rem,0.8rem+0.3vw,1.125rem)" }} // @clydra-palette
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
