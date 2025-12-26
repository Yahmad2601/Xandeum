import "dotenv/config";
import { db } from "../server/db";
import { activities } from "../shared/schema";
import { desc } from "drizzle-orm";

// GET /api/activities - List recent activities
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const limit = parseInt(req.query?.limit as string) || 20;
    const recentActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
    return res.status(200).json(recentActivities);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
