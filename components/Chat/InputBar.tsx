// @dashboard-redesign - Input bar component with fluid animations and performance optimizations
"use client";

import { useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { ChatModel, MODEL_ALIASES, getModelsByPlan } from "@/types/chatModels";
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

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onModelChange(e.target.value as ChatModel);
    },
    [onModelChange]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Centered container - perfect middle positioning */}
      <div className="flex justify-center items-end pointer-events-none">
        <div className="w-full max-w-4xl px-4 md:px-6 pb-6 transition-all duration-300 pointer-events-auto">
          {/* @fluid-scroll - Enhanced container with smooth backdrop */}
          <div className="bg-surface/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl hover:bg-surface/98 w-full">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 p-4"
            >
              {/* @fluid-scroll - Model selector with smooth transitions */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={disabled}
                  className={cn(
                    "appearance-none bg-brand-50 text-brand-600 border border-brand-200",
                    "rounded-xl px-3 py-2 pr-8 text-sm font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "w-[140px] transition-all duration-200",
                    "hover:bg-brand-100 hover:border-brand-300",
                    "transform-gpu will-change-transform"
                  )}
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {MODEL_ALIASES[model]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-600 pointer-events-none transition-transform duration-200" />
              </div>

              {/* @fluid-scroll - Enhanced textarea with original height but constrained width */}
              <div className="flex-1 relative min-w-0 max-w-none">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled}
                  rows={1}
                  className={cn(
                    "w-full resize-none bg-transparent text-text-main placeholder-text-muted",
                    "border-none outline-none focus:outline-none focus:ring-0",
                    "text-base leading-6 min-h-[40px] max-h-[80px] overflow-y-auto", // Restored original height
                    "transition-all duration-200 ease-out",
                    "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
                    "will-change-contents"
                  )}
                  style={{
                    transition: "height 0.2s ease-out",
                  }}
                />
              </div>

              {/* @fluid-scroll - Enhanced send button with original size */}
              <div className="flex-shrink-0">
                <button
                  type="submit"
                  disabled={!value.trim() || disabled}
                  className={cn(
                    "w-12 h-12 rounded-xl shadow-lg transition-all duration-300",
                    "disabled:cursor-not-allowed flex items-center justify-center",
                    "transform-gpu will-change-transform border-none outline-none focus:outline-none",
                    "hover:scale-105 hover:shadow-xl active:scale-95",
                    "relative z-10", // Ensure it's above other elements
                    !value.trim() || disabled
                      ? "bg-gray-400 hover:bg-gray-400 disabled:opacity-60"
                      : "bg-brand-500 hover:bg-brand-600 focus:bg-brand-600 shadow-brand-500/30"
                  )}
                >
                  {disabled ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Send className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
