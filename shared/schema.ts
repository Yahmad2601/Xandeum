import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  pubkey: text("pubkey").notNull().unique(),
  ip: text("ip").notNull(),
  version: text("version").notNull(),
  country: text("country").notNull(),
  status: text("status", { enum: ["active", "offline"] }).notNull(),
  totalStorage: doublePrecision("total_storage").notNull(),
  stoincEarnings: doublePrecision("stoinc_earnings").notNull(),
  networkCapacity: doublePrecision("network_capacity").notNull().default(200000), // Default 200 PB
  stoincGenerated: doublePrecision("stoinc_generated").notNull().default(0), // Cumulative STOINC rewards
  uptimeHistory: jsonb("uptime_history").$type<number[]>().notNull(),
  lastUpdated: text("last_updated").notNull(),
});

export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true });

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;

// Request types
export type CreateNodeRequest = InsertNode;
export type UpdateNodeRequest = Partial<InsertNode>;

// Response types
export type NodeResponse = Node;
export type NodesListResponse = Node[];
