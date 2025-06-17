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
      console.error('FAL_KEY environment variable is not configured');
      throw new Error("FAL_KEY environment variable is not configured");
    }

    console.log(`Starting ${modelConfig.type} generation with model: ${request.model}`);

    // Prepare the input based on model type and API requirements
    let input: Record<string, unknown>;

    // Google Imagen4 and other image models
    input = {
      prompt: request.prompt,
      ...request.settings,
    };

    // Execute the model
    console.log('Calling fal.subscribe with model:', request.model);
    
    // Set timeout for image generation
    const timeoutMs = 120000; // 2 minutes for image
    
    const result = await Promise.race([
      fal.subscribe(request.model, {
        input,
        logs: false,
        onQueueUpdate: (update) => {
          // Only log status changes for debugging
          if (update.status === "IN_PROGRESS" || update.status === "COMPLETED") {
            console.log('Generation status:', update.status);
          }
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs/1000} seconds`)), timeoutMs)
      )
    ]);

    console.log('FAL API completed successfully');

    const latency = Date.now() - startTime;

    // Calculate cost based on pricing model
    const cost = modelConfig.pricing;

    return {
      success: true,
      data: result,
      cost,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    console.error("FAL API Error:", error);

    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error body content (fal.ai returns detailed errors)
      if (error.message.includes("safety checks")) {
        errorMessage = "Content filtered by safety checks";
      } else if (error.message.includes("Bad Request")) {
        // Try to extract more specific error from error body
        const errorStr = error.toString();
        if (errorStr.includes("safety checks")) {
          errorMessage = "All generated content was filtered by safety checks";
        } else {
          errorMessage = "Invalid request parameters";
        }
      } else if (
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

    // Check if error has a body property (common with API errors)
    if (typeof error === 'object' && error !== null && 'body' in error) {
      const body = (error as any).body;
      if (body && body.detail) {
        if (body.detail.includes("safety checks")) {
          errorMessage = "Content filtered by safety checks - try a different prompt";
        } else {
          errorMessage = body.detail;
        }
      }
    }

    // Log the full error for debugging
    console.error('Full error details:', {
      message: errorMessage,
      originalError: error,
      stack: error instanceof Error ? error.stack : undefined
    });

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
