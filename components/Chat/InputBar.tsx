// @dashboard-redesign - Input bar component with fluid animations and performance optimizations
"use client";

import { useRef, useEffect, KeyboardEvent, useCallback, useState, useMemo } from "react";
import { ChevronDown, Globe } from "lucide-react";
import {
  ChatModel,
  MODEL_ALIASES,
  getModelsByPlan,
  modelSupportsWebSearch,
} from "@/types/chatModels";
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
  onFocus?: () => void; // @auto-thread - Add focus handler for automatic thread creation
  loading?: boolean; // Add loading state
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
  onFocus, // @auto-thread - Add focus handler for automatic thread creation
  loading = false, // Add loading state
}: InputBarProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const availableModels = getModelsByPlan(userPlan);
  const [draft, setDraft] = useState('');

  // Optimized debounce for better performance
  const debouncedUpdate = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (val: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setDraft(val), 50); // Ultra-fast 50ms debounce
      };
    },
    []
  );

  // Optimized input handling with reduced DOM manipulation
  const handleInput = useCallback(() => {
    const el = inputRef.current!;
    // Only resize if height actually changed to reduce reflows
    const newHeight = el.scrollHeight + 'px';
    if (el.style.height !== newHeight) {
      el.style.height = 'auto';
      el.style.height = newHeight;
    }
    debouncedUpdate(el.value);
  }, [debouncedUpdate]);

  // Clear textarea and reset draft on external value changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = value;
      setDraft(value);
    }
  }, [value]);

  // @auto-thread - Handle input focus for automatic thread creation
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus();
    }
  }, [onFocus]);

  // @ux-improvement - Handle keyboard shortcuts for better UX
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const draftValue = inputRef.current!.value.trim();
        
        // Prevent multiple submissions
        if (disabled || loading || !draftValue) {
          return;
        }
        
        // Clear input immediately
        inputRef.current!.value = '';
        inputRef.current!.style.height = 'auto';
        setDraft('');
        
        // Update parent and call onSend with draft
        onChange(draftValue);
        onSubmit();
      }
    },
    [disabled, loading, onSubmit, onChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const draftValue = inputRef.current!.value.trim();
      
      // Prevent multiple submissions
      if (disabled || loading || !draftValue) {
        return;
      }
      
      // Instant UI feedback - clear input immediately
      inputRef.current!.value = '';
      inputRef.current!.style.height = 'auto';
      setDraft('');
      
      // Update parent and call onSend with draft
      onChange(draftValue);
      onSubmit();
    },
    [onSubmit, onChange, disabled, loading]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newModel = e.target.value as ChatModel;
      onModelChange(newModel);

      // @web-search - Auto-disable web search if new model doesn't support it
      if (
        enableWebSearch &&
        !modelSupportsWebSearch(newModel) &&
        onWebSearchChange
      ) {
        onWebSearchChange(false);
      }
    },
    [onModelChange, enableWebSearch, onWebSearchChange]
  );

  // @web-search - Check if current model supports web search
  const currentModelSupportsWebSearch = modelSupportsWebSearch(selectedModel);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Mobile-optimized container with proper safe area handling */}
      <div className="flex justify-center items-end pointer-events-none">
        <div className="w-full max-w-4xl px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pointer-events-auto">
          {/* Improved background with better blur and gradient */}
          <div className="bg-gradient-to-r from-white/98 to-gray-50/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:from-white hover:to-gray-50 w-full mx-2 sm:mx-0 ring-1 ring-gray-100/50">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4"
            >
              {/* Redesigned model selector and web search controls group */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Compact model selector optimized for mobile */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={disabled}
                    className={cn(
                      "bg-white text-gray-800 border border-gray-300",
                      "rounded-lg px-2 py-1.5 pr-6 font-medium text-xs sm:text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "w-[85px] sm:w-[110px] transition-all duration-200",
                      "hover:bg-gray-50 hover:border-gray-400",
                      "touch-manipulation"
                    )}
                    style={{
                      // Hide default arrow completely
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      backgroundImage: "none",
                      fontSize: "16px", // Prevent iOS zoom
                    }}
                  >
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {MODEL_ALIASES[model]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>

                {/* @web-search - Compact web search toggle button */}
                {currentModelSupportsWebSearch && onWebSearchChange && (
                  <button
                    type="button"
                    onClick={() => onWebSearchChange(!enableWebSearch)}
                    disabled={disabled}
                    className={cn(
                      "rounded-lg transition-all duration-200",
                      "border focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                      "p-1.5 w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] flex items-center justify-center",
                      "touch-manipulation hover:scale-105 active:scale-95",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      enableWebSearch
                        ? "bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    )}
                    title={
                      enableWebSearch
                        ? "Web search enabled"
                        : "Enable web search"
                    }
                  >
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              {/* Spacious textarea with more room */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  placeholder={loading ? "Generating..." : placeholder}
                  disabled={disabled || loading}
                  autoFocus
                  spellCheck="false"
                  rows={1}
                  className={cn(
                    "w-full resize-none bg-transparent text-gray-900 placeholder:text-gray-500",
                    "border-0 outline-none focus:ring-0 text-sm sm:text-base leading-relaxed",
                    "py-3 sm:py-4 pr-2", // Increased padding for better touch targets
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "max-h-40 overflow-y-auto", // Increased max height for longer messages
                    "transition-all duration-200 ease-in-out",
                    loading && "animate-pulse" // Add loading animation
                  )}
                  style={{
                    minHeight: "20px", // Minimum height for single line
                    lineHeight: "1.5",
                  }}
                />
                {/* Loading indicator only */}
                {loading && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 pointer-events-none flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                )}
              </div>

              {/* Compact send button with simplified icon */}
              <button
                type="submit"
                disabled={disabled || loading || !draft.trim()}
                className={cn(
                  "flex-shrink-0 rounded-xl transition-all duration-300 ease-out",
                  "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl",
                  "hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2",
                  "transform-gpu will-change-transform hover:scale-110 active:scale-95",
                  "disabled:hover:scale-100 disabled:shadow-lg",
                  loading && "animate-pulse",
                  "p-2.5 sm:p-3", // Better padding for accessibility
                  "w-[44px] h-[44px] sm:w-[48px] sm:h-[48px]", // Better size for touch
                  "touch-manipulation flex items-center justify-center",
                  "group relative overflow-hidden"
                )}
              >
                {/* Enhanced send icon with loading states */}
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.768 59.768 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
