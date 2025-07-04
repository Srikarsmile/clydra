// Simple component for displaying assistant responses with model badges
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MODEL_ALIASES, ChatModel } from "@/types/chatModels";

interface MultiModelResponseProps {
  initialContent: string;
  initialModel?: ChatModel;
}

// Markdown component with consistent styling
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      // Custom components for better styling
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => (
        <strong className="font-semibold text-gray-900">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="italic text-gray-800">{children}</em>
      ),
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
      ul: ({ children }) => (
        <ul className="list-disc list-inside mb-2">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside mb-2">{children}</ol>
      ),
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
);

export default function MultiModelResponse({
  initialContent,
  initialModel,
}: MultiModelResponseProps) {
  // Debug logging to help trace model information
  console.log("MultiModelResponse render:", {
    initialModel,
    modelAlias: initialModel ? MODEL_ALIASES[initialModel] : "undefined",
    contentLength: initialContent?.length || 0,
  });

  return (
    <div className="space-y-3">
      {/* Model badge */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <span>
          {initialModel ? MODEL_ALIASES[initialModel] : "AI Assistant"}
        </span>
      </div>

      {/* Message content */}
      <div className="prose prose-gray max-w-none text-gray-800">
        <MarkdownContent content={initialContent} />
      </div>
    </div>
  );
}
