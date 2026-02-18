import {
  type User, type InsertUser,
  type Location, type InsertLocation,
  type Content, type InsertContent,
  type Assignment, type InsertAssignment,
  type UnlockedSession, type InsertUnlockedSession,
  type LibraryItem, type InsertLibraryItem,
  users, locations, contents, assignments, unlockedSessions, libraryItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, gte, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export const storage = new DatabaseStorage();
