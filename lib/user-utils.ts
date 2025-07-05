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
    const { data: userData, error: selectError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    let user = userData;

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
      console.log("Creating new user for Clerk ID:", clerkUserId);

      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          clerk_id: clerkUserId,
          email: `user-${clerkUserId}@temp.local`, // Temporary email to satisfy constraints
          first_name: "User",
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

      console.log("✅ New user created with ID:", newUser.id);
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
