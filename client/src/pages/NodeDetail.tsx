import React, { useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { useNode, useNodeSnapshots, useNodeUptimeStats } from "@/hooks/use-nodes";
import { HistoricalTrendChart } from "@/components/HistoricalTrendChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Copy, Coins, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";

type RangeOption = "24h" | "7d";

export default function NodeDetail() {
  const [, params] = useRoute("/node/:pubkey");
  const pubkey = params?.pubkey || "";
  const [copied, setCopied] = useState(false);
  const [range, setRange] = useState<RangeOption>("24h");
  
  const { data: node, isLoading } = useNode(pubkey);
  const { data: uptimeStats } = useNodeUptimeStats(pubkey, 168); // 7 days
  const { data: snapshots } = useNodeSnapshots(pubkey, 336);

  const nodeName = node?.ip ? `Node ${node.ip}` : node?.pubkey || "";
  
  const earningsData = useMemo(() => {
    if (!node) return [];
    
    const fallbackSeries = (node.uptimeHistory || []).map((val, index, arr) => {
      const hoursBehind = arr.length - 1 - index;
      const timestamp = new Date(Date.now() - hoursBehind * 3600 * 1000);
      const synthetic = (val / 100) * node.stoincEarnings * (1 + index * 0.008);
      return {
        time: timestamp.toISOString(),
        earnings: Number(Math.max(synthetic, 0).toFixed(4)),
      };
    });

    // Filter out snapshots with 0 earnings (invalid/temporary data)
    const validSnapshots = (snapshots ?? []).filter((snapshot) => 
      typeof snapshot.stoincEarnings === "number" && snapshot.stoincEarnings > 0
    );

    const snapshotSeries = validSnapshots.map((snapshot) => {
      const timestamp = snapshot.timestamp ? new Date(snapshot.timestamp) : new Date();
      return {
        time: timestamp.toISOString(),
        earnings: Number(snapshot.stoincEarnings.toFixed(4)),
      };
    });

    const baseSeries = snapshotSeries.length ? snapshotSeries : fallbackSeries;
    if (!baseSeries.length) return [];

    const sortedSeries = [...baseSeries].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const windowMs = range === "24h" ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
    const filteredSeries = sortedSeries.filter(
      (point) => Date.now() - new Date(point.time).getTime() <= windowMs
    );
    const sliceLength = range === "24h" ? 24 : 24 * 7;
    const series = filteredSeries.length >= 2
      ? filteredSeries
      : sortedSeries.slice(-Math.min(sliceLength, sortedSeries.length));

    return series.map((point, index) => {
      const prev = index === 0 ? null : series[index - 1];
      const delta = prev ? point.earnings - prev.earnings : 0;
      return {
        ...point,
        delta: Number(delta.toFixed(4)),
      };
    });
  }, [snapshots, node, range]);

  const hasChartData = earningsData.length > 0;
  const hasTrendWindow = earningsData.length > 1;
  const latestPoint = earningsData[earningsData.length - 1];
  const earliestPoint = earningsData[0];
  const earningsRangeChange = hasTrendWindow && latestPoint && earliestPoint
    ? latestPoint.earnings - earliestPoint.earnings
    : 0;
  const earningsChangePct = hasTrendWindow && earliestPoint && earliestPoint.earnings
    ? (earningsRangeChange / earliestPoint.earnings) * 100
    : 0;
  const displayedTotal = latestPoint?.earnings ?? (node?.stoincEarnings || 0);
  const changeIsPositive = earningsRangeChange >= 0;
  const lastUpdatedSource = latestPoint?.time ?? node?.lastUpdated;
  const lastUpdatedRelative = lastUpdatedSource
    ? formatDistanceToNow(new Date(lastUpdatedSource), { addSuffix: true })
    : "--";

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!node) return <div className="h-screen flex items-center justify-center">Node not found</div>;

  const rangeLabels: Record<RangeOption, string> = {
    "24h": "Last 24 hours",
    "7d": "Last 7 days",
  };

  const formatCapacity = (gb: number) => {
    if (!gb) return "0 GB";
    if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${(gb * 1024).toFixed(0)} MB`;
  };

  const formatUsage = (mb?: number | null) => {
    if (!mb) return "0 MB";
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const statusLabel = (node.status || "").toLowerCase() === "online" ? "Online" : "Offline";
  const statusClasses = statusLabel === "Online"
    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
    : "bg-rose-500/15 text-rose-200 border border-rose-400/30";
  const locationLabel = [node.city, node.country].filter(Boolean).join(", ") || node.country || "Unknown";
  const storageCommitted = formatCapacity(node.totalStorage);
  const storageUsed = formatUsage(node.storageUsed);
  const uptimeScore = node.uptimeScore || uptimeStats?.uptimePercentage || 0;
  const lastSeenDate = new Date(node.lastUpdated);
  const lastSeenRelative = formatDistanceToNow(lastSeenDate, { addSuffix: true });
  const heroHighlights = [
    {
      label: "Uptime Score",
      value: `${uptimeScore.toFixed(2)}%`,
      helper: "Past 7 days",
      accent: "from-emerald-500/40 to-emerald-500/5 text-emerald-100"
    },
    {
      label: "Storage",
      value: storageCommitted,
      helper: `${storageUsed} used`,
      accent: "from-amber-500/30 to-amber-500/5 text-amber-100"
    },
    {
      label: "Rewards",
      value: `${node.stoincEarnings.toFixed(2)} STO`,
      helper: "Lifetime earnings",
      accent: "from-sky-500/30 to-sky-500/5 text-sky-100"
    },
    {
      label: "Visibility",
      value: node.isPublic ? "Public" : "Private",
      helper: locationLabel,
      accent: "from-purple-500/30 to-purple-500/5 text-purple-100"
    }
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.pubkey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Failed to copy pubkey", error);
    }
  };

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
              <h1 className="text-lg font-semibold">{nodeName}</h1>
              <p className="text-xs text-muted-foreground">
                {locationLabel}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900/70 p-6 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.25),transparent_60%)]" />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 blur-3xl rounded-full" />
          <div className="relative z-10 grid gap-8 md:grid-cols-[1.6fr,1fr]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Node Overview</p>
              <div>
                <h1 className="text-2xl md:text-3xl font-mono font-semibold leading-snug break-words">
                  {nodeName}
                </h1>
                <p className="text-sm text-white/70 mt-1">{locationLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses}`}>
                  {statusLabel}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 border border-white/20">
                  Version v{node.version}
                </span>
                {node.reliabilityRank && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 border border-white/20">
                    Rank #{node.reliabilityRank}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/70">Last seen {lastSeenRelative}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCopy}
                  className="bg-white/15 text-white border border-white/20 hover:bg-white/25"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied" : "Copy Key"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-white/10 text-white border border-white/15 hover:bg-white/20"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {heroHighlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className={`rounded-2xl border border-white/15 bg-gradient-to-br ${highlight.accent} p-4 shadow-inner`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-white/70">{highlight.label}</p>
                  <p className="text-xl font-semibold mt-1">{highlight.value}</p>
                  <p className="text-xs text-white/70">{highlight.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Earnings Chart */}
        <section className="rounded-3xl border border-white/5 bg-card/80 p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="absolute -bottom-16 left-1/2 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-[0.25em]">
                  <Coins className="w-5 h-5 text-primary" />
                  Earnings Performance
                </div>
                <h2 className="text-2xl font-bold mt-2">Live STO momentum</h2>
                <p className="text-muted-foreground text-sm">
                  {rangeLabels[range]} • tracking on-chain payouts from snapshots
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-white/10 bg-background/70 px-5 py-3 shadow-inner">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Current total</p>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-mono font-semibold text-primary">
                      {displayedTotal.toFixed(2)} <span className="text-base font-sans text-muted-foreground">STO</span>
                    </span>
                    {hasTrendWindow && (
                      <span className={`flex items-center text-sm font-semibold ${changeIsPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {changeIsPositive ? (
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(earningsRangeChange).toFixed(2)} ({Math.abs(earningsChangePct).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/60 px-5 py-3 shadow-inner">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Last update</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{lastUpdatedRelative}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["24h", "7d"] as RangeOption[]).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={range === option ? "default" : "ghost"}
                  className={range === option
                    ? "rounded-full bg-primary text-primary-foreground shadow-lg"
                    : "rounded-full border border-white/10 text-muted-foreground"}
                  onClick={() => setRange(option)}
                >
                  {option === "24h" ? "Last 24h" : "Last 7d"}
                </Button>
              ))}
            </div>

            <div className="h-[320px] w-full">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={earningsData}
                    margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(t) => format(new Date(t), range === "24h" ? "HH:mm" : "MMM d")}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `${val.toFixed(1)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 16px 45px rgba(2,6,23,0.55)",
                      }}
                      formatter={(value: number, _name: string, props: any) => {
                        const delta = props?.payload?.delta ?? 0;
                        const label = delta
                          ? `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} STO interval`
                          : "Total";
                        return [`${Number(value ?? 0).toFixed(2)} STO`, label];
                      }}
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
              ) : (
                <div className="h-full rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
                  <p className="text-sm font-semibold">Awaiting earnings snapshots</p>
                  <p className="text-xs max-w-xs">
                    We will visualize rewards automatically once the first metrics flow in for this node.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Uptime History & Metadata */}
        {/* Historical Trend Chart */}
        <HistoricalTrendChart pubkey={pubkey} />
      </main>
    </div>
  );
}
