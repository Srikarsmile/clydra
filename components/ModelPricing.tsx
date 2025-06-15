import { formatPrice } from "../lib/credit-system";
import { calculateDollarsNeeded } from "../lib/credit-system";

interface ModelPricingProps {
  modelId: string;
  className?: string;
}

export default function ModelPricing({
  modelId,
  className = "",
}: ModelPricingProps) {
  const dollarCost = calculateDollarsNeeded(modelId);

  const getModelType = (modelId: string) => {
    if (modelId.includes("imagen4")) return "image";
    if (modelId.includes("kling")) return "video";
    return "generation";
  };

  const modelType = getModelType(modelId);

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-semibold text-green-600">
        {formatPrice(dollarCost)} per {modelType}
      </span>
    </div>
  );
}

// Usage examples for different models
export function ImagePricing() {
  return (
    <ModelPricing
      modelId="fal-ai/imagen4/preview"
      className="bg-blue-50 px-3 py-1 rounded-full"
    />
  );
}

export function VideoPricing() {
  return (
    <ModelPricing
      modelId="fal-ai/kling-video/v2/master/text-to-video"
      className="bg-purple-50 px-3 py-1 rounded-full"
    />
  );
}
