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
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-prose rounded-lg shadow-sm px-4 py-3",
          isUser
            ? "bg-brand-50 text-brand-600 self-end"
            : "bg-white text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
        )}
        style={{ fontSize: "clamp(0.875rem,0.8rem+0.3vw,1.125rem)" }}
      >
        <div className={cn(
          "prose prose-sm max-w-none",
          isUser 
            ? "prose-headings:text-brand-700 prose-strong:text-brand-700 prose-code:text-brand-700"
            : "prose-gray dark:prose-invert",
          // Enhanced markdown styling
          "prose-headings:font-semibold prose-headings:leading-tight",
          "prose-p:leading-relaxed prose-p:my-2",
          "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg prose-pre:p-4",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-ul:my-2 prose-ol:my-2 prose-li:my-1",
          "prose-table:border-collapse prose-table:border prose-table:border-gray-300",
          "prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2",
          "prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2",
          // Dark mode enhancements
          "dark:prose-code:bg-gray-700 dark:prose-code:text-gray-200",
          "dark:prose-pre:bg-gray-800 dark:prose-pre:border-gray-600",
          "dark:prose-blockquote:border-gray-600",
          "dark:prose-table:border-gray-600",
          "dark:prose-th:border-gray-600 dark:prose-th:bg-gray-700",
          "dark:prose-td:border-gray-600"
        )}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom component for better code block styling
              code({className, children, ...props}: any) {
                const inline = !className?.includes('language-');
                return !inline ? (
                  <pre className={cn(
                    "overflow-x-auto rounded-lg border p-4 text-sm",
                    "bg-gray-50 border-gray-200 text-gray-900",
                    "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  )}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code 
                    className={cn(
                      "rounded px-1 py-0.5 text-sm font-mono",
                      "bg-gray-100 text-gray-900",
                      "dark:bg-gray-700 dark:text-gray-200"
                    )} 
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              // Enhanced table styling
              table({children, ...props}) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                      {children}
                    </table>
                  </div>
                );
              },
              // Enhanced blockquote styling
              blockquote({children, ...props}) {
                return (
                  <blockquote 
                    className={cn(
                      "border-l-4 pl-4 py-2 my-4 italic",
                      "border-gray-300 bg-gray-50 text-gray-700",
                      "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    )}
                    {...props}
                  >
                    {children}
                  </blockquote>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {timestamp && (
          <p className="text-xs opacity-70 mt-3 text-right">
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
