import { createClient } from "@supabase/supabase-js";

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

if (!supabaseServiceKey) {
  throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
}

// Public client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for backend operations (admin access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Utility function to create or get user
export async function createOrGetUser(
  clerkUserId: string,
  email: string,
  firstName: string,
  lastName: string
) {
  try {
    // First try to get existing user
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", clerkUserId)
      .single();

    if (existingUser && !selectError) {
      return { data: existingUser, error: null };
    }

    // If user doesn't exist, create them
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        clerk_id: clerkUserId,
        email,
        first_name: firstName,
        last_name: lastName,
      })
      .select()
      .single();

    return { data: newUser, error: insertError };
  } catch (error) {
    return { data: null, error };
  }
}

// Utility function to get or create user with just Clerk ID
export async function getOrCreateUser(clerkUserId: string) {
  try {
    // First try to get existing user
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("clerk_id", clerkUserId)
      .single();

    if (existingUser && !selectError) {
      return { success: true, user: existingUser };
    }

    // If user doesn't exist, return error - user should be created via webhook
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error };
  }
}

// Utility function to create a new project
export async function createProject(
  userId: string,
  name: string,
  service: string,
  prompt: string,
  settings: Record<string, unknown> = {}
) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name,
        service,
        prompt,
        settings,
        status: "pending",
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Utility function to get user's projects
export async function getUserProjects(userId: string) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Utility function to update project status
export async function updateProjectStatus(
  projectId: string,
  status: "pending" | "processing" | "completed" | "failed",
  resultUrl?: string,
  cost?: number,
  latency?: number
) {
  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (resultUrl) updateData.result_url = resultUrl;
    if (cost !== undefined) updateData.cost = cost;
    if (latency !== undefined) updateData.latency = latency;

    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Utility function to log API requests
export async function logApiRequest(
  userId: string,
  model: string,
  prompt: string,
  responseData: unknown,
  cost: number = 0,
  latency: number = 0,
  status: "success" | "error" | "pending" = "success",
  errorMessage?: string
) {
  try {
    const { data, error } = await supabase.from("api_requests").insert({
      user_id: userId,
      model,
      prompt,
      response_data: responseData,
      cost,
      latency,
      status,
      error_message: errorMessage,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          first_name: string;
          last_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          first_name: string;
          last_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used: string | null;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used?: string | null;
          is_active?: boolean;
        };
      };
      api_requests: {
        Row: {
          id: string;
          user_id: string;
          api_key_id: string | null;
          model: string;
          prompt: string;
          response_data: unknown;
          cost: number;
          latency: number;
          status: "success" | "error" | "pending";
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_key_id?: string | null;
          model: string;
          prompt: string;
          response_data?: unknown;
          cost?: number;
          latency?: number;
          status?: "success" | "error" | "pending";
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_key_id?: string | null;
          model?: string;
          prompt?: string;
          response_data?: unknown;
          cost?: number;
          latency?: number;
          status?: "success" | "error" | "pending";
          error_message?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          service: string;
          prompt: string;
          settings: unknown;
          cost: number;
          latency: number;
          result_url: string;
          status: "pending" | "processing" | "completed" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          service: string;
          prompt: string;
          settings?: unknown;
          cost?: number;
          latency?: number;
          result_url?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          service?: string;
          prompt?: string;
          settings?: unknown;
          cost?: number;
          latency?: number;
          result_url?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          updated_at?: string;
        };
      };
    };
  };
}
