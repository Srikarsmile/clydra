import { WebhookEvent } from "@clerk/nextjs/server";
import { createOrGetUser } from "./supabase";
import { initializeUserCredits } from "./credit-utils";

export async function syncClerkUserToSupabase(
  clerkUserId: string,
  email: string,
  firstName: string,
  lastName: string
) {
  try {
    const result = await createOrGetUser(
      clerkUserId,
      email,
      firstName,
      lastName
    );

    if (result.error) {
      console.error("Error syncing user to Supabase:", result.error);
      return { success: false, error: result.error };
    }

    // Initialize credits for new users
    if (result.data) {
      const creditResult = await initializeUserCredits(result.data.id);
      if (!creditResult.success) {
        console.error("Error initializing user credits:", creditResult.error);
        // Don't fail the whole process, just log the error
      }
    }

    return { success: true, user: result.data };
  } catch (error) {
    console.error("Error in syncClerkUserToSupabase:", error);
    return { success: false, error };
  }
}

export function handleClerkWebhook(event: WebhookEvent) {
  switch (event.type) {
    case "user.created":
    case "user.updated":
      const { id, email_addresses, first_name, last_name } = event.data;
      const primaryEmail = email_addresses.find(
        (email) => email.id === event.data.primary_email_address_id
      );

      if (primaryEmail && first_name && last_name) {
        return syncClerkUserToSupabase(
          id,
          primaryEmail.email_address,
          first_name,
          last_name
        );
      }
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }

  return { success: true };
}
