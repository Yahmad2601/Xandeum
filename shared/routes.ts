import { z } from 'zod';
import { insertNodeSchema, nodes } from './schema';

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
    // This is the "crawler" trigger endpoint
    refresh: {
      method: 'POST' as const,
      path: '/api/cron/refresh',
      responses: {
        200: z.object({ message: z.string(), count: z.number() }),
      },
    }
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
