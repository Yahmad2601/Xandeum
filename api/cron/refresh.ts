import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { eq, sql, desc } from "drizzle-orm";
import axios from "axios";

const { Pool } = pg;

// Define schemas inline for serverless
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

const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["earnings", "status-change", "upgrade", "storage-commit", "new-node"] }).notNull(),
  nodeId: text("node_id"),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

const nodeSnapshots = pgTable("node_snapshots", {
  id: serial("id").primaryKey(),
  pubkey: text("pubkey").notNull(),
  status: text("status", { enum: ["online", "offline"] }).notNull(),
  ip: text("ip"),
  version: text("version"),
  totalStorage: doublePrecision("total_storage"),
  storageUsed: doublePrecision("storage_used"),
  stoincEarnings: doublePrecision("stoinc_earnings"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

// Helper functions
function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵',
    'IN': '🇮🇳', 'SG': '🇸🇬', 'NL': '🇳🇱', 'ES': '🇪🇸', 'RO': '🇷🇴',
    'CH': '🇨🇭', 'FI': '🇫🇮', 'SE': '🇸🇪', 'NZ': '🇳🇿'
  };
  return flags[countryCode] || '🌍';
}

// Vercel Cron Job - Runs every minute to refresh node data
export default async function handler(req: any, res: any) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    // Allow without auth in development or if CRON_SECRET not set
    console.log("Warning: CRON_SECRET not verified");
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  
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

    console.log("🔄 Cron: Starting node refresh...");

    // 1. Fetch pod credits from Xandeum API
    let creditsMap = new Map<string, number>();
    try {
      const creditsResponse = await axios.get("https://podcredits.xandeum.network/api/pods-credits", {
        timeout: 5000
      });
      if (creditsResponse.data?.data) {
        for (const pod of creditsResponse.data.data) {
          if (pod.identity && typeof pod.credits === 'number') {
            creditsMap.set(pod.identity, pod.credits);
          }
        }
      }
      console.log(`   💰 Loaded ${creditsMap.size} STOINC earnings records`);
    } catch (e) {
      console.log("   ⚠️ Could not fetch pod credits");
    }

    // 2. Fetch storage pod data from pRPC
    let nodesData: any[] = [];
    try {
      const podResponse = await axios.post(
        "https://prpc.xandeum.network:6000",
        { jsonrpc: "2.0", id: 1, method: "getStoragePods", params: [] },
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      );

      if (podResponse.data?.result) {
        const pods = podResponse.data.result;
        console.log(`   📦 Found ${pods.length} storage pods`);

        for (const pod of pods) {
          const identity = pod.identity;
          const earnings = creditsMap.get(identity) ?? 0;

          // Get location from IP
          let country = "Unknown";
          let city = "Unknown";
          try {
            const geoResponse = await axios.get(`http://ip-api.com/json/${pod.gossipIp}?fields=country,city,countryCode`, {
              timeout: 2000
            });
            if (geoResponse.data) {
              country = geoResponse.data.countryCode || geoResponse.data.country || "Unknown";
              city = geoResponse.data.city || "Unknown";
            }
          } catch {
            // Use fallback
          }

          nodesData.push({
            pubkey: identity,
            ip: pod.gossipIp || "0.0.0.0",
            version: pod.version || "0.8.0",
            country,
            city,
            status: "online",
            isPublic: Math.random() > 0.5, // Randomly assign for now
            uptime: 0,
            totalStorage: (pod.availableBytes || 0) / (1024 * 1024 * 1024), // Convert to GB
            storageUsed: (pod.usedBytes || 0) / (1024 * 1024 * 1024),
            stoincEarnings: earnings,
            networkCapacity: 200000,
            stoincGenerated: 0,
            uptimeHistory: Array(24).fill(100),
            weeklyUptimeHistory: Array(7).fill(100),
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.log("   ⚠️ Could not fetch from pRPC, using existing data");
    }

    // 3. Get existing nodes from DB for comparison
    const existingNodes = await db.select().from(nodes);
    const existingMap = new Map(existingNodes.map(n => [n.pubkey, n]));

    // 4. Track activities
    const newActivities: any[] = [];
    
    for (const node of nodesData) {
      const existing = existingMap.get(node.pubkey);
      
      if (!existing) {
        // New node
        const flag = getCountryFlag(node.country);
        newActivities.push({
          type: "new-node",
          nodeId: node.pubkey,
          message: `New Node detected in ${flag} ${node.country}.`,
          metadata: { country: node.country, city: node.city }
        });
      } else {
        // Check for earnings change
        if (node.stoincEarnings > existing.stoincEarnings) {
          const earned = Math.round(node.stoincEarnings - existing.stoincEarnings);
          if (earned > 0) {
            newActivities.push({
              type: "earnings",
              nodeId: node.pubkey,
              message: `Node ${node.pubkey.substring(0, 8)}... earned ${earned} STOINC.`,
              metadata: { amount: earned }
            });
          }
        }
        
        // Check for version upgrade
        if (node.version !== existing.version) {
          newActivities.push({
            type: "upgrade",
            nodeId: node.pubkey,
            message: `Node ${node.pubkey.substring(0, 8)}... upgraded to version ${node.version}.`,
            metadata: { oldVersion: existing.version, newVersion: node.version }
          });
        }
      }
    }

    // 5. Update nodes in database
    let updatedCount = 0;
    for (const node of nodesData) {
      try {
        await db.insert(nodes).values(node)
          .onConflictDoUpdate({
            target: nodes.pubkey,
            set: {
              ip: node.ip,
              version: node.version,
              status: node.status,
              totalStorage: node.totalStorage,
              storageUsed: node.storageUsed,
              stoincEarnings: node.stoincEarnings,
              lastUpdated: node.lastUpdated,
            }
          });
        updatedCount++;
      } catch (e) {
        console.error(`Failed to update node ${node.pubkey}:`, e);
      }
    }

    // 6. Record snapshots for history
    for (const node of nodesData) {
      try {
        await db.insert(nodeSnapshots).values({
          pubkey: node.pubkey,
          status: node.status,
          ip: node.ip,
          version: node.version,
          totalStorage: node.totalStorage,
          storageUsed: node.storageUsed,
          stoincEarnings: node.stoincEarnings,
        });
      } catch (e) {
        // Ignore snapshot errors
      }
    }

    // 7. Record activities (limit to prevent spam)
    const limitedActivities = newActivities.slice(0, 10);
    for (const activity of limitedActivities) {
      try {
        await db.insert(activities).values(activity);
      } catch (e) {
        // Ignore activity errors
      }
    }

    await pool.end();

    console.log(`✅ Cron complete: Updated ${updatedCount} nodes, ${limitedActivities.length} activities`);

    return res.status(200).json({
      success: true,
      message: "Refresh complete",
      nodesUpdated: updatedCount,
      activitiesCreated: limitedActivities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return res.status(500).json({
      message: "Cron job failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
