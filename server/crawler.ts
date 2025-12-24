import { storage } from "./storage";
import type { InsertNode, InsertNodeSnapshot } from "@shared/schema";
import axios from "axios";

/**
 * Crawler Service - REAL NETWORK IMPLEMENTATION
 * Targets Xandeum pRPC on Port 6000
 */
export class CrawlerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private crawlCount = 0;

  start() {
    if (this.isRunning) return;
    console.log("🚀 Starting Real Xandeum Crawler (30s heartbeat)...");
    this.isRunning = true;
    this.crawl(); // Run immediately
    this.intervalId = setInterval(() => this.crawl(), 30000);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isRunning = false;
    console.log("🛑 Crawler stopped");
  }

  async triggerCrawl() {
    return await this.crawl();
  }

  private async crawl() {
    try {
      this.crawlCount++;
      console.log(`🔄 Crawl #${this.crawlCount}: Scanning Network...`);

      // 1. Fetch Real Data
      const nodesData = await this.fetchNodesFromPRPC();

      if (nodesData.length > 0) {
        // 2. Update Database (Only if we found nodes)
        await storage.updateNodes(nodesData);

        // 3. Record History (For the 7-Day Chart)
        const snapshots: InsertNodeSnapshot[] = nodesData.map(node => ({
          pubkey: node.pubkey,
          status: node.status,
          ip: node.ip,
          version: node.version,
          totalStorage: node.totalStorage,
          stoincEarnings: node.stoincEarnings,
        }));
        await storage.recordSnapshots(snapshots);
        
        console.log(`✅ Success: Updated ${nodesData.length} nodes.`);
      } else {
        console.log("⚠️ Scan finished but found 0 active nodes (Check IP/Port).");
      }

      // Update calculations (scores/ranks) periodically
      if (this.crawlCount % 10 === 0) await storage.updateUptimeScores();

      return { message: "Crawl complete", count: nodesData.length };
    } catch (error) {
      console.error("❌ Crawl Error:", error);
      throw error;
    }
  }

  /**
   * THE REAL SPY FUNCTION
   * Hits http://<IP>:6000/rpc with 'get-pods-with-stats'
   * This returns ALL pods that seed node sees in gossip network
   */
  private async fetchNodesFromPRPC(): Promise<InsertNode[]> {
    // A. THE SEED LIST (From Discord - Dec 2025)
    // Can be overridden via env: XANDEUM_SEED_IPS="ip1,ip2,ip3"
    const SEED_IPS = process.env.XANDEUM_SEED_IPS?.split(',').map(ip => ip.trim()) || [
      "173.212.203.145",
      "173.212.220.65",
      "161.97.97.41",
      "192.190.136.36",
      "192.190.136.37",
      "192.190.136.38",
      "192.190.136.28",
      "192.190.136.29",
      "207.244.255.1",
    ];

    const foundNodes: InsertNode[] = [];
    const seenPubkeys = new Set<string>(); // Prevent duplicates

    // B. SCAN LOOP - Try each seed until we get data
    for (const seedIp of SEED_IPS) {
      const url = `http://${seedIp}:6000/rpc`;
      
      try {
        console.log(`   👉 Querying ${seedIp}:6000 for network gossip...`);

        // THE CORRECT CALL: get-pods-with-stats
        // Returns ALL pods this seed sees in the network
        const response = await axios.post(url, {
          jsonrpc: "2.0",
          method: "get-pods-with-stats",
          id: 1
        }, { timeout: 5000 });

        // IMPORTANT: Xandeum wraps the array in result.pods
        // Response structure: { result: { pods: [...] } }
        const pods = response.data?.result?.pods;
        
        if (!Array.isArray(pods)) {
          console.log(`   ⚠️  ${seedIp} returned invalid format. Response:`, JSON.stringify(response.data).substring(0, 200));
          continue;
        }

        console.log(`   ✅ Found ${pods.length} pods in network`);

        // C. COLLECT ALL UNIQUE IPS FIRST
        const uniqueIps = new Set<string>();
        const podsByIp = new Map<string, any>();
        
        for (const pod of pods) {
          if (!pod.pubkey || seenPubkeys.has(pod.pubkey)) continue;
          const podIp = pod.address ? pod.address.split(':')[0] : seedIp;
          uniqueIps.add(podIp);
          podsByIp.set(pod.pubkey, { ...pod, ip: podIp });
        }

        // D. BATCH FETCH ALL GEOIP DATA
        const geoData = await this.getBatchGeoInfo(Array.from(uniqueIps));

        // E. PROCESS EACH POD WITH CACHED GEO DATA
        for (const pod of pods) {
          try {
            if (!pod.pubkey || seenPubkeys.has(pod.pubkey)) continue;
            seenPubkeys.add(pod.pubkey);

            // Extract IP from address (format: "192.168.1.1:9001")
            const podIp = pod.address ? pod.address.split(':')[0] : seedIp;
            
            // Get country and city from batch results
            const geoInfo = geoData.get(podIp) || { country: "Unknown", city: "Unknown" };
          
            // Calculate uptime percentage (uptime is in seconds)
            // Assume 30-day max = 2,592,000 seconds
            const uptimeSeconds = parseInt(pod.uptime || "0");
            const uptimePercent = Math.min((uptimeSeconds / 2592000) * 100, 100);
            
            foundNodes.push({
              pubkey: pod.pubkey,
              ip: podIp,
              version: pod.version || "Unknown",
              country: geoInfo.country,
              city: geoInfo.city,
            status: pod.is_public === false ? "active" : "active", // All online pods are active
            
            // Storage metrics (storage_committed is in bytes)
            totalStorage: Math.round((pod.storage_committed || 0) / 1024 / 1024 / 1024), // Convert to GB
            stoincEarnings: 0, // Not in base API - need credits endpoint
            networkCapacity: 200000,
            stoincGenerated: 0,
            
            // Initialize with current uptime
            uptimeHistory: Array(24).fill(uptimePercent),
            weeklyUptimeHistory: Array(7).fill(uptimePercent),
            lastUpdated: new Date().toISOString(),
            
            uptimeScore: Math.round(uptimePercent),
            reliabilityRank: null,
          } as InsertNode);
          } catch (podErr: any) {
            console.log(`   ⚠️  Skipping pod ${pod.pubkey?.substring(0, 8)}: ${podErr.message}`);
          }
        }

        // If we got data, we can stop querying other seeds
        if (foundNodes.length > 0) break;

      } catch (err: any) {
        console.log(`   ❌ ${seedIp} failed: ${err.message}`);
        // Try next seed
      }
    }

    if (foundNodes.length === 0) {
      console.log(`   ⚠️  No seeds responded. Network may be down.`);
    }

    return foundNodes;
  }

  private geoCache = new Map<string, { country: string; city: string }>();

  /**
   * Batch GeoIP lookup using ip-api.com batch endpoint
   * Processes up to 15 IPs per request (API limit)
   * Rate limit: 45 requests/min (1.4s delay between batches)
   */
  private async getBatchGeoInfo(ips: string[]): Promise<Map<string, { country: string; city: string }>> {
    const results = new Map<string, { country: string; city: string }>();
    
    // Filter out already cached IPs
    const uncachedIps = ips.filter(ip => !this.geoCache.has(ip));
    
    // Return cached results if all IPs are cached
    if (uncachedIps.length === 0) {
      ips.forEach(ip => {
        if (this.geoCache.has(ip)) {
          results.set(ip, this.geoCache.get(ip)!);
        }
      });
      return results;
    }

    // Split into batches of 15 (API limit)
    const batches: string[][] = [];
    for (let i = 0; i < uncachedIps.length; i += 15) {
      batches.push(uncachedIps.slice(i, i + 15));
    }

    console.log(`   🌍 Fetching GeoIP data for ${uncachedIps.length} IPs in ${batches.length} batches...`);

    // Process batches with rate limiting
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        // Add delay between batches (45 requests per minute = 1.33s, use 1.4s to be safe)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1400));
        }

        const response = await axios.post(
          'http://ip-api.com/batch?fields=status,query,countryCode,city',
          batch.map(ip => ({ query: ip })),
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        // Process batch results
        if (Array.isArray(response.data)) {
          response.data.forEach((item: any) => {
            const ip = item.query;
            if (item.status === "success") {
              const result = {
                country: item.countryCode || "Unknown",
                city: item.city || "Unknown",
              };
              this.geoCache.set(ip, result);
              results.set(ip, result);
            } else {
              const fallback = { country: "Unknown", city: "Unknown" };
              this.geoCache.set(ip, fallback);
              results.set(ip, fallback);
            }
          });
        }
      } catch (error) {
        console.error(`   ⚠️  Batch GeoIP lookup failed for batch ${i + 1}/${batches.length}`);
        // Set fallback for failed batch
        batch.forEach(ip => {
          const fallback = { country: "Unknown", city: "Unknown" };
          this.geoCache.set(ip, fallback);
          results.set(ip, fallback);
        });
      }
    }

    // Add cached results for all requested IPs
    ips.forEach(ip => {
      if (this.geoCache.has(ip) && !results.has(ip)) {
        results.set(ip, this.geoCache.get(ip)!);
      }
    });

    return results;
  }

  getStatus() {
    return { isRunning: this.isRunning, crawlCount: this.crawlCount };
  }
}

export const crawler = new CrawlerService();