import { supabaseAdmin } from "./supabase";
import { initializeUserCredits } from "./credit-utils";

export interface UserResult {
  success: boolean;
  user?: { id: string };
  error?: string;
}

/**
 * Get or create a user in Supabase based on Clerk user ID
 */
export async function getOrCreateUser(
  clerkUserId: string
): Promise<UserResult> {
  try {
    // First try to get existing user
    let { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    // If user doesn't exist, create them
    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          clerk_id: clerkUserId,
          email: "", // Will be populated by webhook later
          first_name: "",
          last_name: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        console.error("Error creating user:", createError);
        return {
          success: false,
          error: "Failed to create user",
        };
      }

      user = newUser;

      // Initialize credits for new user
      const creditResult = await initializeUserCredits(user.id);
      if (!creditResult.success) {
        console.error("Error initializing user credits:", creditResult.error);
        // Don't fail the whole process, just log the error
      }
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    return {
      success: false,
      error: "Database error",
    };
  }
}
