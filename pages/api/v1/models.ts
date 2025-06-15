import { NextApiRequest, NextApiResponse } from "next";
import { getModelCatalog, AVAILABLE_MODELS } from "../../../lib/fal-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const catalog = getModelCatalog();

    // Add total count and metadata
    const totalModels = Object.keys(AVAILABLE_MODELS).length;
    const categories = Object.keys(catalog);

    return res.status(200).json({
      models: catalog,
      metadata: {
        totalModels,
        categories: categories.length,
        categoryList: categories,
      },
    });
  } catch (error) {
    console.error("Models catalog error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
