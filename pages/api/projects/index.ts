import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import {
  createProject,
  getUserProjects,
  createOrGetUser,
} from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get user authentication from Clerk
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      // Get user's projects
      const { data: projects, error } = await getUserProjects(clerkUserId);

      if (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).json({ error: "Failed to fetch projects" });
      }

      return res.status(200).json({ projects });
    } else if (req.method === "POST") {
      // Create a new project
      const { name, service, prompt, settings = {} } = req.body;

      if (!name || !service || !prompt) {
        return res.status(400).json({
          error: "Missing required fields: name, service, prompt",
        });
      }

      // Ensure user exists in Supabase (this should be handled by webhook, but fallback)
      const { data: user } = await createOrGetUser(
        clerkUserId,
        (req.headers["x-user-email"] as string) || "",
        (req.headers["x-user-first-name"] as string) || "User",
        (req.headers["x-user-last-name"] as string) || ""
      );

      if (!user) {
        return res.status(500).json({ error: "Failed to create or get user" });
      }

      // Create the project
      const { data: project, error } = await createProject(
        user.id,
        name,
        service,
        prompt,
        settings
      );

      if (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project" });
      }

      return res.status(201).json({ project });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
