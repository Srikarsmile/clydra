/**
 * @models - Typed model wrappers with unified system prompts
 */
import OpenAI from "openai";
import { ChatModel, isKlusterAIModel, isSarvamAIModel } from "@/types/chatModels";
// Removed unused modelOptimizer import

// Minimal system prompt for fastest processing
const UNIVERSAL_SYSTEM_PROMPT = `You are Clydra. Be concise and helpful. Always respond in English unless the user explicitly states they want a different language or their message is clearly in a non-English language.`;

interface ModelConfig {
  baseURL: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
  providerName: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  webSearch?: boolean;
  webSearchContextSize?: "low" | "medium" | "high";
  wikiGrounding?: boolean;
  preferredLang?: string;
  parallel?: boolean;
  priority?: "high" | "normal" | "low";
  cache?: boolean;
}

interface ModelResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  stream?: ReadableStream;
}

// Get configuration for a model
function getModelConfig(model: ChatModel): ModelConfig {
  // Check if this is a Kluster AI model
  if (isKlusterAIModel(model)) {
    return {
      baseURL: "https://api.kluster.ai/v1",
      apiKey: process.env.KLUSTER_API_KEY || "",
      defaultHeaders: {
        "Content-Type": "application/json",
      },
      providerName: "Kluster AI",
    };
  }
  
  // Check if this is a Sarvam AI model
  if (isSarvamAIModel(model)) {
    return {
      baseURL: "https://api.sarvam.ai/v1",
      apiKey: process.env.SARVAM_API_KEY || "",
      defaultHeaders: {
        "api-subscription-key": process.env.SARVAM_API_KEY || "",
        "Content-Type": "application/json",
      },
      providerName: "Sarvam AI",
    };
  }
  
  // Use OpenRouter for all other models
  return {
    baseURL: process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://www.clydra.chat",
      "X-Title": "Clydra Chat",
    },
    providerName: "OpenRouter",
  };
}

// Build system prompt with language preference
function buildSystemPrompt(preferredLang?: string): string {
  let systemPrompt = UNIVERSAL_SYSTEM_PROMPT;
  
  // Only add language instruction for actual language codes, not casual expressions
  if (preferredLang && preferredLang !== "en" && isValidLanguageCode(preferredLang)) {
    systemPrompt += ` The user's preferred language is ${preferredLang}, so respond in that language unless they explicitly ask for English.`;
  }
  
  return systemPrompt;
}

// Helper to validate actual language codes vs casual expressions
function isValidLanguageCode(lang: string): boolean {
  // Standard ISO 639-1 language codes
  const validLanguageCodes = [
    'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi',
    'he', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'et', 'lv', 'lt', 'el', 'mt', 'cy', 'ga', 'is', 'fo', 'uk', 'be',
    'mk', 'sq', 'sr', 'bs', 'me', 'xk', 'ka', 'hy', 'az', 'kk', 'ky', 'uz', 'tk', 'mn', 'fa', 'ps', 'ur', 'bn', 'ne',
    'si', 'my', 'km', 'lo', 'ms', 'id', 'tl', 'sw', 'am', 'ti', 'so', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 've', 'ts', 'nr'
  ];
  
  // Must be exactly 2 characters and in the valid list
  return lang.length === 2 && validLanguageCodes.includes(lang.toLowerCase());
}

// Prepare messages with system prompt
function prepareMessages(messages: ChatMessage[], preferredLang?: string): ChatMessage[] {
  const systemPrompt = buildSystemPrompt(preferredLang);
  
  // Check if first message is already a system message
  const hasSystemMessage = messages[0]?.role === "system";
  
  if (hasSystemMessage) {
    // Prepend our system prompt to existing system message
    return [
      { role: "system", content: `${systemPrompt}\n\n${messages[0].content}` },
      ...messages.slice(1),
    ];
  }
  
  // Add system prompt as first message
  return [
    { role: "system", content: systemPrompt },
    ...messages,
  ];
}


// Specific model wrapper functions
export async function callClaude(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("anthropic/claude-3-5-sonnet-20241022", messages, options);
}

export async function callGPT4(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("openai/gpt-4o", messages, options);
}

export async function callGemini(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("google/gemini-2.5-flash-preview", messages, options);
}

export async function callGeminiPro(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("google/gemini-2.5-pro", messages, options);
}

export async function callGrok(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("x-ai/grok-3", messages, options);
}

export async function callMistral(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("mistralai/magistral-small-2506", messages, options);
}

export async function callLlama(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("klusterai/meta-llama-3.3-70b-instruct-turbo", messages, options);
}

export async function callVerifyReliability(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("klusterai/verify-reliability", messages, options);
}

export async function callSarvam(
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel("sarvam-m", messages, options);
}

// Multi-model response with Promise.allSettled and parallel processing
export async function callMultipleModels(
  models: ChatModel[],
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<Array<{ model: ChatModel; response?: ModelResponse; error?: string }>> {
  // Enable parallel processing and caching for multi-model requests
  const enhancedOptions = {
    ...options,
    parallel: true,
    cache: true,
    priority: "high" as const
  };

  const promises = models.map(async (model) => {
    try {
      const response = await callModel(model, messages, enhancedOptions);
      return { model, response };
    } catch (error) {
      return { 
        model, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  });

  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return { 
        model: models[index], 
        error: result.reason instanceof Error ? result.reason.message : "Promise rejected" 
      };
    }
  });
}

// Helper function to get system prompt
export function getSystemPrompt(preferredLang?: string): string {
  return buildSystemPrompt(preferredLang);
}

// Generic model calling function (exported for use in API routes)
export async function callModel(
  model: ChatModel,
  messages: ChatMessage[],
  options: ModelOptions = {}
): Promise<ModelResponse> {
  const config = getModelConfig(model);
  
  if (!config.apiKey) {
    throw new Error(`${config.providerName} API key not configured`);
  }

  // Create OpenAI client with appropriate configuration
  let client;
  if (isKlusterAIModel(model)) {
    // For Kluster AI, standard OpenAI client configuration
    client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      defaultHeaders: {
        ...config.defaultHeaders,
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=60',
      },
      timeout: 8000,
      maxRetries: 0,
      fetch: undefined,
    });
  } else if (isSarvamAIModel(model)) {
    // For Sarvam AI, we need custom fetch to handle their authentication
    const customFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      // Remove any Authorization header that OpenAI client might add
      headers.delete('Authorization');
      // Add Sarvam's required header
      headers.set('api-subscription-key', config.apiKey);
      headers.set('Content-Type', 'application/json');
      
      const newInit = {
        ...init,
        headers: headers,
      };
      
      return fetch(input, newInit);
    };

    client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: "sk-dummy", // Dummy API key to prevent OpenAI client from erroring
      defaultHeaders: {
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=60',
      },
      timeout: 10000, // Increase timeout for Sarvam
      maxRetries: 1, // Allow one retry for Sarvam
      fetch: customFetch,
    });
  } else {
    // Standard OpenRouter configuration
    client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      defaultHeaders: {
        ...config.defaultHeaders,
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=60',
      },
      timeout: 8000,
      maxRetries: 0,
      fetch: undefined,
    });
  }

  const preparedMessages = prepareMessages(messages, options.preferredLang);
  
  // Prepare model string for web search
  const modelString = options.webSearch
    ? `${model}:online`
    : model;

  const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
    model: modelString,
    messages: preparedMessages,
    temperature: options.temperature || 0.2, // Very low for maximum speed
    max_tokens: options.maxTokens || 400, // Ultra-short for speed
    top_p: 0.8, // Reduced for faster sampling
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: options.stream || false,
    parallel_tool_calls: true, // Always enable for speed
  };

  // Add web search options for OpenRouter
  if (options.webSearch) {
    (requestOptions as unknown as Record<string, unknown>).web_search_options = {
      search_context_size: options.webSearchContextSize || "medium",
    };
  }

  // Add wiki grounding for Sarvam AI models
  if (options.wikiGrounding && isSarvamAIModel(model)) {
    (requestOptions as unknown as Record<string, unknown>).wiki_grounding = true;
  }

  // Log model request for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Making request to model:', model, 'with options:', {
      temperature: requestOptions.temperature,
      max_tokens: requestOptions.max_tokens,
      stream: requestOptions.stream,
      provider: config.providerName,
      baseURL: config.baseURL
    });
  }

  let completion;
  try {
    completion = await client.chat.completions.create(requestOptions);
  } catch (error) {
    console.error(`Error calling model ${model}:`, error);
    if (error instanceof Error) {
      // Check for specific model-related errors
      if (error.message.includes('model not found') || error.message.includes('invalid model')) {
        throw new Error(`Model ${model} is not available or invalid on ${config.providerName}`);
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.message.includes('insufficient credits')) {
        throw new Error(`Insufficient credits. Please check your ${config.providerName} account.`);
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        if (isSarvamAIModel(model)) {
          throw new Error('Sarvam AI API key is invalid or missing. Please check your SARVAM_API_KEY environment variable.');
        }
        throw new Error(`API key is invalid for ${config.providerName}.`);
      }
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error(`Access forbidden. Please check your API permissions for ${config.providerName}.`);
      }
    }
    throw error;
  }

  if (options.stream) {
    // Return streaming response with optimized chunk handling
    let fullContent = "";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chunks: string[] = [];
          for await (const chunk of completion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              chunks.push(content);
              
              // Ultra-fast streaming - send every chunk immediately
              if (chunks.length >= 1) { // Send every single chunk for maximum speed
                controller.enqueue(new TextEncoder().encode(
                  `data: ${JSON.stringify({ content: chunks.join('') })}\n\n`
                ));
                chunks.length = 0;
              }
            }
          }
          
          // Send remaining chunks
          if (chunks.length > 0) {
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ content: chunks.join('') })}\n\n`
            ));
          }
          
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return { content: fullContent, stream };
  }

  // Non-streaming response
  const content = (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content || "";
  const usage = (completion as OpenAI.Chat.Completions.ChatCompletion).usage;

  return {
    content,
    usage: usage ? {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    } : undefined,
  };
}

// Performance monitoring and optimization helpers
export function getModelStats() {
  return {
    connectionPool: "stats not available",
    cache: "stats not available"
  };
}

// Optimized model calling with priority queue
export async function callModelWithPriority(
  model: ChatModel,
  messages: ChatMessage[],
  priority: "high" | "normal" | "low" = "normal",
  options: ModelOptions = {}
): Promise<ModelResponse> {
  return callModel(model, messages, {
    ...options,
    priority,
    cache: true,
    parallel: true
  });
}

// Batch processing for multiple requests
export async function batchModelRequests(
  requests: Array<{
    model: ChatModel;
    messages: ChatMessage[];
    options?: ModelOptions;
  }>
): Promise<Array<ModelResponse | { error: string }>> {
  const batchSize = 3; // Process 3 requests at a time
  const results: Array<ModelResponse | { error: string }> = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchPromises = batch.map(async (req) => {
      try {
        return await callModel(req.model, req.messages, {
          ...req.options,
          cache: true,
          parallel: true
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(result => 
      result.status === "fulfilled" ? result.value : { error: "Request failed" }
    ));
  }

  return results;
}

// Export types
export type { ChatMessage, ModelOptions, ModelResponse };