import "dotenv/config";
import { db } from "../server/db";
import { nodes } from "../shared/schema";

// GET /api/nodes - List all nodes
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
    const allNodes = await db.select().from(nodes);
    const filtered = allNodes.filter(
      (node) =>
        !node.ip.startsWith("127.") &&
        !node.ip.startsWith("localhost") &&
        !node.pubkey.toLowerCase().includes("test")
    );
    return res.status(200).json(filtered);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
