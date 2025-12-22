import React from "react";
import { useRoute, Link } from "wouter";
import { useNode, useNodeUptimeStats } from "@/hooks/use-nodes";
import { Sparkline } from "@/components/Sparkline";
import { StatCard } from "@/components/StatCard";
import { ReliabilityScore } from "@/components/ReliabilityScore";
import { HistoricalTrendChart } from "@/components/HistoricalTrendChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Server, HardDrive, Cpu, Clock, MapPin, Share2, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function NodeDetail() {
  const [, params] = useRoute("/node/:pubkey");
  const pubkey = params?.pubkey || "";
  const { data: node, isLoading } = useNode(pubkey);
  const { data: uptimeStats } = useNodeUptimeStats(pubkey, 168); // 7 days

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!node) return <div className="h-screen flex items-center justify-center">Node not found</div>;

  // Mock earnings data based on uptime history for the chart
  const earningsData = (node.uptimeHistory || []).map((val, i) => ({
    time: new Date(Date.now() - (24 - i) * 3600 * 1000).toISOString(),
    earnings: (val / 100) * node.stoincEarnings * (1 + i * 0.01), // Fake accumulation
    uptime: val
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-muted/50 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-mono font-bold">{node.pubkey}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {node.status.toUpperCase()} • v{node.version}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Reliability Score Card */}
        <ReliabilityScore 
          score={node.uptimeScore || uptimeStats?.uptimePercentage || 100}
          rank={node.reliabilityRank}
          totalNodes={50} // Could fetch from API
        />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/40 border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" /> <span className="text-xs font-medium uppercase">Location</span>
            </div>
            <p className="font-semibold text-lg">{node.country}</p>
          </div>
          <div className="bg-card/40 border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4" /> <span className="text-xs font-medium uppercase">Storage</span>
            </div>
            <p className="font-semibold text-lg font-mono">{(node.totalStorage / 1000).toFixed(2)} TB</p>
          </div>
          <div className="bg-card/40 border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" /> <span className="text-xs font-medium uppercase">Last Seen</span>
            </div>
            <p className="font-semibold text-lg">{node.lastUpdated}</p>
          </div>
          <div className="bg-card/40 border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Cpu className="w-4 h-4" /> <span className="text-xs font-medium uppercase">Version</span>
            </div>
            <p className="font-semibold text-lg font-mono">{node.version}</p>
          </div>
        </div>

        {/* Main Earnings Chart */}
        <section className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-bold">Earnings Performance</h2>
              <p className="text-muted-foreground text-sm">Accumulated STO tokens over last 24h</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono text-primary">{node.stoincEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Earnings</p>
            </div>
          </div>

          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={(t) => format(new Date(t), "HH:mm")}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => val.toFixed(1)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: 'white' }}
                  labelFormatter={(t) => format(new Date(t), "PP p")}
                />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEarnings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Uptime History & Metadata */}
        <div className="grid md:grid-cols-3 gap-8">
          <section className="md:col-span-2 glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Real-Time Uptime</h3>
              {uptimeStats && (
                <div className="text-sm text-muted-foreground">
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                  {uptimeStats.activeChecks} / {uptimeStats.totalChecks} checks
                </div>
              )}
            </div>
            <div className="h-40">
              <Sparkline data={node.uptimeHistory || []} color="#14b8a6" height={160} />
            </div>
            <div className="mt-4 grid grid-cols-24 gap-px opacity-50">
               {/* Just visual blocks representing hours */}
               {Array.from({length: 24}).map((_, i) => (
                 <div key={i} className="h-2 bg-x-teal/50 rounded-sm" title={`Hour ${i}`} />
               ))}
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="font-bold mb-4">Statistics</h3>
            {uptimeStats ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime %</span>
                  <span className="font-mono font-semibold">{uptimeStats.uptimePercentage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Checks</span>
                  <span className="font-mono">{uptimeStats.totalChecks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-mono text-green-500">{uptimeStats.activeChecks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offline</span>
                  <span className="font-mono text-red-500">{uptimeStats.offlineChecks}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Seen</span>
                    <span className="font-mono text-xs">{new Date(uptimeStats.firstSeen).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Loading statistics...
              </div>
            )}
          </section>
        </div>

        {/* Historical Trend Chart */}
        <HistoricalTrendChart pubkey={pubkey} />
      </main>
    </div>
  );
}
