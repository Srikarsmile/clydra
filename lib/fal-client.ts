import { fal } from "@fal-ai/client";

// Initialize Fal client with single API key
fal.config({
  credentials: process.env.FAL_KEY!,
});

// Model configurations and pricing
export const AVAILABLE_MODELS = {
  "fal-ai/imagen4/preview": {
    name: "Google Imagen4",
    type: "image",
    description:
      "Google's state-of-the-art text-to-image generation model with exceptional quality and prompt adherence",
    pricing: 0.05, // per image
    category: "Image Generation",
    maxPromptLength: 2000,
    supportedFormats: ["JPEG", "PNG"],
    defaultSettings: {
      width: 1024,
      height: 1024,
      num_images: 1,
    },
  },
  "fal-ai/kling-video/v2/master/text-to-video": {
    name: "Kling Video 2.0 Master",
    type: "video",
    description:
      "Advanced text-to-video generation with enhanced motion quality, complex scene understanding, and cinematic output",
    pricing: 0.30, // per second ($1.50 for 5s, $3.00 for 10s)
    pricingModel: "per-second",
    category: "Video Generation",
    maxPromptLength: 2000,
    supportedDurations: [5, 10],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    defaultSettings: {
      duration: 5,
      aspect_ratio: "16:9",
      cfg_scale: 0.5,
      negative_prompt: "blur, distort, and low quality",
    },
  },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

export interface ModelRequest {
  model: ModelId;
  prompt: string;
  settings?: Record<string, unknown>;
}

export interface ModelResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  cost: number;
  latency: number;
}

/**
 * Execute a model request through Fal.AI
 */
export async function executeModelRequest(
  request: ModelRequest
): Promise<ModelResponse> {
  const startTime = Date.now();

  try {
    const modelConfig = AVAILABLE_MODELS[request.model];

    if (!modelConfig) {
      throw new Error(`Invalid model: ${request.model}`);
    }

    // Check if FAL_KEY is configured
    if (!process.env.FAL_KEY) {
      throw new Error("FAL_KEY environment variable is not configured");
    }

    // Prepare the input based on model type and API requirements
    let input: Record<string, unknown>;

    if (request.model === "fal-ai/kling-video/v2/master/text-to-video") {
      // Kling Video 2.0 Master specific settings
      const videoDefaults =
        AVAILABLE_MODELS["fal-ai/kling-video/v2/master/text-to-video"]
          .defaultSettings;
      input = {
        prompt: request.prompt,
        duration: request.settings?.duration || videoDefaults.duration,
        aspect_ratio:
          request.settings?.aspect_ratio || videoDefaults.aspect_ratio,
        cfg_scale: request.settings?.cfg_scale || videoDefaults.cfg_scale,
        negative_prompt:
          request.settings?.negative_prompt || videoDefaults.negative_prompt,
        ...request.settings,
      };
    } else {
      // Google Imagen4 and other models
      input = {
        prompt: request.prompt,
        ...request.settings,
      };
    }

    // Execute the model
    const result = await fal.subscribe(request.model, {
      input,
      logs: false,
      onQueueUpdate: (update) => {
        // Production: minimal logging only
        if (update.status === "IN_PROGRESS") {
          // Silent processing
        }
      },
    });

    const latency = Date.now() - startTime;

    // Calculate cost based on pricing model
    let cost = modelConfig.pricing;
    if (request.model === "fal-ai/kling-video/v2/master/text-to-video") {
      // Per-second pricing for Kling Video
      const duration = (request.settings?.duration as number) || 5;
      cost = modelConfig.pricing * duration;
    }

    return {
      success: true,
      data: result,
      cost,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific Fal API errors
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        errorMessage = "Invalid or expired FAL API key";
      } else if (
        errorMessage.includes("402") ||
        errorMessage.includes("Payment")
      ) {
        errorMessage = "Insufficient FAL API credits";
      } else if (
        errorMessage.includes("429") ||
        errorMessage.includes("rate limit")
      ) {
        errorMessage = "FAL API rate limit exceeded";
      } else if (
        errorMessage.includes("503") ||
        errorMessage.includes("Service Unavailable")
      ) {
        errorMessage = "FAL API service temporarily unavailable";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "Request timeout - model processing took too long";
      }
    }

    return {
      success: false,
      error: errorMessage,
      cost: 0,
      latency,
    };
  }
}

/**
 * Get model information
 */
export function getModelInfo(modelId: ModelId) {
  return AVAILABLE_MODELS[modelId];
}

/**
 * Get all available models grouped by category
 */
export function getModelCatalog() {
  const catalog: Record<
    string,
    Array<(typeof AVAILABLE_MODELS)[ModelId] & { id: ModelId }>
  > = {};

  Object.entries(AVAILABLE_MODELS).forEach(([id, model]) => {
    if (!catalog[model.category]) {
      catalog[model.category] = [];
    }
    catalog[model.category].push({ ...model, id: id as ModelId });
  });

  return catalog;
}

/**
 * Validate model request
 */
export function validateModelRequest(request: ModelRequest): {
  valid: boolean;
  error?: string;
} {
  if (!request.model) {
    return { valid: false, error: "Model is required" };
  }

  if (!AVAILABLE_MODELS[request.model]) {
    return { valid: false, error: "Invalid model" };
  }

  if (!request.prompt || request.prompt.trim().length === 0) {
    return { valid: false, error: "Prompt is required" };
  }

  if (request.prompt.length > 2000) {
    return { valid: false, error: "Prompt too long (max 2000 characters)" };
  }

  return { valid: true };
}
