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
   * Integrate with real Xandeum pRPC to fetch node data
   * Example pRPC endpoints to use:
   * - getClusterNodes() - Get all nodes in the network
   * - getNodeInfo(pubkey) - Get detailed info about a specific node
   * - getNodeStats(pubkey) - Get performance stats
   */
  private async fetchNodesFromPRPC(): Promise<InsertNode[]> {
    // TODO: Implement real pRPC integration here
    // Example:
    // const response = await fetch('http://your-xandeum-rpc:6000/rpc', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     jsonrpc: '2.0',
    //     method: 'get-pods-with-stats',
    //     id: 1
    //   })
    // });
    // const data = await response.json();
    // return data.result.map(transformToInsertNode);

    console.warn("⚠️  fetchNodesFromPRPC: Real pRPC integration not yet implemented. Returning empty array.");
    return [];
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
