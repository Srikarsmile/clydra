import { supabaseAdmin } from "./supabase";

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
    // First try to get existing user using admin client
    let { data: user, error: selectError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is OK for new users
      console.error("getOrCreateUser: Error selecting user:", selectError);
      return {
        success: false,
        error: "Failed to query user",
      };
    }

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
        console.error("getOrCreateUser: Error creating user:", createError);
        return {
          success: false,
          error: "Failed to create user",
        };
      }

      user = newUser;
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("getOrCreateUser: Unexpected error:", error);
    return {
      success: false,
      error: "Database error",
    };
  }
}
