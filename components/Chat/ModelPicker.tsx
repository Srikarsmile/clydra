/**
 * @clydra-core
 * Convo Core - Model Picker Component
 *
 * Shows available models organized by plan with proper gating
 */

import {
  MODEL_ALIASES,
  ChatModel,
  getModelsByPlan,
  modelSupportsWebSearch,
} from "@/types/chatModels";
import ModelPill from "./ModelPill";

interface ModelPickerProps {
  model: ChatModel;
  setModel: (model: ChatModel) => void;
  userPlan: "free" | "pro" | "max";
}

export default function ModelPicker({
  model,
  setModel,
  userPlan,
}: ModelPickerProps) {
  const availableModels = getModelsByPlan(userPlan);
  const allModels = getModelsByPlan("max"); // Get all models for comparison

  return (
    <div className="space-y-4">
      {/* Free Plan Models */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Free Plan</h3>
        <div className="flex flex-wrap gap-2">
          {getModelsByPlan("free").map((modelKey) => {
            const isAvailable = availableModels.includes(modelKey);
            const hasWebSearch = modelSupportsWebSearch(modelKey);

            return (
              <div key={modelKey} className="relative">
                <ModelPill
                  label={MODEL_ALIASES[modelKey]}
                  active={model === modelKey}
                  locked={!isAvailable}
                  onClick={() => isAvailable && setModel(modelKey)}
                />
                {hasWebSearch && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full">
                    🌐
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pro Plan Models */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-medium text-gray-600">Pro Plan</h3>
          {userPlan === "free" && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Upgrade Required
            </span>
          )}
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            🌐 Web Search Included
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {getModelsByPlan("pro")
            .filter((m) => !getModelsByPlan("free").includes(m))
            .map((modelKey) => {
              const isAvailable = availableModels.includes(modelKey);
              const hasWebSearch = modelSupportsWebSearch(modelKey);

              return (
                <div key={modelKey} className="relative">
                  <ModelPill
                    label={MODEL_ALIASES[modelKey]}
                    active={model === modelKey}
                    locked={!isAvailable}
                    onClick={() => isAvailable && setModel(modelKey)}
                  />
                  {hasWebSearch && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full">
                      🌐
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
