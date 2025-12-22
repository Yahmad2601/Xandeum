import { db } from "./db";
import { 
  nodes, 
  nodeSnapshots,
  type Node, 
  type InsertNode, 
  type UpdateNodeRequest,
  type NodeSnapshot,
  type InsertNodeSnapshot,
  type UptimeStats,
  type NodeTrend
} from "@shared/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Node operations
  getNodes(): Promise<Node[]>;
  getNode(pubkey: string): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(pubkey: string, updates: UpdateNodeRequest): Promise<Node | undefined>;
  updateNodes(nodesData: InsertNode[]): Promise<void>;
  countNodes(): Promise<number>;
  
  // Snapshot operations (heartbeat data)
  recordSnapshot(snapshot: InsertNodeSnapshot): Promise<NodeSnapshot>;
  recordSnapshots(snapshots: InsertNodeSnapshot[]): Promise<void>;
  getRecentSnapshots(pubkey: string, limit?: number): Promise<NodeSnapshot[]>;
  getSnapshotsInRange(pubkey: string, startDate: Date, endDate: Date): Promise<NodeSnapshot[]>;
  
  // Analytics operations
  calculateUptimeStats(pubkey: string, hours: number): Promise<UptimeStats | null>;
  calculateNodeTrends(pubkey: string): Promise<NodeTrend | null>;
  updateUptimeScores(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ===== NODE OPERATIONS =====
  async getNodes(): Promise<Node[]> {
    return await db.select().from(nodes);
  }

  async getNode(pubkey: string): Promise<Node | undefined> {
    const [node] = await db.select().from(nodes).where(eq(nodes.pubkey, pubkey));
    return node;
  }

  async createNode(node: InsertNode): Promise<Node> {
    const [newNode] = await db.insert(nodes).values(node as any).returning();
    return newNode;
  }

  async updateNode(pubkey: string, updates: UpdateNodeRequest): Promise<Node | undefined> {
    const [updated] = await db.update(nodes)
      .set(updates as any)
      .where(eq(nodes.pubkey, pubkey))
      .returning();
    return updated;
  }

  async updateNodes(nodesData: InsertNode[]): Promise<void> {
    // Basic bulk upsert simulation for the crawler
    for (const node of nodesData) {
      const existing = await this.getNode(node.pubkey);
      if (existing) {
        await this.updateNode(node.pubkey, node);
      } else {
        await this.createNode(node);
      }
    }
  }

  async countNodes(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(nodes);
    return Number(result.count);
  }

  // ===== SNAPSHOT OPERATIONS (HEARTBEAT DATA) =====
  async recordSnapshot(snapshot: InsertNodeSnapshot): Promise<NodeSnapshot> {
    const [newSnapshot] = await db.insert(nodeSnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  async recordSnapshots(snapshots: InsertNodeSnapshot[]): Promise<void> {
    if (snapshots.length === 0) return;
    await db.insert(nodeSnapshots).values(snapshots);
  }

  async getRecentSnapshots(pubkey: string, limit: number = 100): Promise<NodeSnapshot[]> {
    return await db
      .select()
      .from(nodeSnapshots)
      .where(eq(nodeSnapshots.pubkey, pubkey))
      .orderBy(desc(nodeSnapshots.timestamp))
      .limit(limit);
  }

  async getSnapshotsInRange(
    pubkey: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<NodeSnapshot[]> {
    return await db
      .select()
      .from(nodeSnapshots)
      .where(
        and(
          eq(nodeSnapshots.pubkey, pubkey),
          gte(nodeSnapshots.timestamp, startDate),
          lte(nodeSnapshots.timestamp, endDate)
        )
      )
      .orderBy(nodeSnapshots.timestamp);
  }

  // ===== ANALYTICS OPERATIONS =====
  async calculateUptimeStats(pubkey: string, hours: number = 168): Promise<UptimeStats | null> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const snapshots = await this.getSnapshotsInRange(pubkey, startDate, new Date());
    
    if (snapshots.length === 0) return null;

    const totalChecks = snapshots.length;
    const activeChecks = snapshots.filter(s => s.status === 'active').length;
    const offlineChecks = totalChecks - activeChecks;
    const uptimePercentage = (activeChecks / totalChecks) * 100;

    return {
      pubkey,
      uptimePercentage,
      totalChecks,
      activeChecks,
      offlineChecks,
      firstSeen: snapshots[0].timestamp,
      lastSeen: snapshots[snapshots.length - 1].timestamp,
    };
  }

  async calculateNodeTrends(pubkey: string): Promise<NodeTrend | null> {
    const now = new Date();
    
    // Last 24 hours (hourly buckets)
    const hourlyUptime: number[] = [];
    for (let i = 23; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourSnapshots = await this.getSnapshotsInRange(pubkey, start, end);
      const uptime = hourSnapshots.length > 0
        ? (hourSnapshots.filter(s => s.status === 'active').length / hourSnapshots.length) * 100
        : 0;
      hourlyUptime.push(Math.round(uptime * 10) / 10);
    }

    // Last 7 days (daily buckets)
    const dailyUptime: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const daySnapshots = await this.getSnapshotsInRange(pubkey, start, end);
      const uptime = daySnapshots.length > 0
        ? (daySnapshots.filter(s => s.status === 'active').length / daySnapshots.length) * 100
        : 0;
      dailyUptime.push(Math.round(uptime * 10) / 10);
    }

    // Last 4 weeks (weekly buckets)
    const weeklyUptime: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekSnapshots = await this.getSnapshotsInRange(pubkey, start, end);
      const uptime = weekSnapshots.length > 0
        ? (weekSnapshots.filter(s => s.status === 'active').length / weekSnapshots.length) * 100
        : 0;
      weeklyUptime.push(Math.round(uptime * 10) / 10);
    }

    return {
      pubkey,
      hourlyUptime,
      dailyUptime,
      weeklyUptime,
    };
  }

  async updateUptimeScores(): Promise<void> {
    // Calculate 7-day uptime score for all nodes and update their rank
    const allNodes = await this.getNodes();
    const scores: { pubkey: string; score: number }[] = [];

    for (const node of allNodes) {
      const stats = await this.calculateUptimeStats(node.pubkey, 168); // 7 days
      const score = stats?.uptimePercentage ?? 100;
      scores.push({ pubkey: node.pubkey, score });
      
      // Update the node's uptime score
      await this.updateNode(node.pubkey, { uptimeScore: score });
    }

    // Sort by score and assign ranks
    scores.sort((a, b) => b.score - a.score);
    for (let i = 0; i < scores.length; i++) {
      await this.updateNode(scores[i].pubkey, { reliabilityRank: i + 1 });
    }
  }
}

export const storage = new DatabaseStorage();
