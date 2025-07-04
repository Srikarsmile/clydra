// @fluid-ui - T3.chat model selector component - Optimized for performance
import { useState, useCallback, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Check, ChevronDown, Sparkles, Zap, Crown, Globe } from "lucide-react";
import {
  MODEL_ALIASES,
  ChatModel,
  FREE_PLAN_MODELS,
  PRO_PLAN_MODELS,
  modelSupportsWebSearch,
} from "@/types/chatModels";
import { cn } from "@/lib/utils";

// Models array with plan requirements - now using the centralized model organization
const MODELS: { key: ChatModel; minPlan: "free" | "pro" | "max" }[] = [
  // Free plan models
  ...FREE_PLAN_MODELS.map((key) => ({ key, minPlan: "free" as const })),
  // Pro plan models (excluding ones already in free)
  ...PRO_PLAN_MODELS.filter((key) => !FREE_PLAN_MODELS.includes(key)).map(
    (key) => ({ key, minPlan: "pro" as const })
  ),
];

// Plan configuration - memoized outside component
const PLAN_CONFIG = {
  free: {
    label: "FREE",
    description: "Basic Models",
    icon: Sparkles,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  pro: {
    label: "PRO",
    description: "Advanced Models + 🌐 Web Search",
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  max: {
    label: "MAX",
    description: "Premium Models + 🌐 Web Search",
    icon: Crown,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
} as const;

interface ModelSelectProps {
  model: ChatModel;
  setModel: (model: ChatModel) => void;
  userPlan?: "free" | "pro" | "max";
}

export function ModelSelect({
  model,
  setModel,
  userPlan = "pro",
}: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized grouped models
  const groups = useMemo(
    () => ({
      free: MODELS.filter((m) => m.minPlan === "free"),
      pro: MODELS.filter((m) => m.minPlan === "pro"),
      max: MODELS.filter((m) => m.minPlan === "max"),
    }),
    []
  );

  // Memoized filtered models based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;

    const filtered = {
      free: [] as typeof MODELS,
      pro: [] as typeof MODELS,
      max: [] as typeof MODELS,
    };
    const search = searchTerm.toLowerCase();

    for (const [planType, models] of Object.entries(groups)) {
      filtered[planType as keyof typeof filtered] = models.filter((m) =>
        MODEL_ALIASES[m.key].toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [groups, searchTerm]);

  // Optimized handlers
  const handleModelSelect = useCallback(
    (modelKey: ChatModel) => {
      setModel(modelKey);
      setOpen(false);
      setSearchTerm(""); // Clear search when closing
    },
    [setModel]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm(""); // Clear search when closing
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300/20 focus:border-gray-400">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="font-medium text-gray-900 text-sm">
              {MODEL_ALIASES[model]}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 rounded-2xl shadow-xl border-0 bg-white"
        align="end"
        sideOffset={8}
      >
        {/* Simplified header with search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Select AI Model
          </h3>
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-300/20 focus:outline-none"
          />
        </div>

        {/* Simplified models list */}
        <div className="max-h-80 overflow-y-auto">
          {(["free", "pro", "max"] as const).map((plan) => {
            // Only show plans the user has access to
            if (userPlan === "free" && plan !== "free") return null;
            if (userPlan === "pro" && plan === "max") return null;

            const config = PLAN_CONFIG[plan];
            const Icon = config.icon;
            const planModels = filteredGroups[plan];

            if (planModels.length === 0) return null;

            return (
              <div key={plan}>
                {/* Plan header */}
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 mx-2 mt-3 mb-2 rounded-xl border",
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-bold tracking-wide",
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {config.description}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {planModels.length} models
                  </span>
                </div>

                {/* Models in this plan */}
                <div className="px-2 pb-2">
                  {planModels.map((m) => {
                    const isLocked =
                      (userPlan === "free" && m.minPlan !== "free") ||
                      (userPlan === "pro" && m.minPlan === "max");

                    return (
                      <button
                        key={m.key}
                        onClick={() => !isLocked && handleModelSelect(m.key)}
                        disabled={isLocked}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 mx-1 my-1 rounded-xl cursor-pointer transition-all duration-200 text-left",
                          isLocked
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50 hover:shadow-sm",
                          model === m.key &&
                            "bg-gray-100 border border-gray-300 shadow-sm"
                        )}
                      >
                        {/* Selection indicator */}
                        <div className="flex items-center justify-center w-5 h-5">
                          {model === m.key ? (
                            <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                          )}
                        </div>

                        {/* Model info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {MODEL_ALIASES[m.key]}
                            </span>
                            {modelSupportsWebSearch(m.key) && (
                              <Globe className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Plan badge */}
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold tracking-wide",
                            config.color,
                            config.bgColor
                          )}
                        >
                          {config.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* No results message */}
          {searchTerm &&
            Object.values(filteredGroups).every(
              (group) => group.length === 0
            ) && (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">
                  No models found matching &quot;{searchTerm}&quot;
                </p>
              </div>
            )}
        </div>

        {/* Upgrade CTA - only show for free plan users */}
        {userPlan === "free" && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Unlock Premium Models
                </p>
                <p className="text-xs text-gray-600">
                  Access GPT-4o, Claude Sonnet 4, Grok 3, and web search
                </p>
              </div>
              <button className="ml-4 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                Upgrade
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
