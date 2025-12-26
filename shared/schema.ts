import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  pubkey: text("pubkey").notNull().unique(),
  ip: text("ip").notNull(),
  version: text("version").notNull(),
  country: text("country").notNull(),
  city: text("city").default("Unknown"), // City where node is located
  status: text("status", { enum: ["online", "offline"] }).notNull(),
  isPublic: boolean("is_public").notNull().default(true), // Whether node is publicly accessible
  uptime: integer("uptime").notNull().default(0), // Process uptime in seconds (how long node has been running)
  totalStorage: doublePrecision("total_storage").notNull(), // Storage committed (capacity) in GB
  storageUsed: doublePrecision("storage_used").notNull().default(0), // Actual storage used in MB
  stoincEarnings: doublePrecision("stoinc_earnings").notNull(),
  networkCapacity: doublePrecision("network_capacity").notNull().default(200000), // Default 200 PB
  stoincGenerated: doublePrecision("stoinc_generated").notNull().default(0), // Cumulative STOINC rewards
  uptimeHistory: jsonb("uptime_history").$type<number[]>().notNull(),
  weeklyUptimeHistory: jsonb("weekly_uptime_history").$type<number[]>().notNull().default([]),
  lastUpdated: text("last_updated").notNull(),
  // Calculated fields (updated by aggregation)
  uptimeScore: doublePrecision("uptime_score").default(100), // % uptime over last 7 days
  reliabilityRank: integer("reliability_rank"), // Ranking compared to other nodes
});

// Heartbeat snapshots - Records node status every 30 seconds
export const nodeSnapshots = pgTable("node_snapshots", {
  id: serial("id").primaryKey(),
  pubkey: text("pubkey").notNull(), // References nodes.pubkey
  status: text("status", { enum: ["online", "offline"] }).notNull(),
  ip: text("ip"),
  version: text("version"),
  totalStorage: doublePrecision("total_storage"),
  storageUsed: doublePrecision("storage_used"),
  stoincEarnings: doublePrecision("stoinc_earnings"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pubkeyIdx: index("snapshots_pubkey_idx").on(table.pubkey),
  timestampIdx: index("snapshots_timestamp_idx").on(table.timestamp),
}));

// Activity events - Records key network events for the activity feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["earnings", "status-change", "upgrade", "storage-commit", "new-node"] }).notNull(),
  nodeId: text("node_id"), // Optional - some events like storage-commit are network-wide
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional data (e.g., earnings amount, version numbers)
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  timestampIdx: index("activities_timestamp_idx").on(table.timestamp),
  typeIdx: index("activities_type_idx").on(table.type),
}));

export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true });
export const insertSnapshotSchema = createInsertSchema(nodeSnapshots).omit({ id: true, timestamp: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type NodeSnapshot = typeof nodeSnapshots.$inferSelect;
export type InsertNodeSnapshot = z.infer<typeof insertSnapshotSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Request types
export type CreateNodeRequest = InsertNode;
export type UpdateNodeRequest = Partial<InsertNode>;

// Response types
export type NodeResponse = Node;
export type NodesListResponse = Node[];

// Historical data types
export type UptimeStats = {
  pubkey: string;
  uptimePercentage: number;
  totalChecks: number;
  activeChecks: number;
  offlineChecks: number;
  firstSeen: Date;
  lastSeen: Date;
};

export type NodeTrend = {
  pubkey: string;
  hourlyUptime: number[]; // 24 hours
  dailyUptime: number[]; // 7 days
  weeklyUptime: number[]; // 4 weeks
};
