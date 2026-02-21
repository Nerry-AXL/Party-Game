import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Types derived from schema
export type Room = z.infer<typeof api.rooms.get.responses[200]>['room'];
export type Player = z.infer<typeof api.rooms.get.responses[200]>['players'][0];

// Hook to get room data (polled)
export function useRoom(code: string) {
  return useQuery({
    queryKey: [api.rooms.get.path, code],
    queryFn: async () => {
      const url = buildUrl(api.rooms.get.path, { code });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch room');
      return api.rooms.get.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Poll every 2s
    enabled: !!code && code.length === 4,
  });
}

// Create a new room
export function useCreateRoom() {
  return useMutation({
    mutationFn: async (name: string) => {
      const validated = api.rooms.create.input.parse({ name });
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.rooms.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create room');
      }
      return api.rooms.create.responses[200].parse(await res.json());
    },
  });
}

// Join an existing room
export function useJoinRoom() {
  return useMutation({
    mutationFn: async ({ name, roomCode }: { name: string; roomCode: string }) => {
      const validated = api.rooms.join.input.parse({ name, roomCode });
      const res = await fetch(api.rooms.join.path, {
        method: api.rooms.join.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.rooms.join.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) {
           throw new Error("Room not found");
        }
        throw new Error('Failed to join room');
      }
      return api.rooms.join.responses[200].parse(await res.json());
    },
  });
}

// Start the game (Host only)
export function useStartGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, playerId }: { code: string; playerId: number }) => {
      const url = buildUrl(api.rooms.start.path, { code });
      const res = await fetch(url, {
        method: api.rooms.start.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (!res.ok) throw new Error('Failed to start game');
      return api.rooms.start.responses[200].parse(await res.json());
    },
    onSuccess: (_, { code }) => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.get.path, code] });
    },
  });
}

// Reset/End the game (Host only)
export function useResetGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, playerId }: { code: string; playerId: number }) => {
      const url = buildUrl(api.rooms.reset.path, { code });
      const res = await fetch(url, {
        method: api.rooms.reset.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (!res.ok) throw new Error('Failed to reset game');
      return api.rooms.reset.responses[200].parse(await res.json());
    },
    onSuccess: (_, { code }) => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.get.path, code] });
    },
  });
}
