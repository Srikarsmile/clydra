import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { Globe, ExternalLink, Copy, Check } from "lucide-react";

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
  timestamp?: Date | string;
  annotations?: Citation[];
  webSearchUsed?: boolean;
  id?: string;
}

const ChatMessage = React.memo(function ChatMessage({
  content,
  role,
  timestamp,
  annotations,
  webSearchUsed,
  id,
}: ChatMessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  return (
    <div
      id={id ? `message-${id}` : undefined}
      className={cn(
        "prose prose-gray max-w-none",
        role === "assistant" ? "text-gray-800" : "text-gray-900",
        "prose-headings:text-gray-900 prose-strong:text-gray-900",
        "prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200",
        "prose-blockquote:border-l-gray-300 prose-blockquote:text-gray-700",
        "prose-ul:text-gray-800 prose-ol:text-gray-800 prose-li:text-gray-800",
        // KaTeX styling improvements
        "[&_.katex-display]:my-4 [&_.katex-display]:p-4 [&_.katex-display]:bg-blue-50 [&_.katex-display]:border [&_.katex-display]:border-blue-200 [&_.katex-display]:rounded-lg",
        "[&_.katex]:text-gray-900"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { 
          strict: false,
          errorColor: '#cc0000',
          trust: true,
          output: 'html'
        }]]}
        skipHtml={false}
        components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-800">{children}</em>
            ),
            code: ({ children, className }) => {
              // Check if this is an inline code or block code
              const isInline = !className?.includes('language-');
              
              if (isInline) {
                return (
                  <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                );
              }
              
              // Handle different languages
              const language = className?.replace('language-', '') || '';
              const langLabel = language === 'latex' ? 'LaTeX' : 
                               language === 'python' ? 'Python' :
                               language === 'javascript' ? 'JavaScript' :
                               language === 'typescript' ? 'TypeScript' :
                               language === 'bash' ? 'Bash' :
                               language === 'sql' ? 'SQL' :
                               language.toUpperCase() || 'Code';
              
              const codeText = Array.isArray(children) ? children.join('') : String(children);
              const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
              
              return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg mb-3 overflow-hidden group">
                  <div className="flex items-center justify-between bg-gray-100 px-3 py-1 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-700">
                      {langLabel}
                    </span>
                    <button
                      onClick={() => copyToClipboard(codeText, codeId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
                      title="Copy code"
                    >
                      {copiedCode === codeId ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto">
                    <code className={`text-sm font-mono text-gray-800 ${className || ''}`}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            },
            pre: ({ children }) => (
              // This handles pre blocks without language specification
              <pre className="bg-gray-100 border border-gray-200 rounded-lg p-3 overflow-x-auto mb-3">
                <code className="text-sm font-mono text-gray-800">
                  {children}
                </code>
              </pre>
            ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">
                {children}
              </h3>
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

      {webSearchUsed && (
        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
          <Globe className="w-3 h-3" />
          <span>Enhanced with web search</span>
        </div>
      )}

      {timestamp && (
        <p className="mt-2 text-xs text-gray-500 transition-opacity duration-200 opacity-60 hover:opacity-100">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;