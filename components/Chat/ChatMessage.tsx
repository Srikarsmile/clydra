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
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0 transition-transform duration-300",
        isUser 
          ? "bg-gradient-to-br from-primary-500 to-primary-600" 
          : "bg-gradient-to-br from-primary-500 to-primary-600"
      )}>
        {isUser ? "You" : "AI"}
      </div>
      
      <div>
        <div
          className={cn(
            'rounded-lg px-4 py-2 shadow-sm/5',
            isUser 
              ? 'bg-primary-100 text-primary-600'
              : 'bg-surface text-text-main border border-gray-200/50'
          )}
        >
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
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
              table({children, ...props}) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                      {children}
                    </table>
                  </div>
                );
              },
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
          <p className="mt-1 text-[10px] text-text-muted text-right">
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
