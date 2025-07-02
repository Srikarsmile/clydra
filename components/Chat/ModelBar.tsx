// @dashboard-redesign - Model pill bar component
"use client";

import { ChatModel, MODEL_ALIASES, getModelsByPlan } from "@/types/chatModels";
import { cn } from "@/lib/utils";

interface ModelBarProps {
  selectedModel: ChatModel;
  onModelChange: (model: ChatModel) => void;
  userPlan?: "free" | "pro" | "max";
}

export default function ModelBar({
  selectedModel,
  onModelChange,
  userPlan = "free",
}: ModelBarProps) {
  const availableModels = getModelsByPlan(userPlan);

  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {availableModels.map((model) => (
            <button
              key={model}
              onClick={() => onModelChange(model)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                selectedModel === model
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-brand-50 text-brand-600 hover:bg-brand-100"
              )}
            >
              {MODEL_ALIASES[model]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
