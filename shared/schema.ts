import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

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
  artworkUrl: text("artwork_url"),
  videoUrl: text("video_url"),
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

// ── Social tables ──────────────────────────────────────

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "accepted" | "declined"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userStatus = pgTable("user_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  currentContentId: varchar("current_content_id"),
  currentContentTitle: text("current_content_title"),
  currentContentArtist: text("current_content_artist"),
  statusText: text("status_text"),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const listenChats = pgTable("listen_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contentId: varchar("content_id").notNull(),
  contentTitle: text("content_title").notNull(),
  contentArtist: text("content_artist").notNull(),
  audioUrl: text("audio_url").notNull(),
  createdBy: varchar("created_by").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isPrivate: boolean("is_private").notNull().default(false),
  isRemote: boolean("is_remote").notNull().default(false),
  maxMembers: integer("max_members").notNull().default(20),
  allowChat: boolean("allow_chat").notNull().default(true),
  locationId: varchar("location_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const listenChatMembers = pgTable("listen_chat_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull(),
  userId: varchar("user_id").notNull(),
  displayName: text("display_name").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull(),
  userId: varchar("user_id").notNull(),
  displayName: text("display_name").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  circleId: varchar("circle_id"),
  fromUserId: varchar("from_user_id"),
  fromDisplayName: text("from_display_name"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertContentSchema = createInsertSchema(contents).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertUnlockedSessionSchema = createInsertSchema(unlockedSessions).omit({ id: true, unlockedAt: true });
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, unlockCount: true, lastUnlockedAt: true, unlockedAt: true });

export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, status: true });
export const insertUserStatusSchema = createInsertSchema(userStatus).omit({ id: true, lastSeen: true, isOnline: true });
export const insertListenChatSchema = createInsertSchema(listenChats).omit({ id: true, createdAt: true, isActive: true });
export const insertListenChatMemberSchema = createInsertSchema(listenChatMembers).omit({ id: true, joinedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, sentAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });

// Types
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

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type UserStatus = typeof userStatus.$inferSelect;
export type InsertUserStatus = z.infer<typeof insertUserStatusSchema>;
export type ListenChat = typeof listenChats.$inferSelect;
export type InsertListenChat = z.infer<typeof insertListenChatSchema>;
export type ListenChatMember = typeof listenChatMembers.$inferSelect;
export type InsertListenChatMember = z.infer<typeof insertListenChatMemberSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
