// Simple component for displaying assistant responses with model badges
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MODEL_ALIASES, ChatModel } from "@/types/chatModels";

interface MultiModelResponseProps {
  initialContent: string;
  initialModel?: ChatModel;
}

export default function MultiModelResponse({
  initialContent,
  initialModel,
}: MultiModelResponseProps) {
  // Use the passed model or fall back to default
  const displayModel = initialModel || "google/gemini-2.5-flash-preview";
  
  // Debug logging to help trace model information
  console.log("MultiModelResponse render:", {
    initialModel,
    displayModel,
    modelAlias: MODEL_ALIASES[displayModel],
    contentLength: initialContent?.length || 0,
  });

  return (
    <div className="space-y-3">
      {/* Model badge */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <span>
          {MODEL_ALIASES[displayModel] || "AI Assistant"}
        </span>
      </div>

      {/* Message content */}
      <div className="prose prose-gray max-w-none text-gray-800">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom components for better styling
            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 pl-6 list-disc">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto mb-4">
                {children}
              </pre>
            ),
          }}
        >
          {initialContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
