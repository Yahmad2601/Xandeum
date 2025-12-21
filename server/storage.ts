import { db } from "./db";
import { nodes, type Node, type InsertNode, type UpdateNodeRequest } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getNodes(): Promise<Node[]>;
  getNode(pubkey: string): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(pubkey: string, updates: UpdateNodeRequest): Promise<Node | undefined>;
  updateNodes(nodesData: InsertNode[]): Promise<void>;
  countNodes(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getNodes(): Promise<Node[]> {
    return await db.select().from(nodes);
  }

  async getNode(pubkey: string): Promise<Node | undefined> {
    const [node] = await db.select().from(nodes).where(eq(nodes.pubkey, pubkey));
    return node;
  }

  async createNode(node: InsertNode): Promise<Node> {
    const [newNode] = await db.insert(nodes).values(node).returning();
    return newNode;
  }

  async updateNode(pubkey: string, updates: UpdateNodeRequest): Promise<Node | undefined> {
    const [updated] = await db.update(nodes)
      .set(updates)
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
}

export const storage = new DatabaseStorage();
