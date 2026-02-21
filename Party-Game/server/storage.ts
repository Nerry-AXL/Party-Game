import { db } from "./db";
import { rooms, players, type Room, type Player } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getRoom(code: string): Promise<Room | undefined>;
  createRoom(code: string): Promise<Room>;
  updateRoom(code: string, updates: Partial<Room>): Promise<Room>;
  getPlayers(roomCode: string): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(roomCode: string, name: string, isHost: boolean): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player>;
  clearRoles(roomCode: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getRoom(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async createRoom(code: string): Promise<Room> {
    const [room] = await db.insert(rooms).values({ code }).returning();
    return room;
  }

  async updateRoom(code: string, updates: Partial<Room>): Promise<Room> {
    const [room] = await db.update(rooms).set(updates).where(eq(rooms.code, code)).returning();
    return room;
  }

  async getPlayers(roomCode: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.roomCode, roomCode));
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async createPlayer(roomCode: string, name: string, isHost: boolean): Promise<Player> {
    const [player] = await db.insert(players).values({ roomCode, name, isHost }).returning();
    return player;
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player> {
    const [player] = await db.update(players).set(updates).where(eq(players.id, id)).returning();
    return player;
  }

  async clearRoles(roomCode: string): Promise<void> {
    await db.update(players).set({ isSpy: false }).where(eq(players.roomCode, roomCode));
  }
}

export const storage = new DatabaseStorage();
