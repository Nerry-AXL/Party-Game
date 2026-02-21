import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  code: text("code").primaryKey(),
  status: text("status").notNull().default("waiting"), // 'waiting' | 'playing'
  location: text("location"),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  name: text("name").notNull(),
  isHost: boolean("is_host").notNull().default(false),
  isSpy: boolean("is_spy").notNull().default(false),
});

export const insertRoomSchema = createInsertSchema(rooms);
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, isSpy: true, isHost: true });

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
