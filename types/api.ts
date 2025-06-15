// API Key types
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used: string | null;
  created_at: string;
  is_active: boolean;
  key?: string; // Only included on creation
}

// API Request types
export interface ApiRequest {
  id: string;
  user_id: string;
  api_key_id: string | null;
  model: string;
  prompt: string;
  response_data: any;
  cost: number;
  latency: number;
  status: "success" | "error" | "pending";
  error_message: string | null;
  created_at: string;
}

// Analytics types
export interface Analytics {
  overview: {
    totalRequests: number;
    successfulRequests: number;
    totalCost: number;
    avgLatency: number;
    successRate: number;
    last30DaysTotal: number;
    last7DaysTotal: number;
  };
  modelUsage: Record<string, number>;
  dailyUsage: Array<{
    date: string;
    requests: number;
    cost: number;
  }>;
  apiKeyUsage: Array<{
    id: string;
    name: string;
    lastUsed: string | null;
    totalRequests: number;
  }>;
  trends: {
    requestsGrowth: number;
  };
}

// Model catalog types
export interface ModelInfo {
  id: string;
  name: string;
  type: "image" | "video" | "text" | "audio";
  description: string;
  pricing: number;
  category: string;
}

export interface ModelCatalog {
  models: Record<string, ModelInfo[]>;
  metadata: {
    totalModels: number;
    categories: number;
    categoryList: string[];
  };
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model?: string;
    cost?: number;
    latency?: number;
  };
}

// Request/Response for the main API gateway
export interface GenerateRequest {
  model: string;
  prompt: string;
  settings?: Record<string, any>;
}

export interface GenerateResponse {
  success: boolean;
  data: any;
  metadata: {
    model: string;
    cost: number;
    latency: number;
  };
}

// Error response type
export interface ErrorResponse {
  error: string;
  details?: string;
}
