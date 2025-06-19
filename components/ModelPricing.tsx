import { AVAILABLE_MODELS } from "../lib/fal-client";

interface ModelPricingProps {
  modelId: string;
  className?: string;
}

export function ModelPricing({ modelId, className }: ModelPricingProps) {
  const model = AVAILABLE_MODELS[modelId as keyof typeof AVAILABLE_MODELS];

  if (!model) return null;

  const getModelType = (id: string) => {
    if (id.includes("imagen")) return "image";
    return "unknown";
  };

  const modelType = getModelType(modelId);
  const pricing = model.pricing;

  return (
    <span className={`text-xs font-medium ${className || "text-gray-600"}`}>
      ${pricing.toFixed(2)}/{modelType === "image" ? "image" : "generation"}
    </span>
  );
}

export function ImagePricing() {
  return (
    <ModelPricing
      modelId="fal-ai/imagen4/preview"
      className="bg-blue-50 px-2 py-1 rounded-full"
    />
  );
}
