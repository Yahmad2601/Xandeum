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

  const path = req.url?.replace(/^\/api/, "") || "/";

  try {
    // GET /api/nodes - List all nodes
    if (path === "/nodes" && req.method === "GET") {
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

    // GET /api/nodes/:pubkey - Get single node
    if (path.match(/^\/nodes\/[^/]+$/) && req.method === "GET") {
      const pubkey = path.split("/")[2];
      const [node] = await db.select().from(nodes).where(eq(nodes.pubkey, pubkey));
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      return res.status(200).json(node);
    }

    // GET /api/activities - Get recent activities
    if (path === "/activities" && req.method === "GET") {
      const limit = parseInt(req.query.limit as string) || 20;
      const recentActivities = await db
        .select()
        .from(activities)
        .orderBy(desc(activities.timestamp))
        .limit(limit);
      return res.status(200).json(recentActivities);
    }

    // GET /api/crawler/status - Crawler status (simplified for serverless)
    if (path === "/crawler/status" && req.method === "GET") {
      return res.status(200).json({
        isRunning: true,
        crawlCount: 0,
        message: "Crawler runs on server instance, not serverless",
      });
    }

    // 404 for unknown routes
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
