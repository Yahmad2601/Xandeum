import { storage } from "./storage";
import type { InsertNode, InsertNodeSnapshot } from "@shared/schema";

/**
 * Crawler Service - The "Time Machine" Engine
 * 
 * This service runs every 30 seconds to:
 * 1. Fetch current node data from Xandeum pRPC
 * 2. Update the nodes table with latest status
 * 3. Record a snapshot in node_snapshots (heartbeat)
 * 4. Periodically update uptime scores and rankings
 */

export class CrawlerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private crawlCount = 0;

  /**
   * Start the crawler with 30-second intervals
   */
  start() {
    if (this.isRunning) {
      console.log("Crawler is already running");
      return;
    }

    console.log("🚀 Starting crawler service (30s intervals)...");
    this.isRunning = true;

    // Run immediately on start
    this.crawl();

    // Then run every 30 seconds
    this.intervalId = setInterval(() => {
      this.crawl();
    }, 30000);
  }

  /**
   * Stop the crawler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 Crawler service stopped");
  }

  /**
   * Manual trigger for immediate crawl
   */
  async triggerCrawl(): Promise<{ message: string; count: number }> {
    return await this.crawl();
  }

  /**
   * Main crawl logic
   */
  private async crawl(): Promise<{ message: string; count: number }> {
    try {
      this.crawlCount++;
      console.log(`🔄 Crawl #${this.crawlCount} started at ${new Date().toISOString()}`);

      // TODO: Replace with actual pRPC call to Xandeum network
      // For now, we'll use mock data, but structure it for easy replacement
      const nodesData = await this.fetchNodesFromPRPC();

      // Update nodes table (current state)
      await storage.updateNodes(nodesData);

      // Record snapshots (historical data)
      const snapshots: InsertNodeSnapshot[] = nodesData.map(node => ({
        pubkey: node.pubkey,
        status: node.status,
        ip: node.ip,
        version: node.version,
        totalStorage: node.totalStorage,
        stoincEarnings: node.stoincEarnings,
      }));
      await storage.recordSnapshots(snapshots);

      // Every 10 crawls (~5 minutes), update uptime scores and rankings
      if (this.crawlCount % 10 === 0) {
        console.log("📊 Updating uptime scores and rankings...");
        await storage.updateUptimeScores();
      }

      console.log(`✅ Crawl #${this.crawlCount} completed: ${nodesData.length} nodes processed`);

      return {
        message: `Crawl completed successfully`,
        count: nodesData.length,
      };
    } catch (error) {
      console.error("❌ Crawl failed:", error);
      throw error;
    }
  }

  /**
   * Fetch nodes from Xandeum pRPC
   * 
   * TODO: Replace this with actual pRPC integration
   * Example pRPC endpoints to use:
   * - getClusterNodes() - Get all nodes in the network
   * - getNodeInfo(pubkey) - Get detailed info about a specific node
   * - getNodeStats(pubkey) - Get performance stats
   */
  private async fetchNodesFromPRPC(): Promise<InsertNode[]> {
    // MOCK DATA - Replace with actual pRPC calls
    // 
    // Example implementation:
    // const response = await fetch('https://xandeum-rpc-endpoint/getClusterNodes');
    // const data = await response.json();
    // return data.nodes.map(transformToInsertNode);

    const countries = ["US", "DE", "GB", "JP", "SG", "CA", "AU", "FR"];
    const versions = ["1.0.0", "1.0.1", "1.1.0-beta"];
    const networkCapacity = 200000; // 200 PB total

    // Get existing nodes to maintain their pubkeys
    const existingNodes = await storage.getNodes();
    const nodeCount = Math.max(50, existingNodes.length);

    return Array.from({ length: nodeCount }).map((_, i) => {
      // Use existing pubkey if available, otherwise generate new
      const pubkey = existingNodes[i]?.pubkey || 
                     `pubkey-${Math.random().toString(36).substring(7)}-${i}`;
      
      // Simulate realistic status changes (90% stay same, 10% change)
      const existingNode = existingNodes.find(n => n.pubkey === pubkey);
      let isOffline: boolean;
      if (existingNode) {
        // 90% chance to keep same status, 10% chance to change
        isOffline = Math.random() > 0.9 
          ? existingNode.status === "offline" 
          : existingNode.status !== "offline";
      } else {
        // New node: 10% chance to be offline
        isOffline = Math.random() > 0.9;
      }

      // Generate 24h history (for backward compatibility with existing components)
      const history = Array.from({ length: 24 }).map(() => 
        isOffline ? 0 : 95 + Math.random() * 5
      );

      // Generate 7-day weekly history
      const weeklyHistory = Array.from({ length: 7 }).map(() =>
        isOffline ? 0 : 97 + Math.random() * 3
      );

      return {
        pubkey,
        ip: existingNode?.ip || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        version: versions[Math.floor(Math.random() * versions.length)],
        country: existingNode?.country || countries[Math.floor(Math.random() * countries.length)],
        status: isOffline ? "offline" : "active",
        totalStorage: Math.floor(Math.random() * 150000),
        stoincEarnings: Math.random() * 500,
        networkCapacity,
        stoincGenerated: (existingNode?.stoincGenerated || 0) + Math.random() * 10,
        uptimeHistory: history,
        weeklyUptimeHistory: weeklyHistory,
        lastUpdated: new Date().toISOString(),
      } as InsertNode;
    });
  }

  /**
   * Get crawler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      crawlCount: this.crawlCount,
      uptime: this.isRunning ? "Active" : "Stopped",
    };
  }
}

// Singleton instance
export const crawler = new CrawlerService();
