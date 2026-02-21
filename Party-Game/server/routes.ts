import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const LOCATIONS = [
  "Airplane", "Bank", "Beach", "Casino", "Hospital", 
  "Hotel", "Movie Theater", "Pirate Ship", "Restaurant", 
  "School", "Space Station", "Submarine", "Supermarket", "Train"
];

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const input = api.rooms.create.input.parse(req.body);
      
      let code = generateRoomCode();
      let existing = await storage.getRoom(code);
      while (existing) {
        code = generateRoomCode();
        existing = await storage.getRoom(code);
      }
      
      await storage.createRoom(code);
      const player = await storage.createPlayer(code, input.name, true);
      
      res.json({ roomCode: code, playerId: player.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.') 
        });
      }
      throw err;
    }
  });

  app.post(api.rooms.join.path, async (req, res) => {
    try {
      const input = api.rooms.join.input.parse(req.body);
      const code = input.roomCode.toUpperCase();
      
      const room = await storage.getRoom(code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const player = await storage.createPlayer(code, input.name, false);
      res.json({ roomCode: code, playerId: player.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: err.errors[0].message,
          field: err.errors[0].path.join('.') 
        });
      }
      throw err;
    }
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = await storage.getRoom(code);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    const players = await storage.getPlayers(code);
    res.json({ room, players });
  });

  app.post(api.rooms.start.path, async (req, res) => {
    try {
      const input = api.rooms.start.input.parse(req.body);
      const code = req.params.code.toUpperCase();
      
      const room = await storage.getRoom(code);
      if (!room) return res.status(404).json({ message: "Room not found" });
      
      const player = await storage.getPlayer(input.playerId);
      if (!player || player.roomCode !== code || !player.isHost) {
        return res.status(400).json({ message: "Only the host can start the game" });
      }
      
      const players = await storage.getPlayers(code);
      if (players.length < 2) {
        return res.status(400).json({ message: "Need at least 2 players" });
      }
      
      // Assign roles
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      await storage.updateRoom(code, { status: "playing", location });
      
      // Clear old roles
      await storage.clearRoles(code);
      
      // Pick a spy
      const spyIndex = Math.floor(Math.random() * players.length);
      const spy = players[spyIndex];
      await storage.updatePlayer(spy.id, { isSpy: true });
      
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to start game" });
    }
  });

  app.post(api.rooms.reset.path, async (req, res) => {
    try {
      const input = api.rooms.reset.input.parse(req.body);
      const code = req.params.code.toUpperCase();
      
      const room = await storage.getRoom(code);
      if (!room) return res.status(404).json({ message: "Room not found" });
      
      const player = await storage.getPlayer(input.playerId);
      if (!player || player.roomCode !== code || !player.isHost) {
        return res.status(400).json({ message: "Only the host can end the game" });
      }
      
      await storage.updateRoom(code, { status: "waiting", location: null });
      await storage.clearRoles(code);
      
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to reset game" });
    }
  });

  return httpServer;
}
