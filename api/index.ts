import "dotenv/config";
import { db } from "../server/db";
import { nodes, activities } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

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
    // GET /api - List all nodes (main endpoint)
    if (req.method === "GET") {
      const allNodes = await db.select().from(nodes);
      // Filter out test nodes
      const filtered = allNodes.filter(
        (node) =>
          !node.ip.startsWith("127.") &&
          !node.ip.startsWith("localhost") &&
          !node.pubkey.toLowerCase().includes("test")
      );
      return res.status(200).json(filtered);
    }

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
