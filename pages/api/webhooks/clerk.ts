import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from "next";
import { handleClerkWebhook } from "../../../lib/clerk-supabase-sync";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Error occurred -- no svix headers" });
  }

  // Get the body
  const body = JSON.stringify(req.body);

  // Create a new Svix instance with your secret.
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }
  
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res
      .status(400)
      .json({ error: "Error occurred during webhook verification" });
  }

  // Handle the webhook
  try {
    const result = await handleClerkWebhook(evt);

    if (!result.success && "error" in result) {
      console.error("Error handling webhook:", result.error);
      return res.status(500).json({ error: "Error handling webhook" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
