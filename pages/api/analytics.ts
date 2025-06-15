import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get time ranges for analytics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total requests and success rate
    const { data: allRequests } = await supabaseAdmin
      .from("api_requests")
      .select("*")
      .eq("user_id", userId);

    const { data: last30DaysRequests } = await supabaseAdmin
      .from("api_requests")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", last30Days.toISOString());

    const { data: last7DaysRequests } = await supabaseAdmin
      .from("api_requests")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", last7Days.toISOString());

    // Calculate statistics
    const totalRequests = allRequests?.length || 0;
    const successfulRequests =
      allRequests?.filter((r) => r.status === "success").length || 0;
    const totalCost = allRequests?.reduce((sum, r) => sum + r.cost, 0) || 0;
    const avgLatency =
      totalRequests > 0 && allRequests
        ? allRequests.reduce((sum, r) => sum + r.latency, 0) / totalRequests
        : 0;

    const last30DaysTotal = last30DaysRequests?.length || 0;
    const last7DaysTotal = last7DaysRequests?.length || 0;

    // Success rate
    const successRate =
      totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    // Model usage breakdown
    const modelUsage: Record<string, number> = {};
    allRequests?.forEach((request) => {
      modelUsage[request.model] = (modelUsage[request.model] || 0) + 1;
    });

    // Daily usage for the last 30 days
    const dailyUsage: { date: string; requests: number; cost: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayRequests =
        allRequests?.filter((r) => {
          const requestDate = new Date(r.created_at);
          return requestDate >= dayStart && requestDate <= dayEnd;
        }) || [];

      dailyUsage.push({
        date: dayStart.toISOString().split("T")[0],
        requests: dayRequests.length,
        cost: dayRequests.reduce((sum, r) => sum + r.cost, 0),
      });
    }

    // API key usage
    const { data: apiKeys } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, last_used")
      .eq("user_id", userId)
      .eq("is_active", true);

    const apiKeyUsage = await Promise.all(
      (apiKeys || []).map(async (key) => {
        const { count } = await supabaseAdmin
          .from("api_requests")
          .select("*", { count: "exact", head: true })
          .eq("api_key_id", key.id);

        return {
          id: key.id,
          name: key.name,
          lastUsed: key.last_used,
          totalRequests: count || 0,
        };
      })
    );

    return res.status(200).json({
      overview: {
        totalRequests,
        successfulRequests,
        totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
        avgLatency: Math.round(avgLatency),
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal place
        last30DaysTotal,
        last7DaysTotal,
      },
      modelUsage,
      dailyUsage,
      apiKeyUsage,
      trends: {
        requestsGrowth:
          last30DaysTotal > 0 && last7DaysTotal > 0
            ? Math.round(
                (last7DaysTotal / 7 / (last30DaysTotal / 30) - 1) * 100 * 10
              ) / 10
            : 0,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
