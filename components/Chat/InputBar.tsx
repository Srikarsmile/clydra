// @dashboard-redesign - Input bar component with fluid animations and performance optimizations
"use client";

import { useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Send, Loader2, ChevronDown, Globe } from "lucide-react";
import { ChatModel, MODEL_ALIASES, getModelsByPlan, modelSupportsWebSearch } from "@/types/chatModels";
import { cn } from "@/lib/utils";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel: ChatModel;
  onModelChange: (model: ChatModel) => void;
  userPlan?: "free" | "pro" | "max";
  enableWebSearch?: boolean; // @web-search - Add web search toggle prop
  onWebSearchChange?: (enabled: boolean) => void; // @web-search - Add web search change handler
}

export default function InputBar({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Type your message...",
  selectedModel,
  onModelChange,
  userPlan = "pro",
  enableWebSearch = false, // @web-search - Default web search to false
  onWebSearchChange,
}: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const availableModels = getModelsByPlan(userPlan);

  // @fluid-scroll - Enhanced auto-resize with smooth transitions (reduced max height)
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 3 * 24; // Reduced from 6 to 3 rows * line height
      const newHeight = Math.min(scrollHeight, maxHeight);

      // Apply smooth transition
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
    },
    [onSubmit]
  );

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as ChatModel;
    onModelChange(newModel);
    
    // @web-search - Auto-disable web search if new model doesn't support it
    if (enableWebSearch && !modelSupportsWebSearch(newModel) && onWebSearchChange) {
      onWebSearchChange(false);
    }
  }, [onModelChange, enableWebSearch, onWebSearchChange]);

  // @web-search - Check if current model supports web search
  const currentModelSupportsWebSearch = modelSupportsWebSearch(selectedModel);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Mobile-optimized container with proper safe area handling */}
      <div className="flex justify-center items-end pointer-events-none">
        <div className="w-full max-w-4xl px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pointer-events-auto">
          {/* Add background blur and proper spacing from edges */}
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl hover:bg-white/98 w-full mx-2 sm:mx-0">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4"
            >
              {/* Compact model selector and web search controls group */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {/* Mobile-responsive model selector - made more compact */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={disabled}
                    className={cn(
                      "appearance-none bg-gray-100 text-gray-700 border border-gray-300",
                      "rounded-lg px-2 py-2 pr-5 font-medium text-xs sm:text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-400",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "w-[75px] sm:w-[110px] transition-all duration-200", // Made more compact
                      "hover:bg-gray-200 hover:border-gray-400",
                      "transform-gpu will-change-transform",
                      "touch-manipulation",
                      // Prevent zoom on iOS
                      "-webkit-appearance-none"
                    )}
                    style={{
                      // 16px font size prevents iOS zoom
                      fontSize: "16px",
                    }}
                  >
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {MODEL_ALIASES[model]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none transition-transform duration-200" />
                </div>

                {/* @web-search - Compact web search toggle button */}
                {currentModelSupportsWebSearch && onWebSearchChange && (
                  <button
                    type="button"
                    onClick={() => onWebSearchChange(!enableWebSearch)}
                    disabled={disabled}
                    className={cn(
                      "rounded-lg transition-all duration-200",
                      "border-2 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300/50",
                      "p-1.5 sm:p-2 w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]", // More compact
                      "touch-manipulation transform-gpu will-change-transform hover:scale-105 active:scale-95",
                      "disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
                      enableWebSearch
                        ? "bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100"
                        : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                    )}
                    title={enableWebSearch ? "Web search enabled" : "Enable web search"}
                  >
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              {/* Spacious textarea with more room */}
              <div className="flex-1 relative min-w-0">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled}
                  rows={1}
                  className={cn(
                    "w-full resize-none bg-transparent text-gray-900 placeholder-gray-500",
                    "border-none outline-none focus:outline-none focus:ring-0",
                    // Important: 16px font size prevents iOS zoom
                    "text-base leading-6 min-h-[40px] max-h-[80px] overflow-y-auto",
                    "transition-all duration-200 ease-out px-2 sm:px-3", // Added horizontal padding for better text spacing
                    "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
                    "will-change-contents touch-manipulation",
                    // Additional iOS fixes
                    "-webkit-appearance-none appearance-none",
                    "transform-gpu" // Hardware acceleration for smoother performance
                  )}
                  style={{
                    transition: "height 0.2s ease-out",
                    // Ensure consistent font size across all devices
                    fontSize: "16px",
                    lineHeight: "1.5",
                  }}
                />
              </div>

              {/* Compact send button with simplified icon */}
              <button
                type="submit"
                disabled={disabled || !value.trim()}
                className={cn(
                  "flex-shrink-0 rounded-lg transition-all duration-200",
                  "bg-black text-white shadow-sm hover:shadow-md",
                  "hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-gray-300/50",
                  "transform-gpu will-change-transform hover:scale-105 active:scale-95",
                  "p-1.5 sm:p-2", // Made even more compact
                  "w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]", // Smaller than before
                  "touch-manipulation flex items-center justify-center"
                )}
              >
                {/* Simple arrow icon - much more compact */}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14m-7-7l7 7-7 7"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
