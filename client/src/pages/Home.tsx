import React, { useState } from "react";
import { Link } from "wouter";
import { useNodes, useRefreshNodes, useCrawlerStatus } from "@/hooks/use-nodes";
import { NetworkMap } from "@/components/NetworkMap";
import { NodeList } from "@/components/NodeList";
import { Sparkline } from "@/components/Sparkline";
import { StatCard } from "@/components/StatCard";
import { CommandPalette } from "@/components/CommandPalette";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TopRegions } from "@/components/TopRegions";
import { NetworkHealth } from "@/components/NetworkHealth";
import { UptimeChart } from "@/components/UptimeChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Database, 
  Globe, 
  Activity, 
  Radio,
  Eye
} from "lucide-react";
import type { Node } from "@shared/schema";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateWeeklyChartData(nodes: Node[]) {
  const weeklyData = Array.from({ length: 7 }).map(() => 0);
  const counts = Array.from({ length: 7 }).map(() => 0);
  
  // Only count online nodes for realistic uptime calculation
  const activeNodes = nodes.filter(n => n.status === "online");
  
  activeNodes.forEach((node) => {
    const history = node.weeklyUptimeHistory || [];
    history.forEach((uptime, idx) => {
      if (idx < 7) {
        weeklyData[idx] += uptime;
        counts[idx]++;
      }
    });
  });

  return dayLabels.map((day, idx) => ({
    day,
    // Calculate average uptime, fallback to 0 if no data
    uptime: counts[idx] > 0 ? weeklyData[idx] / counts[idx] : 0,
  }));
}

export default function Home() {
  const { data: nodes = [], isLoading, isError } = useNodes();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshNodes();
  const { data: crawlerStatus } = useCrawlerStatus();
  const [searchOpen, setSearchOpen] = useState(false);

  // Derived stats
  // Note: totalStorage is in GB, storageUsed is in MB (converted in crawler)
  const totalStorageCommittedGB = nodes.reduce((acc, node) => acc + node.totalStorage, 0);
  const totalStorageUsedGB = nodes.reduce((acc, node) => acc + (node.storageUsed || 0) / 1024, 0); // Convert MB to GB
  const publicNodes = nodes.filter(n => n.isPublic === true).length;
  const privateNodes = nodes.filter(n => n.isPublic === false).length;
  const onlineNodes = nodes.filter(n => n.status === "online").length;
  const totalNodes = nodes.length;
  const totalStoincGenerated = nodes.reduce((acc, node) => acc + node.stoincGenerated, 0);
  const uniqueCountries = new Set(nodes.map(n => n.country)).size;
  // Count unique cities (format: "CountryCode-CityName" to handle same city names in different countries)
  const uniqueCities = new Set(
    nodes
      .filter(n => n.city) // Include all cities, even Unknown (it will update as GeoIP loads)
      .map(n => `${n.country}-${n.city}`)
  ).size;

  // Helper function to format storage with appropriate units
  const formatStorage = (gb: number) => {
    if (gb < 1024) {
      return `${gb.toFixed(2)} GB`;
    } else if (gb < 1024 * 1024) {
      return `${(gb / 1024).toFixed(2)} TB`;
    } else {
      return `${(gb / 1024 / 1024).toFixed(2)} PB`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Connecting to Xandeum Network...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-destructive">Network Connection Failed</h2>
          <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} nodes={nodes} />

      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              Xandeum<span className="text-primary">Scan</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => document.getElementById('network-map')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Network Map
            </button>
            <button 
              onClick={() => document.getElementById('uptime-trend')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Uptime Trend
            </button>
            <button 
              onClick={() => document.getElementById('network-nodes')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Network Nodes
            </button>
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Crawler Status Badge */}
            {crawlerStatus && (
              <Badge 
                variant="outline" 
                className="hidden sm:flex items-center gap-2 bg-card border-border text-xs"
              >
                <Radio className={`w-3 h-3 ${crawlerStatus.isRunning ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
                <span className="text-muted-foreground">
                  Crawler: <span className="text-foreground font-medium">{crawlerStatus.isRunning ? 'Active' : 'Stopped'}</span>
                  {crawlerStatus.isRunning && (
                    <span className="ml-1">• {crawlerStatus.crawlCount} crawls</span>
                  )}
                </span>
              </Badge>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Top Section: Stats & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats Grid (2/3 width) */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              <StatCard 
                title="Node Visibility" 
                value={`${publicNodes} / ${privateNodes}`} 
                trend={`${publicNodes} public, ${privateNodes} private`}
                trendUp={true}
                icon={<Eye className="w-8 h-8" />}
                color="purple"
              />
              <StatCard 
                title="Storage Committed" 
                value={formatStorage(totalStorageCommittedGB)} 
                trend={`${formatStorage(totalStorageUsedGB)} used`}
                trendUp={true}
                icon={<Database className="w-8 h-8" />}
                color="blue"
              />
              <StatCard 
                title="Total Nodes" 
                value={totalNodes} 
                trend="Unique nodes"
                trendUp={true}
                icon={<Server className="w-8 h-8" />}
                color="teal"
              />
              <StatCard 
                title="Online Nodes" 
                value={onlineNodes} 
                trend={`${totalNodes - onlineNodes} offline`}
                trendUp={false}
                icon={<Radio className="w-8 h-8" />}
                color="green"
              />
              <StatCard 
                title="Total STOINC Generated" 
                value={`$${totalStoincGenerated.toLocaleString()}`}
                trend="Network Rewards Distributed"
                trendUp={true}
                icon={<Activity className="w-8 h-8" />}
                color="orange"
              />
              <StatCard 
                title="pNode Distribution" 
                value={`${uniqueCountries} Countries`} 
                trend={`${uniqueCities} Cities`}
                icon={<Globe className="w-8 h-8" />}
                color="purple"
              />
            </div>
          </div>

          {/* Right Column: Network Health (1/3 width) */}
          <div className="lg:col-span-1 h-full">
            <NetworkHealth nodes={nodes} />
          </div>
        </div>

        {/* Map & Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="network-map">
          {/* Global Network Map (3/4 width) */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-semibold">Global Network Map</h2>
            <div className="relative w-full">
              <NetworkMap nodes={nodes} />
              {/* Floating Top Regions Overlay - Moved to Right */}
              <div className="absolute bottom-4 right-4 w-72 z-10 hidden md:block">
                <div className="border border-border/50 bg-card/90 backdrop-blur-md p-4 shadow-xl">
                  <TopRegions nodes={nodes} />
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity (1/4 width) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">Live Activity</h2>
            <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm p-6 h-[500px] overflow-hidden">
              <ActivityFeed />
            </div>
          </div>
        </div>

        {/* 7-Day Uptime Chart (Full Width) */}
        <section className="space-y-4" id="uptime-trend">
          <h2 className="text-lg font-semibold">7-Day Uptime Trend</h2>
          <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm p-6">
            <UptimeChart data={generateWeeklyChartData(nodes)} />
          </div>
        </section>

        {/* Nodes List */}
        <section id="network-nodes">
          <NodeList nodes={nodes} onRefresh={() => refresh()} isRefreshing={isRefreshing} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-lg mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Activity className="w-3 h-3 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Xandeum</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://xandeum.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Website
              </a>
              <a href="https://docs.xandeum.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="https://discord.gg/xandeum" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Discord
              </a>
            </div>

            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Xandeum Labs. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
