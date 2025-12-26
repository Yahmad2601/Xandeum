import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { desc } from "drizzle-orm";

const { Pool } = pg;

// Define schema inline for serverless
const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["earnings", "status-change", "upgrade", "storage-commit", "new-node"] }).notNull(),
  nodeId: text("node_id"),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

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
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "DATABASE_URL not configured" });
    }

    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    const limit = parseInt(req.query?.limit as string) || 20;
    const recentActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
    
    await pool.end();
    return res.status(200).json(recentActivities);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
