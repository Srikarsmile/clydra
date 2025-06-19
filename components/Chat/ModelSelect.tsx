// @fluid-ui - T3.chat model selector component - Modern redesign
import {
  Popover, PopoverTrigger, PopoverContent
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandGroup,
  CommandItem, CommandList
} from "@/components/ui/command";
import { Check, ChevronDown, Sparkles, Zap, Crown } from "lucide-react";
import { MODEL_ALIASES, ChatModel } from "@/types/chatModels";
import { cn } from "@/lib/utils";

// @picker-cleanup - Models array with plan requirements (matching server schema)
const MODELS: {key: ChatModel; minPlan: 'free' | 'pro' | 'max'}[] = [
  { key:"openai/gpt-4o",                       minPlan:'free' },
  { key:"google/gemini-2.5-flash-preview",    minPlan:'free' },
  { key:"google/gemini-2.5-pro",              minPlan:'pro' },
  { key:"anthropic/claude-sonnet-4",          minPlan:'pro' },
  { key:"anthropic/claude-opus-4",            minPlan:'max' },
  { key:"deepseek/deepseek-r1",               minPlan:'pro' },
  { key:"anthropic/claude-3-sonnet-20240229", minPlan:'pro' },
  { key:"google/gemini-1.5-pro",              minPlan:'pro' },
  { key:"anthropic/claude-3-opus-20240229",   minPlan:'max' },
  { key:"meta-llama/llama-3-70b-instruct",    minPlan:'max' },
];

// @picker-cleanup - Enhanced plan configuration with icons and colors
const PLAN_CONFIG = {
  free: {
    label: 'FREE',
    description: 'Basic Models',
    icon: Sparkles,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  pro: {
    label: 'PRO',
    description: 'Advanced Models',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  max: {
    label: 'MAX',
    description: 'Premium Models',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
};

interface ModelSelectProps {
  model: ChatModel;
  setModel: (model: ChatModel) => void;
}

export function ModelSelect({ model, setModel }: ModelSelectProps) {
  // Group models by plan
  const groups = {
    free: MODELS.filter(m => m.minPlan === 'free'),
    pro:  MODELS.filter(m => m.minPlan === 'pro'),
    max:  MODELS.filter(m => m.minPlan === 'max'),
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span className="font-medium text-gray-900 text-sm">
              {MODEL_ALIASES[model]}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 rounded-2xl shadow-xl border-0 bg-white/95 backdrop-blur-sm"
        align="end"
        sideOffset={8}
      >
        {/* Header with search */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Select AI Model</h3>
          <Command>
            <CommandInput
              placeholder="Search models..."
              className="h-9 bg-white border border-gray-200 rounded-lg shadow-sm placeholder:text-gray-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
            />
          </Command>
        </div>

        {/* Models list */}
        <div className="max-h-80 overflow-y-auto">
          <Command>
            <CommandList>
              {(['free','pro','max'] as const).map(plan => {
                const config = PLAN_CONFIG[plan];
                const Icon = config.icon;
                
                return (
                  <CommandGroup key={plan}>
                    {/* Plan header */}
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-3 mx-2 mt-3 mb-2 rounded-xl border",
                      config.bgColor,
                      config.borderColor
                    )}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold tracking-wide", config.color)}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {config.description}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {groups[plan].length} models
                      </span>
                    </div>

                    {/* Models in this plan */}
                    <div className="px-2 pb-2">
                      {groups[plan].map(m => (
                        <CommandItem
                          key={m.key}
                          onSelect={() => setModel(m.key)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 mx-1 my-1 rounded-xl cursor-pointer transition-all duration-200",
                            "hover:bg-gray-50 hover:shadow-sm",
                            model === m.key && "bg-brand-50 border border-brand-200 shadow-sm"
                          )}
                        >
                          {/* Selection indicator */}
                          <div className="flex items-center justify-center w-5 h-5">
                            {model === m.key ? (
                              <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                            )}
                          </div>

                          {/* Model info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {MODEL_ALIASES[m.key]}
                            </div>
                          </div>

                          {/* Plan badge */}
                          <div className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold tracking-wide",
                            config.color,
                            config.bgColor
                          )}>
                            {config.label}
                          </div>
                        </CommandItem>
                      ))}
                    </div>
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </div>

        {/* Upgrade CTA */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Unlock Premium Models
              </p>
              <p className="text-xs text-gray-600">
                Access Claude Opus, advanced reasoning, and higher limits
              </p>
            </div>
            <button className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
              Upgrade
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 