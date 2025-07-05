// @dev-migration - Development endpoint to migrate old threads
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { action } = req.body;

    if (action === "diagnose") {
      // Diagnose the current state
      console.log("🔍 Diagnosing thread migration issues...");

      // Check for threads with invalid user_id format
      const { data: invalidThreads, error: invalidError } = await supabaseAdmin
        .from("threads")
        .select("id, user_id, title, created_at")
        .not("user_id", "is", null);

      if (invalidError) {
        throw invalidError;
      }

      // Separate valid UUIDs from invalid ones
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validThreads = invalidThreads.filter((t) =>
        uuidPattern.test(t.user_id)
      );
      const clerkIdThreads = invalidThreads.filter(
        (t) => !uuidPattern.test(t.user_id)
      );

      // Check if Clerk ID threads can be mapped to users
      const mappableThreads = [];
      const orphanedThreads = [];

      for (const thread of clerkIdThreads) {
        const { data: user, error: userError } = await supabaseAdmin
          .from("users")
          .select("id, clerk_id")
          .eq("clerk_id", thread.user_id)
          .single();

        if (user && !userError) {
          mappableThreads.push({ ...thread, supabase_uuid: user.id });
        } else {
          orphanedThreads.push(thread);
        }
      }

      return res.status(200).json({
        diagnosis: {
          total_threads: invalidThreads.length,
          valid_uuid_threads: validThreads.length,
          clerk_id_threads: clerkIdThreads.length,
          mappable_threads: mappableThreads.length,
          orphaned_threads: orphanedThreads.length,
        },
        details: {
          mappable_threads: mappableThreads.slice(0, 5), // Show first 5 examples
          orphaned_threads: orphanedThreads.slice(0, 5), // Show first 5 examples
        },
      });
    }

    if (action === "migrate") {
      // Perform the migration
      console.log("🔄 Starting thread migration...");

      // Step 1: Update threads where user_id is a Clerk ID
      const { data: updateResult, error: updateError } =
        await supabaseAdmin.rpc("migrate_threads_to_uuids");

      if (updateError) {
        // If the RPC doesn't exist, do it manually
        console.log("RPC not available, doing manual migration...");

        // Get all threads with Clerk IDs
        const { data: clerkThreads, error: fetchError } = await supabaseAdmin
          .from("threads")
          .select("id, user_id")
          .not("user_id", "is", null);

        if (fetchError) {
          throw fetchError;
        }

        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const threadsToUpdate = clerkThreads.filter(
          (t) => !uuidPattern.test(t.user_id)
        );

        let migratedCount = 0;
        let errorCount = 0;

        for (const thread of threadsToUpdate) {
          try {
            // Find the user with this Clerk ID
            const { data: user, error: userError } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("clerk_id", thread.user_id)
              .single();

            if (user && !userError) {
              // Update the thread to use the Supabase UUID
              const { error: updateThreadError } = await supabaseAdmin
                .from("threads")
                .update({ user_id: user.id })
                .eq("id", thread.id);

              if (updateThreadError) {
                console.error(
                  `Failed to update thread ${thread.id}:`,
                  updateThreadError
                );
                errorCount++;
              } else {
                migratedCount++;
              }
            } else {
              console.log(`No user found for Clerk ID ${thread.user_id}`);
              errorCount++;
            }
          } catch (error) {
            console.error(`Error processing thread ${thread.id}:`, error);
            errorCount++;
          }
        }

        return res.status(200).json({
          migration_complete: true,
          migrated_threads: migratedCount,
          errors: errorCount,
          total_processed: threadsToUpdate.length,
        });
      }

      return res.status(200).json({
        migration_complete: true,
        result: updateResult,
      });
    }

    return res
      .status(400)
      .json({ error: "Invalid action. Use 'diagnose' or 'migrate'" });
  } catch (error) {
    console.error("Migration API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Migration failed",
    });
  }
}
