/**
 * @clydra-core
 * Convo Core - Model Picker Component
 *
 * Shows available flagship models with plan gating and locked pills for upgrades
 */

import { MODEL_ALIASES, ChatModel } from "@/types/chatModels";
import ModelPill from "./ModelPill";

interface ModelPickerProps {
  model: ChatModel;
  setModel: (model: ChatModel) => void;
  userPlan: "free" | "pro" | "max";
}

// All models unlocked for internal build

const MODELS: { key: ChatModel; minPlan: "free" | "pro" | "max" }[] = [
  { key: "openai/gpt-4o", minPlan: "free" },
  { key: "google/gemini-2.5-flash-preview", minPlan: "free" }, // @fluid-ui - updated model name
  { key: "google/gemini-2.5-pro", minPlan: "free" }, // @unlock @gem25
  { key: "anthropic/claude-sonnet-4", minPlan: "free" }, // @unlock @flagship
  { key: "anthropic/claude-opus-4", minPlan: "free" }, // @unlock @flagship
  { key: "anthropic/claude-3-sonnet-20240229", minPlan: "free" }, // @unlock
  { key: "google/gemini-1.5-pro", minPlan: "free" }, // @unlock
  { key: "deepseek/deepseek-r1", minPlan: "free" }, // @fluid-ui - updated model name
  { key: "anthropic/claude-3-opus-20240229", minPlan: "free" }, // @unlock
  { key: "meta-llama/llama-3-70b-instruct", minPlan: "free" }, // @unlock
];

 
export default function ModelPicker({
  model,
  setModel,
  userPlan,
}: ModelPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODELS.map((m) => {
        const locked = false; // All models unlocked for internal build
        return (
          <ModelPill
            key={m.key}
            label={MODEL_ALIASES[m.key]}
            active={model === m.key}
            locked={locked}
            onClick={() => !locked && setModel(m.key)}
          />
        );
      })}
    </div>
  );
}
