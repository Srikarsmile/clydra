// Input validation schemas using Zod
// Provides runtime type safety for API endpoints and forms

import { z } from 'zod';

// Chat-related schemas
export const ChatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(10000, 'Message too long'),
  model: z.string().min(1, 'Model is required'),
  enableWebSearch: z.boolean().optional().default(false),
  threadId: z.string().uuid('Invalid thread ID').optional(),
});

export const ChatResponseSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  content: z.string().min(1, 'Response content is required'),
  model: z.string().min(1, 'Model is required'),
});

// Thread schemas
export const CreateThreadSchema = z.object({
  title: z.string().min(1, 'Thread title is required').max(200, 'Title too long'),
  firstMessage: z.string().min(1, 'First message is required').max(10000, 'Message too long'),
});

export const UpdateThreadSchema = z.object({
  id: z.string().uuid('Invalid thread ID'),
  title: z.string().min(1, 'Thread title is required').max(200, 'Title too long').optional(),
});

// User schemas
export const UserSchema = z.object({
  clerkId: z.string().min(1, 'Clerk ID is required'),
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
});

// Token usage schemas
export const TokenUsageSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  tokens: z.number().int().min(1, 'Token count must be positive'),
  model: z.string().min(1, 'Model is required').optional(),
  usedWebSearch: z.boolean().optional(),
});

export const ResetTokensSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// API Key schemas
export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100, 'Name too long'),
});

export const UpdateApiKeySchema = z.object({
  id: z.string().uuid('Invalid API key ID'),
  name: z.string().min(1, 'API key name is required').max(100, 'Name too long').optional(),
  isActive: z.boolean().optional(),
});

// Project schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long'),
  service: z.string().min(1, 'Service is required'),
  prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long'),
  settings: z.record(z.unknown()).optional().default({}),
});

export const UpdateProjectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long').optional(),
  service: z.string().min(1, 'Service is required').optional(),
  prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long').optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

// Webhook schemas
export const ClerkWebhookSchema = z.object({
  type: z.string().min(1, 'Webhook type is required'),
  data: z.object({
    id: z.string().min(1, 'User ID is required'),
    email_addresses: z.array(z.object({
      email_address: z.string().email('Invalid email format'),
    })).min(1, 'At least one email is required'),
    first_name: z.string().min(1, 'First name is required').optional(),
    last_name: z.string().min(1, 'Last name is required').optional(),
  }),
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

export const SortSchema = z.object({
  sortBy: z.string().min(1, 'Sort field is required').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Analytics schemas
export const AnalyticsEventSchema = z.object({
  event: z.string().min(1, 'Event name is required'),
  userId: z.string().uuid('Invalid user ID').optional(),
  properties: z.record(z.unknown()).optional().default({}),
  timestamp: z.coerce.date().optional().default(() => new Date()),
});

// Model validation
export const SupportedModels = [
  'google/gemini-2.5-flash-preview',
  'openai/gpt-4o',
  'anthropic/claude-3-5-sonnet-20241022',
  'x-ai/grok-3',
  'google/gemini-2.5-pro',
  'mistralai/mistral-small-3.2-24b-instruct',
  'shisa-ai/shisa-v2-llama3.3-70b:free',
  'sarvamai/sarvam-m:free',
  // Deprecated models
  'x-ai/grok-beta',
  'google/gemini-2.5-pro-exp-03-25',
] as const;

export const ModelSchema = z.enum(SupportedModels, {
  errorMap: () => ({ message: 'Unsupported model' }),
});

// Utility functions for validation
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return validateWithSchema(schema, data);
  };
}

// Export commonly used type inference
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type CreateThread = z.infer<typeof CreateThreadSchema>;
export type UpdateThread = z.infer<typeof UpdateThreadSchema>;
export type User = z.infer<typeof UserSchema>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKey = z.infer<typeof UpdateApiKeySchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ClerkWebhook = z.infer<typeof ClerkWebhookSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type SupportedModel = z.infer<typeof ModelSchema>;