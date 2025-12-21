import React, { useState } from "react";
import { Link } from "wouter";
import { useNodes, useRefreshNodes } from "@/hooks/use-nodes";
import { NetworkMap } from "@/components/NetworkMap";
import { Sparkline } from "@/components/Sparkline";
import { StatCard } from "@/components/StatCard";
import { CommandPalette } from "@/components/CommandPalette";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Database, 
  Globe, 
  Activity, 
  Search, 
  RefreshCw,
  MoreHorizontal
} from "lucide-react";

export default function Home() {
  const { data: nodes = [], isLoading, isError } = useNodes();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshNodes();
  const [searchOpen, setSearchOpen] = useState(false);

  // Derived stats
  const totalStorageUsed = nodes.reduce((acc, node) => acc + node.totalStorage, 0);
  const networkCapacity = nodes.length > 0 ? nodes[0].networkCapacity : 200000;
  const activePNodes = nodes.filter(n => n.status === "active").length;
  const totalStoincGenerated = nodes.reduce((acc, node) => acc + node.stoincGenerated, 0);
  const uniqueCountries = new Set(nodes.map(n => n.country)).size;
  const avgUptime = 99.8; // Mock value for now

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
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Xandeum<span className="text-primary">Scan</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex bg-card/50 border-white/10 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="mr-4">Search nodes...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-muted-foreground hover:text-white"
              onClick={() => refresh()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Network Capacity" 
            value={`${(networkCapacity / 1000).toFixed(1)} PB`} 
            trend="Theoretical" 
            trendUp={true}
            icon={<Database className="w-5 h-5" />}
          />
          <StatCard 
            title="Storage Used" 
            value={`${(totalStorageUsed / 1000).toFixed(2)} PB`} 
            trend="+8.2%" 
            trendUp={true}
            icon={<Database className="w-5 h-5" />}
          />
          <StatCard 
            title="Active pNodes" 
            value={activePNodes} 
            trend="+3" 
            trendUp={true}
            icon={<Server className="w-5 h-5" />}
          />
          <StatCard 
            title="STOINC Generated" 
            value={`$${(totalStoincGenerated / 1000).toFixed(1)}K`} 
            trend="+15.3%" 
            trendUp={true}
            icon={<Activity className="w-5 h-5" />}
          />
          <StatCard 
            title="pNode Distribution" 
            value={`${uniqueCountries} Countries`} 
            icon={<Globe className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Grid - Map/Table on left, Activity on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Map and Table */}
          <div className="lg:col-span-2 space-y-8">
            {/* Map Section */}
            <section className="glass-panel rounded-2xl p-1">
              <NetworkMap nodes={nodes} />
            </section>

            {/* Nodes Table */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Network Nodes</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Showing {nodes.length} nodes</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 overflow-hidden bg-card/30 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-6 py-4 font-medium text-muted-foreground">pNode</th>
                        <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                        <th className="px-6 py-4 font-medium text-muted-foreground">Location</th>
                        <th className="px-6 py-4 font-medium text-muted-foreground text-right">Storage</th>
                        <th className="px-6 py-4 font-medium text-muted-foreground text-right">Earnings</th>
                        <th className="px-6 py-4 font-medium text-muted-foreground text-center">24h Uptime</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {nodes.map((node) => (
                        <tr key={node.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <Link href={`/node/${node.pubkey}`} className="block">
                              <div className="flex flex-col cursor-pointer">
                                <span className="font-mono font-medium text-primary group-hover:underline decoration-primary/50 underline-offset-4 transition-all">
                                  {node.pubkey.substring(0, 8)}...{node.pubkey.substring(node.pubkey.length - 4)}
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5">v{node.version}</span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              node.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                node.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                              }`} />
                              {node.status.toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-muted-foreground">
                              {node.country}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono">
                            {(node.totalStorage / 1000).toFixed(2)} TB
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-foreground">
                            {node.stoincEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} STO
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <Sparkline data={node.uptimeHistory || []} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/node/${node.pubkey}`} className="text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-5 h-5 ml-auto" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm p-6 h-fit">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
