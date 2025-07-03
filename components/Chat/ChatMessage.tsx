import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ChatModel } from "@/types/chatModels";
import MultiModelResponse from "./MultiModelResponse";
import { Globe, ExternalLink } from "lucide-react";

interface Citation {
  type: "url_citation";
  url_citation: {
    url: string;
    title: string;
    content?: string;
    start_index: number;
    end_index: number;
  };
}

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: Date;
  annotations?: Citation[]; // @web-search - Add citations prop
  webSearchUsed?: boolean; // @web-search - Add web search indicator
  model?: string;
  id?: string;
}

function ChatMessage({
  content,
  role,
  timestamp,
  annotations, // @web-search - Add annotations prop
  webSearchUsed, // @web-search - Add web search indicator
  model, // Add back missing model prop
  id, // Add back missing id prop
}: ChatMessageProps) {
  return (
    <div
        id={id ? `message-${id}` : undefined}
        className={cn(
          "prose prose-gray max-w-none",
          role === "assistant" ? "text-gray-800" : "text-gray-900",
          // Improve markdown styling
          "prose-headings:text-gray-900 prose-strong:text-gray-900",
          "prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200",
          "prose-blockquote:border-l-gray-300 prose-blockquote:text-gray-700",
          "prose-ul:text-gray-800 prose-ol:text-gray-800 prose-li:text-gray-800"
        )}
      >
        {role === "assistant" && id ? (
          (() => {
            console.log('ChatMessage passing to MultiModelResponse:', {
              messageId: id,
              model,
              modelType: typeof model,
              initialModel: model as ChatModel,
              contentLength: content?.length || 0
            });
            
            return (
              <MultiModelResponse
                initialContent={content}
                initialModel={model as ChatModel}
              />
            );
          })()
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom components for better styling
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-gray-100 border border-gray-200 rounded-lg p-3 overflow-x-auto">
                  {children}
                </pre>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}

        {/* @web-search - Display web search citations */}
        {annotations && annotations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600 font-medium">Sources</span>
            </div>
            <div className="space-y-2">
              {annotations.map((annotation, index) => (
                <a
                  key={index}
                  href={annotation.url_citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900 truncate">
                      {annotation.url_citation.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {new URL(annotation.url_citation.url).hostname}
                    </div>
                    {annotation.url_citation.content && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {annotation.url_citation.content}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* @web-search - Web search indicator */}
        {webSearchUsed && (
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
            <Globe className="w-3 h-3" />
            <span>Enhanced with web search</span>
        </div>
        )}

        {timestamp && (
          <p className="mt-2 text-xs text-gray-500 transition-opacity duration-200 opacity-60 hover:opacity-100">
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
    </div>
  );
}

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
