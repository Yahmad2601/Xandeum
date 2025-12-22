import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { useNodeTrends } from "@/hooks/use-nodes";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HistoricalTrendChartProps {
  pubkey: string;
  className?: string;
}

export function HistoricalTrendChart({ pubkey, className = "" }: HistoricalTrendChartProps) {
  const { data: trends, isLoading, error } = useNodeTrends(pubkey);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !trends) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Historical Uptime Trends</CardTitle>
          <CardDescription>Historical performance data not available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No historical data available yet. The crawler needs to collect data over time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Transform data for charts
  const hourlyData = trends.hourlyUptime.map((uptime, i) => {
    const hoursAgo = 24 - i;
    return {
      label: hoursAgo === 0 ? "Now" : `${hoursAgo}h ago`,
      uptime,
      hour: i,
    };
  });

  const dailyData = trends.dailyUptime.map((uptime, i) => {
    const daysAgo = 7 - i;
    const labels = ["Today", "Yesterday", "2 days ago", "3 days ago", "4 days ago", "5 days ago", "6 days ago"];
    return {
      label: labels[daysAgo] || `${daysAgo} days ago`,
      uptime,
      day: i,
    };
  });

  const weeklyData = trends.weeklyUptime.map((uptime, i) => {
    const weeksAgo = 4 - i;
    return {
      label: weeksAgo === 0 ? "This week" : `${weeksAgo}w ago`,
      uptime,
      week: i,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.label}</p>
          <p className="text-sm text-muted-foreground">
            Uptime: <span className="font-semibold text-foreground">
              {payload[0].value.toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Historical Uptime Trends</CardTitle>
        <CardDescription>
          Real-time monitoring data collected every 30 seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hourly">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="daily">Last 7 Days</TabsTrigger>
            <TabsTrigger value="weekly">Last 4 Weeks</TabsTrigger>
          </TabsList>

          {/* Hourly View */}
          <TabsContent value="hourly" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#uptimeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Hourly uptime percentage over the last 24 hours
            </p>
          </TabsContent>

          {/* Daily View */}
          <TabsContent value="daily" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#uptimeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Daily uptime percentage over the last 7 days
            </p>
          </TabsContent>

          {/* Weekly View */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#uptimeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Weekly uptime percentage over the last 4 weeks
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
