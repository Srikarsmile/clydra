import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(
  ({ content, timestamp = new Date() }) => {
    return (
      <div className="w-full">
        <div className="w-full">
          <div className="prose prose-sm max-w-none text-inherit">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }: any) {
                  const inline = !className?.includes("language-");
                  return !inline ? (
                    <pre
                      className={cn(
                        "overflow-x-auto rounded-xl border p-4 text-sm my-4",
                        "bg-gray-50/80 backdrop-blur-sm border-gray-200/50 text-gray-900",
                        "dark:bg-gray-800/80 dark:border-gray-600/50 dark:text-gray-100",
                        "transition-all duration-200 hover:bg-gray-50",
                        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                      )}
                    >
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className={cn(
                        "rounded-md px-2 py-1 text-sm font-mono",
                        "bg-gray-100/80 text-gray-900 border border-gray-200/50",
                        "dark:bg-gray-700/80 dark:text-gray-200 dark:border-gray-600/50",
                        "transition-colors duration-150"
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table({ children, ...props }) {
                  return (
                    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
                      <table
                        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  );
                },
                blockquote({ children, ...props }) {
                  return (
                    <blockquote
                      className={cn(
                        "border-l-4 pl-6 py-3 my-6 italic rounded-r-lg",
                        "border-brand-300 bg-brand-50/50 text-gray-700",
                        "dark:border-brand-400 dark:bg-brand-900/20 dark:text-gray-300",
                        "transition-colors duration-200"
                      )}
                      {...props}
                    >
                      {children}
                    </blockquote>
                  );
                },
                p({ children, ...props }) {
                  return (
                    <p className="leading-relaxed mb-3 last:mb-0" {...props}>
                      {children}
                    </p>
                  );
                },
                ul({ children, ...props }) {
                  return (
                    <ul className="space-y-1 ml-4 mb-4 last:mb-0" {...props}>
                      {children}
                    </ul>
                  );
                },
                ol({ children, ...props }) {
                  return (
                    <ol className="space-y-1 ml-4 mb-4 last:mb-0" {...props}>
                      {children}
                    </ol>
                  );
                },
                li({ children, ...props }) {
                  return (
                    <li className="leading-relaxed" {...props}>
                      {children}
                    </li>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {timestamp && (
            <p className="mt-2 text-xs text-gray-400 transition-opacity duration-200 opacity-60 hover:opacity-100">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
