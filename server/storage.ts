import {
  type User, type InsertUser,
  type Location, type InsertLocation,
  type Content, type InsertContent,
  type Assignment, type InsertAssignment,
  type UnlockedSession, type InsertUnlockedSession,
  type LibraryItem, type InsertLibraryItem,
  type Friendship, type InsertFriendship,
  type UserStatus, type InsertUserStatus,
  type ListenChat, type InsertListenChat,
  type ListenChatMember, type InsertListenChatMember,
  type ChatMessage, type InsertChatMessage,
  users, locations, contents, assignments, unlockedSessions, libraryItems,
  friendships, userStatus, listenChats, listenChatMembers, chatMessages,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, lte, gte, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string): Promise<User[]>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(loc: InsertLocation): Promise<Location>;
  updateLocation(id: string, patch: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<void>;

  // Contents
  getContents(): Promise<Content[]>;
  getContent(id: string): Promise<Content | undefined>;
  createContent(c: InsertContent): Promise<Content>;
  updateContent(id: string, patch: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: string): Promise<void>;

  // Assignments
  getAssignments(): Promise<Assignment[]>;
  getActiveAssignments(at?: Date): Promise<Assignment[]>;
  createAssignment(a: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, patch: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: string): Promise<void>;

  // Unlocked Sessions
  addUnlockedSession(s: InsertUnlockedSession): Promise<UnlockedSession>;
  getUnlockedSessions(userId?: string): Promise<UnlockedSession[]>;

  // Library
  getLibrary(userId?: string): Promise<LibraryItem[]>;
  addToLibrary(item: InsertLibraryItem): Promise<LibraryItem>;
  getLibraryItemByContent(contentId: string, userId?: string): Promise<LibraryItem | undefined>;
  updateLibraryItem(id: string, patch: Partial<LibraryItem>): Promise<LibraryItem | undefined>;
  deleteLibraryItem(id: string): Promise<boolean>;

  // Friendships
  sendFriendRequest(data: InsertFriendship): Promise<Friendship>;
  getFriendship(senderId: string, receiverId: string): Promise<Friendship | undefined>;
  getFriendshipById(id: string): Promise<Friendship | undefined>;
  updateFriendshipStatus(id: string, status: string): Promise<Friendship | undefined>;
  getFriends(userId: string): Promise<Friendship[]>;
  getPendingRequests(userId: string): Promise<Friendship[]>;
  getSentRequests(userId: string): Promise<Friendship[]>;
  deleteFriendship(id: string): Promise<void>;

  // User Status
  getStatus(userId: string): Promise<UserStatus | undefined>;
  upsertStatus(data: InsertUserStatus & { isOnline?: boolean }): Promise<UserStatus>;
  getFriendsStatuses(userIds: string[]): Promise<UserStatus[]>;

  // Listen Chats
  createListenChat(data: InsertListenChat): Promise<ListenChat>;
  getListenChat(id: string): Promise<ListenChat | undefined>;
  getActiveListenChats(): Promise<ListenChat[]>;
  getUserListenChats(userId: string): Promise<ListenChat[]>;
  closeListenChat(id: string): Promise<void>;

  // Listen Chat Members
  joinListenChat(data: InsertListenChatMember): Promise<ListenChatMember>;
  leaveListenChat(chatId: string, userId: string): Promise<void>;
  getListenChatMembers(chatId: string): Promise<ListenChatMember[]>;

  // Chat Messages
  sendMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getMessages(chatId: string, limit?: number): Promise<ChatMessage[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    const all = await db.select().from(users);
    const q = query.toLowerCase();
    return all.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q))
    );
  }

  async getLocations(): Promise<Location[]> {
    return db.select().from(locations);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.id, id));
    return loc;
  }

  async createLocation(loc: InsertLocation): Promise<Location> {
    const [created] = await db.insert(locations).values(loc).returning();
    return created;
  }

  async updateLocation(id: string, patch: Partial<InsertLocation>): Promise<Location | undefined> {
    const [updated] = await db.update(locations).set(patch).where(eq(locations.id, id)).returning();
    return updated;
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(assignments).where(eq(assignments.locationId, id));
    await db.delete(locations).where(eq(locations.id, id));
  }

  async getContents(): Promise<Content[]> {
    return db.select().from(contents);
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [c] = await db.select().from(contents).where(eq(contents.id, id));
    return c;
  }

  async createContent(c: InsertContent): Promise<Content> {
    const [created] = await db.insert(contents).values(c).returning();
    return created;
  }

  async updateContent(id: string, patch: Partial<InsertContent>): Promise<Content | undefined> {
    const [updated] = await db.update(contents).set(patch).where(eq(contents.id, id)).returning();
    return updated;
  }

  async deleteContent(id: string): Promise<void> {
    await db.delete(assignments).where(eq(assignments.contentId, id));
    await db.delete(contents).where(eq(contents.id, id));
  }

  async getAssignments(): Promise<Assignment[]> {
    return db.select().from(assignments).orderBy(desc(assignments.startAt));
  }

  async getActiveAssignments(at?: Date): Promise<Assignment[]> {
    const now = at ?? new Date();
    return db.select().from(assignments)
      .where(and(lte(assignments.startAt, now), gte(assignments.endAt, now)))
      .orderBy(desc(assignments.startAt));
  }

  async createAssignment(a: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(a).returning();
    return created;
  }

  async updateAssignment(id: string, patch: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updated] = await db.update(assignments).set(patch).where(eq(assignments.id, id)).returning();
    return updated;
  }

  async deleteAssignment(id: string): Promise<void> {
    await db.delete(assignments).where(eq(assignments.id, id));
  }

  async addUnlockedSession(s: InsertUnlockedSession): Promise<UnlockedSession> {
    const [created] = await db.insert(unlockedSessions).values(s).returning();
    return created;
  }

  async getUnlockedSessions(userId?: string): Promise<UnlockedSession[]> {
    if (userId) {
      return db.select().from(unlockedSessions).where(eq(unlockedSessions.userId, userId)).orderBy(desc(unlockedSessions.unlockedAt));
    }
    return db.select().from(unlockedSessions).orderBy(desc(unlockedSessions.unlockedAt));
  }

  async getLibrary(userId?: string): Promise<LibraryItem[]> {
    if (userId) {
      return db.select().from(libraryItems).where(eq(libraryItems.userId, userId)).orderBy(desc(libraryItems.unlockedAt));
    }
    return db.select().from(libraryItems).orderBy(desc(libraryItems.unlockedAt));
  }

  async addToLibrary(item: InsertLibraryItem): Promise<LibraryItem> {
    const [created] = await db.insert(libraryItems).values(item).returning();
    return created;
  }

  async getLibraryItemByContent(contentId: string, userId?: string): Promise<LibraryItem | undefined> {
    if (userId) {
      const [item] = await db.select().from(libraryItems).where(and(eq(libraryItems.contentId, contentId), eq(libraryItems.userId, userId)));
      return item;
    }
    const [item] = await db.select().from(libraryItems).where(eq(libraryItems.contentId, contentId));
    return item;
  }

  async updateLibraryItem(id: string, patch: Partial<LibraryItem>): Promise<LibraryItem | undefined> {
    const [updated] = await db.update(libraryItems).set(patch).where(eq(libraryItems.id, id)).returning();
    return updated;
  }

  async deleteLibraryItem(id: string): Promise<boolean> {
    const result = await db.delete(libraryItems).where(eq(libraryItems.id, id)).returning();
    return result.length > 0;
  }

  // ── Friendships ────────────────────────────────────────

  async sendFriendRequest(data: InsertFriendship): Promise<Friendship> {
    const [created] = await db.insert(friendships).values({ ...data, status: "pending" }).returning();
    return created;
  }

  async getFriendship(senderId: string, receiverId: string): Promise<Friendship | undefined> {
    const [f] = await db.select().from(friendships).where(
      or(
        and(eq(friendships.senderId, senderId), eq(friendships.receiverId, receiverId)),
        and(eq(friendships.senderId, receiverId), eq(friendships.receiverId, senderId))
      )
    );
    return f;
  }

  async getFriendshipById(id: string): Promise<Friendship | undefined> {
    const [f] = await db.select().from(friendships).where(eq(friendships.id, id));
    return f;
  }

  async updateFriendshipStatus(id: string, status: string): Promise<Friendship | undefined> {
    const [updated] = await db.update(friendships).set({ status }).where(eq(friendships.id, id)).returning();
    return updated;
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    return db.select().from(friendships).where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.senderId, userId), eq(friendships.receiverId, userId))
      )
    );
  }

  async getPendingRequests(userId: string): Promise<Friendship[]> {
    return db.select().from(friendships).where(
      and(eq(friendships.receiverId, userId), eq(friendships.status, "pending"))
    ).orderBy(desc(friendships.createdAt));
  }

  async getSentRequests(userId: string): Promise<Friendship[]> {
    return db.select().from(friendships).where(
      and(eq(friendships.senderId, userId), eq(friendships.status, "pending"))
    ).orderBy(desc(friendships.createdAt));
  }

  async deleteFriendship(id: string): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, id));
  }

  // ── User Status ────────────────────────────────────────

  async getStatus(userId: string): Promise<UserStatus | undefined> {
    const [s] = await db.select().from(userStatus).where(eq(userStatus.userId, userId));
    return s;
  }

  async upsertStatus(data: InsertUserStatus & { isOnline?: boolean }): Promise<UserStatus> {
    const existing = await this.getStatus(data.userId);
    if (existing) {
      const [updated] = await db.update(userStatus).set({
        ...data,
        isOnline: data.isOnline ?? true,
        lastSeen: new Date(),
      }).where(eq(userStatus.userId, data.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(userStatus).values({
      ...data,
      isOnline: data.isOnline ?? true,
      lastSeen: new Date(),
    }).returning();
    return created;
  }

  async getFriendsStatuses(userIds: string[]): Promise<UserStatus[]> {
    if (!userIds.length) return [];
    return db.select().from(userStatus).where(inArray(userStatus.userId, userIds));
  }

  // ── Listen Chats ───────────────────────────────────────

  async createListenChat(data: InsertListenChat): Promise<ListenChat> {
    const [created] = await db.insert(listenChats).values({ ...data, isActive: true }).returning();
    return created;
  }

  async getListenChat(id: string): Promise<ListenChat | undefined> {
    const [c] = await db.select().from(listenChats).where(eq(listenChats.id, id));
    return c;
  }

  async getActiveListenChats(): Promise<ListenChat[]> {
    return db.select().from(listenChats).where(eq(listenChats.isActive, true)).orderBy(desc(listenChats.createdAt));
  }

  async getUserListenChats(userId: string): Promise<ListenChat[]> {
    const memberships = await db.select().from(listenChatMembers).where(eq(listenChatMembers.userId, userId));
    const chatIds = memberships.map(m => m.chatId);
    if (!chatIds.length) return [];
    return db.select().from(listenChats).where(
      and(inArray(listenChats.id, chatIds), eq(listenChats.isActive, true))
    ).orderBy(desc(listenChats.createdAt));
  }

  async closeListenChat(id: string): Promise<void> {
    await db.update(listenChats).set({ isActive: false }).where(eq(listenChats.id, id));
  }

  // ── Listen Chat Members ────────────────────────────────

  async joinListenChat(data: InsertListenChatMember): Promise<ListenChatMember> {
    const existing = await db.select().from(listenChatMembers).where(
      and(eq(listenChatMembers.chatId, data.chatId), eq(listenChatMembers.userId, data.userId))
    );
    if (existing.length) return existing[0];
    const [created] = await db.insert(listenChatMembers).values(data).returning();
    return created;
  }

  async leaveListenChat(chatId: string, userId: string): Promise<void> {
    await db.delete(listenChatMembers).where(
      and(eq(listenChatMembers.chatId, chatId), eq(listenChatMembers.userId, userId))
    );
  }

  async getListenChatMembers(chatId: string): Promise<ListenChatMember[]> {
    return db.select().from(listenChatMembers).where(eq(listenChatMembers.chatId, chatId));
  }

  // ── Chat Messages ──────────────────────────────────────

  async sendMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(data).returning();
    return created;
  }

  async getMessages(chatId: string, limit = 50): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(desc(chatMessages.sentAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
