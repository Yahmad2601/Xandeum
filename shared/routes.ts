import { z } from 'zod';
import { insertNodeSchema, nodes } from './schema';

export type CreateNodeRequest = z.infer<typeof insertNodeSchema>;

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  nodes: {
    list: {
      method: 'GET' as const,
      path: '/api/nodes',
      responses: {
        200: z.array(z.custom<typeof nodes.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/nodes/:pubkey',
      responses: {
        200: z.custom<typeof nodes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/nodes',
      input: insertNodeSchema,
      responses: {
        201: z.custom<typeof nodes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    // Uptime statistics for a specific node
    uptimeStats: {
      method: 'GET' as const,
      path: '/api/nodes/:pubkey/uptime',
      responses: {
        200: z.object({
          pubkey: z.string(),
          uptimePercentage: z.number(),
          totalChecks: z.number(),
          activeChecks: z.number(),
          offlineChecks: z.number(),
          firstSeen: z.date(),
          lastSeen: z.date(),
        }),
        404: errorSchemas.notFound,
      },
    },
    // Trend data for charts (hourly, daily, weekly)
    trends: {
      method: 'GET' as const,
      path: '/api/nodes/:pubkey/trends',
      responses: {
        200: z.object({
          pubkey: z.string(),
          hourlyUptime: z.array(z.number()),
          dailyUptime: z.array(z.number()),
          weeklyUptime: z.array(z.number()),
        }),
        404: errorSchemas.notFound,
      },
    },
    // Recent snapshots (historical heartbeat data)
    snapshots: {
      method: 'GET' as const,
      path: '/api/nodes/:pubkey/snapshots',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          pubkey: z.string(),
          status: z.enum(['online', 'offline']),
          ip: z.string().nullable(),
          version: z.string().nullable(),
          totalStorage: z.number().nullable(),
          stoincEarnings: z.number().nullable(),
          timestamp: z.date(),
        })),
      },
    },
    // This is the "crawler" trigger endpoint
    refresh: {
      method: 'POST' as const,
      path: '/api/cron/refresh',
      responses: {
        200: z.object({ message: z.string(), count: z.number() }),
      },
    }
  },
  crawler: {
    status: {
      method: 'GET' as const,
      path: '/api/crawler/status',
      responses: {
        200: z.object({
          isRunning: z.boolean(),
          crawlCount: z.number(),
          uptime: z.string(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
