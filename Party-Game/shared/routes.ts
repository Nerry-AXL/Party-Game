import { z } from 'zod';
import { rooms, players } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  badRequest: z.object({ message: z.string() }),
};

export const api = {
  rooms: {
    create: {
      method: 'POST' as const,
      path: '/api/rooms' as const,
      input: z.object({ name: z.string().min(1, "Name is required").max(20, "Name too long") }),
      responses: {
        200: z.object({ roomCode: z.string(), playerId: z.number() }),
        400: errorSchemas.validation,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/rooms/join' as const,
      input: z.object({ 
        name: z.string().min(1, "Name is required").max(20, "Name too long"), 
        roomCode: z.string().length(4, "Room code must be exactly 4 characters") 
      }),
      responses: {
        200: z.object({ roomCode: z.string(), playerId: z.number() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rooms/:code' as const,
      responses: {
        200: z.object({
          room: z.custom<typeof rooms.$inferSelect>(),
          players: z.array(z.custom<typeof players.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    start: {
      method: 'POST' as const,
      path: '/api/rooms/:code/start' as const,
      input: z.object({ playerId: z.number() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.badRequest,
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/rooms/:code/reset' as const,
      input: z.object({ playerId: z.number() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.badRequest,
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
