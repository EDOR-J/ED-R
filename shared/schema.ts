import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  phone: text("phone"),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  isPermanent: boolean("is_permanent").notNull().default(false),
});

export const contents = pgTable("contents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  creator: text("creator").notNull(),
  description: text("description").notNull().default(""),
  audioUrl: text("audio_url").notNull(),
  artworkSeed: text("artwork_seed"),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").notNull(),
  mode: text("mode").notNull(), // "discover" | "park"
  contentId: varchar("content_id").notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const unlockedSessions = pgTable("unlocked_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  nodeId: varchar("node_id").notNull(),
  contentId: varchar("content_id").notNull(),
  mode: text("mode").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const libraryItems = pgTable("library_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  contentId: varchar("content_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  mode: text("mode").notNull(),
  nodeId: varchar("node_id").notNull(),
  locationName: text("location_name").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  lastUnlockedAt: timestamp("last_unlocked_at"),
  unlockCount: integer("unlock_count").notNull().default(1),
  audioUrl: text("audio_url").notNull(),
  artworkUrl: text("artwork_url").notNull().default(""),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertContentSchema = createInsertSchema(contents).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertUnlockedSessionSchema = createInsertSchema(unlockedSessions).omit({ id: true, unlockedAt: true });
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, unlockCount: true, lastUnlockedAt: true, unlockedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Content = typeof contents.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type UnlockedSession = typeof unlockedSessions.$inferSelect;
export type InsertUnlockedSession = z.infer<typeof insertUnlockedSessionSchema>;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
