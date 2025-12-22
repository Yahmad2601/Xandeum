import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateNodeRequest } from "@shared/routes";

// GET /api/nodes
export function useNodes() {
  return useQuery({
    queryKey: [api.nodes.list.path],
    queryFn: async () => {
      const res = await fetch(api.nodes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch nodes');
      return api.nodes.list.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

// GET /api/nodes/:pubkey
export function useNode(pubkey: string) {
  return useQuery({
    queryKey: [api.nodes.get.path, pubkey],
    queryFn: async () => {
      const url = buildUrl(api.nodes.get.path, { pubkey });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch node');
      return api.nodes.get.responses[200].parse(await res.json());
    },
    enabled: !!pubkey,
    refetchInterval: 30000,
  });
}

// GET /api/nodes/:pubkey/uptime - Uptime statistics
export function useNodeUptimeStats(pubkey: string, hours: number = 168) {
  return useQuery({
    queryKey: [api.nodes.uptimeStats.path, pubkey, hours],
    queryFn: async () => {
      const url = buildUrl(api.nodes.uptimeStats.path, { pubkey }) + `?hours=${hours}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch uptime stats');
      return api.nodes.uptimeStats.responses[200].parse(await res.json());
    },
    enabled: !!pubkey,
    refetchInterval: 60000, // Refresh every minute
  });
}

// GET /api/nodes/:pubkey/trends - Trend data for charts
export function useNodeTrends(pubkey: string) {
  return useQuery({
    queryKey: [api.nodes.trends.path, pubkey],
    queryFn: async () => {
      const url = buildUrl(api.nodes.trends.path, { pubkey });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch trends');
      return api.nodes.trends.responses[200].parse(await res.json());
    },
    enabled: !!pubkey,
    refetchInterval: 60000, // Refresh every minute
  });
}

// GET /api/nodes/:pubkey/snapshots - Recent heartbeat snapshots
export function useNodeSnapshots(pubkey: string, limit: number = 100) {
  return useQuery({
    queryKey: [api.nodes.snapshots.path, pubkey, limit],
    queryFn: async () => {
      const url = buildUrl(api.nodes.snapshots.path, { pubkey }) + `?limit=${limit}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch snapshots');
      return api.nodes.snapshots.responses[200].parse(await res.json());
    },
    enabled: !!pubkey,
    refetchInterval: 30000,
  });
}

// GET /api/crawler/status - Crawler service status
export function useCrawlerStatus() {
  return useQuery({
    queryKey: [api.crawler.status.path],
    queryFn: async () => {
      const res = await fetch(api.crawler.status.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch crawler status');
      return api.crawler.status.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Check every 10 seconds
  });
}

// POST /api/nodes (Create - though mostly for testing/seeding)
export function useCreateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateNodeRequest) => {
      const res = await fetch(api.nodes.create.path, {
        method: api.nodes.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.nodes.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create node');
      }
      return api.nodes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.nodes.list.path] }),
  });
}

// POST /api/cron/refresh (Trigger crawler)
export function useRefreshNodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.nodes.refresh.path, {
        method: api.nodes.refresh.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to refresh network');
      return api.nodes.refresh.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.nodes.list.path] });
    },
  });
}

