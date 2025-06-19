// @fluid-ui - T3.chat model selector component
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { MODEL_ALIASES, ChatModel } from "@/types/chatModels";

// @fluid-ui - Plan mapping for plan badges (all models unlocked for this build)
const plans: Record<ChatModel, "free" | "pro" | "max"> = {
  "openai/gpt-4o": "free",
  "google/gemini-2.5-flash": "free",
  "google/gemini-2.5-pro": "pro",
  "anthropic/claude-sonnet-4": "pro",
  "anthropic/claude-opus-4": "max",
  "deepseek-ai/deepseek-r1": "pro",
  "anthropic/claude-3-sonnet-20240229": "pro",
  "google/gemini-1.5-pro": "pro",
  "anthropic/claude-3-opus-20240229": "max",
  "meta-llama/llama-3-70b-instruct": "max",
};

interface ModelSelectProps {
  model: ChatModel;
  setModel: (model: ChatModel) => void;
}

export function ModelSelect({ model, setModel }: ModelSelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="px-3 py-1 rounded-full bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition-colors">
          {MODEL_ALIASES[model]}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* @fluid-ui - Upgrade banner with pink gradient */}
        <div className="bg-gradient-to-b from-pink-50 to-pink-100 p-4 rounded-t-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-pink-900">Unlock all models + higher limits</p>
            <p className="text-2xl font-bold text-pink-600">₹799 / $10</p>
          </div>
          <button className="px-3 py-1 rounded-md bg-pink-600 text-white text-xs font-medium hover:bg-pink-700 transition-colors">
            Upgrade now
          </button>
        </div>
        
        <Command>
          <CommandInput placeholder="Search models…" />
          <CommandList>
            {Object.entries(MODEL_ALIASES).map(([key, label]) => (
              <CommandItem
                key={key}
                onSelect={() => setModel(key as ChatModel)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {model === key ? (
                  <Check size={16} className="text-brand" />
                ) : (
                  <span className="w-4" />
                )}
                <span className="flex-1">{label}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {plans[key as ChatModel]}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 