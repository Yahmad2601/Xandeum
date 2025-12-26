import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const { Pool } = pg;

// Define nodes schema inline for serverless
const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  pubkey: text("pubkey").notNull().unique(),
  ip: text("ip").notNull(),
  version: text("version").notNull(),
  country: text("country").notNull(),
  city: text("city").default("Unknown"),
  status: text("status", { enum: ["online", "offline"] }).notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  uptime: integer("uptime").notNull().default(0),
  totalStorage: doublePrecision("total_storage").notNull(),
  storageUsed: doublePrecision("storage_used").notNull().default(0),
  stoincEarnings: doublePrecision("stoinc_earnings").notNull(),
  networkCapacity: doublePrecision("network_capacity").notNull().default(200000),
  stoincGenerated: doublePrecision("stoinc_generated").notNull().default(0),
  uptimeHistory: jsonb("uptime_history").$type<number[]>().notNull(),
  weeklyUptimeHistory: jsonb("weekly_uptime_history").$type<number[]>().notNull().default([]),
  lastUpdated: text("last_updated").notNull(),
  uptimeScore: doublePrecision("uptime_score").default(100),
  reliabilityRank: integer("reliability_rank"),
});

// GET /api/nodes/:pubkey - Get a single node by pubkey
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
    const { pubkey } = req.query;

    if (!pubkey || typeof pubkey !== "string") {
      return res.status(400).json({ message: "Pubkey is required" });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "DATABASE_URL not configured" });
    }

    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    const result = await db
      .select()
      .from(nodes)
      .where(eq(nodes.pubkey, pubkey))
      .limit(1);
    
    await pool.end();

    if (result.length === 0) {
      return res.status(404).json({ message: "Node not found" });
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
