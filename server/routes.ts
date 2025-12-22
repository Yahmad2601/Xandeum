import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { crawler } from "./crawler";
import { api } from "@shared/routes";
import { z } from "zod";
import { InsertNode } from "@shared/schema";

// Mock Generator Logic
function generateMockNodes(count: number): InsertNode[] {
  const countries = ["US", "DE", "GB", "JP", "SG", "CA", "AU", "FR"];
  const versions = ["1.0.0", "1.0.1", "1.1.0-beta"];
  const statuses = ["active", "active", "active", "offline"] as const;
  const networkCapacity = 200000; // 200 PB total

  return Array.from({ length: count }).map((_, i) => {
    const isOffline = Math.random() > 0.9;
    
    // Generate 24h history (24 points)
    // Active nodes have high uptime (95-100), offline have 0 or low
    const history = Array.from({ length: 24 }).map(() => 
      isOffline ? 0 : 95 + Math.random() * 5
    );

    // Generate 7-day weekly history (7 points)
    const weeklyHistory = Array.from({ length: 7 }).map(() =>
      isOffline ? 0 : 97 + Math.random() * 3
    );

    return {
      pubkey: `pubkey-${Math.random().toString(36).substring(7)}-${i}`,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      version: versions[Math.floor(Math.random() * versions.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      status: isOffline ? "offline" : "active",
      totalStorage: Math.floor(Math.random() * 150000), // Storage used (KB or similar)
      stoincEarnings: Math.random() * 500,
      networkCapacity: networkCapacity, // Distributed capacity
      stoincGenerated: Math.random() * 25000, // Cumulative STOINC rewards
      uptimeHistory: history,
      weeklyUptimeHistory: weeklyHistory,
      lastUpdated: new Date().toISOString()
    };
  });
}

async function seedDatabase() {
  const count = await storage.countNodes();
  if (count === 0) {
    console.log("Seeding database with 50 mock nodes...");
    const mockNodes = generateMockNodes(50);
    await storage.updateNodes(mockNodes);
    console.log("Seeding complete.");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initial seed
  await seedDatabase();

  // Start the crawler service
  crawler.start();

  // ===== NODE ENDPOINTS =====
  app.get(api.nodes.list.path, async (req, res) => {
    const nodes = await storage.getNodes();
    res.json(nodes);
  });

  app.get(api.nodes.get.path, async (req, res) => {
    const node = await storage.getNode(req.params.pubkey);
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }
    res.json(node);
  });

  app.post(api.nodes.create.path, async (req, res) => {
    try {
      const input = api.nodes.create.input.parse(req.body);
      const node = await storage.createNode(input);
      res.status(201).json(node);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // ===== HISTORICAL DATA ENDPOINTS =====
  
  // Get uptime statistics for a node
  app.get(api.nodes.uptimeStats.path, async (req, res) => {
    const { pubkey } = req.params;
    const hours = parseInt(req.query.hours as string) || 168; // Default 7 days
    
    const stats = await storage.calculateUptimeStats(pubkey, hours);
    if (!stats) {
      return res.status(404).json({ message: 'No data found for this node' });
    }
    
    res.json(stats);
  });

  // Get trend data for charts
  app.get(api.nodes.trends.path, async (req, res) => {
    const { pubkey } = req.params;
    
    const trends = await storage.calculateNodeTrends(pubkey);
    if (!trends) {
      return res.status(404).json({ message: 'No trend data found for this node' });
    }
    
    res.json(trends);
  });

  // Get recent snapshots (heartbeat data)
  app.get(api.nodes.snapshots.path, async (req, res) => {
    const { pubkey } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const snapshots = await storage.getRecentSnapshots(pubkey, limit);
    res.json(snapshots);
  });

  // ===== CRAWLER ENDPOINTS =====
  
  // Manual crawler trigger
  app.post(api.nodes.refresh.path, async (req, res) => {
    try {
      const result = await crawler.triggerCrawl();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: 'Crawler failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Crawler status
  app.get(api.crawler.status.path, async (req, res) => {
    const status = crawler.getStatus();
    res.json(status);
  });

  return httpServer;
}

