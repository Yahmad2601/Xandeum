import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, integer, boolean, real, jsonb, timestamp } from "drizzle-orm/pg-core";

const { Pool } = pg;

// Define nodes schema inline for serverless
const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  port: integer("port").notNull(),
  pubkey: text("pubkey").notNull().unique(),
  version: text("version"),
  featureSet: text("feature_set"),
  shredVersion: integer("shred_version"),
  gossip: text("gossip"),
  tpu: text("tpu"),
  rpc: text("rpc"),
  status: text("status", { enum: ["online", "offline"] }).notNull().default("online"),
  xdnScore: integer("xdn_score").default(0),
  isXandeum: boolean("is_xandeum").default(true),
  isValidator: boolean("is_validator").default(true),
  storageCapacity: integer("storage_capacity"),
  storageUsed: integer("storage_used"),
  uptimeScore: real("uptime_score"),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  location: jsonb("location").$type<{ country: string; city: string; lat: number; lng: number }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Vercel Serverless Function - handles all /api/* routes
export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
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

    // GET /api - List all nodes (main endpoint)
    if (req.method === "GET") {
      const allNodes = await db.select().from(nodes);
      await pool.end();
      // Filter out test nodes
      const filtered = allNodes.filter(
        (node) =>
          !node.ip.startsWith("127.") &&
          !node.ip.startsWith("localhost") &&
          !node.pubkey.toLowerCase().includes("test")
      );
      return res.status(200).json(filtered);
    }

    await pool.end();
    // 404 for unknown methods
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
