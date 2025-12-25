import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { crawler } from "./crawler";
import { api } from "@shared/routes";
import { z } from "zod";
import { InsertNode } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // No mock data seeding - ready for real pRPC data

  // Start the crawler service
  crawler.start();

  // ===== NODE ENDPOINTS =====
  app.get(api.nodes.list.path, async (req, res) => {
    const allNodes = await storage.getNodes();
    // Filter out test nodes (localhost, test pubkeys)
    const nodes = allNodes.filter(node => 
      !node.ip.startsWith('127.') && 
      !node.ip.startsWith('localhost') && 
      !node.pubkey.toLowerCase().includes('test')
    );
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

  // ===== ACTIVITY ENDPOINTS =====
  
  // Get recent activities for the live feed
  app.get('/api/activities', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const activities = await storage.getRecentActivities(limit);
    res.json(activities);
  });

  return httpServer;
}

