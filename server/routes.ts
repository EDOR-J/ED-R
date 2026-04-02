import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertLocationSchema, insertContentSchema, insertAssignmentSchema,
  insertUnlockedSessionSchema, insertLibraryItemSchema,
  insertFriendshipSchema, insertUserStatusSchema,
  insertListenChatSchema, insertListenChatMemberSchema, insertChatMessageSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { authStorage } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerAuthRoutes } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerObjectStorageRoutes(app);
  registerAuthRoutes(app);

  // ── Locations ──────────────────────────────────────────
  app.get("/api/locations", async (_req, res) => {
    const locs = await storage.getLocations();
    res.json(locs);
  });

  app.get("/api/locations/:id", async (req, res) => {
    const loc = await storage.getLocation(req.params.id);
    if (!loc) return res.status(404).json({ message: "Location not found" });
    res.json(loc);
  });

  app.post("/api/locations", async (req, res) => {
    const parsed = insertLocationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const loc = await storage.createLocation(parsed.data);
    res.status(201).json(loc);
  });

  app.patch("/api/locations/:id", async (req, res) => {
    const updated = await storage.updateLocation(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Location not found" });
    res.json(updated);
  });

  app.delete("/api/locations/:id", async (req, res) => {
    await storage.deleteLocation(req.params.id);
    res.status(204).send();
  });

  // ── NFC ────────────────────────────────────────────────
  app.get("/api/nfc/:nfcId", async (req, res) => {
    const loc = await storage.getLocationByNfcId(req.params.nfcId);
    if (!loc) return res.status(404).json({ message: "NFC tag not recognised" });
    res.json(loc);
  });

  // ── Contents ───────────────────────────────────────────
  app.get("/api/contents", async (_req, res) => {
    const items = await storage.getContents();
    res.json(items);
  });

  app.get("/api/contents/:id", async (req, res) => {
    const item = await storage.getContent(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found" });
    res.json(item);
  });

  app.post("/api/contents", async (req, res) => {
    const parsed = insertContentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const item = await storage.createContent(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/contents/:id", async (req, res) => {
    const updated = await storage.updateContent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Content not found" });
    res.json(updated);
  });

  app.delete("/api/contents/:id", async (req, res) => {
    await storage.deleteContent(req.params.id);
    res.status(204).send();
  });

  // ── Assignments ────────────────────────────────────────
  app.get("/api/assignments", async (_req, res) => {
    const items = await storage.getAssignments();
    res.json(items);
  });

  app.get("/api/assignments/active", async (_req, res) => {
    const items = await storage.getActiveAssignments();
    res.json(items);
  });

  app.post("/api/assignments", async (req, res) => {
    const body = { ...req.body };
    if (typeof body.startAt === "string") body.startAt = new Date(body.startAt);
    if (typeof body.endAt === "string") body.endAt = new Date(body.endAt);
    const parsed = insertAssignmentSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const item = await storage.createAssignment(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/assignments/:id", async (req, res) => {
    const body = { ...req.body };
    if (typeof body.startAt === "string") body.startAt = new Date(body.startAt);
    if (typeof body.endAt === "string") body.endAt = new Date(body.endAt);
    const updated = await storage.updateAssignment(req.params.id, body);
    if (!updated) return res.status(404).json({ message: "Assignment not found" });
    res.json(updated);
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    await storage.deleteAssignment(req.params.id);
    res.status(204).send();
  });

  // ── Pulse data (combined: locations + contents + active assignments) ──
  app.get("/api/pulse-data", async (_req, res) => {
    const [locs, conts, active] = await Promise.all([
      storage.getLocations(),
      storage.getContents(),
      storage.getActiveAssignments(),
    ]);
    res.json({ locations: locs, contents: conts, assignments: active });
  });

  // ── This week's drops (enriched active assignments) ──
  app.get("/api/drops", async (_req, res) => {
    const [locs, conts, active] = await Promise.all([
      storage.getLocations(),
      storage.getContents(),
      storage.getActiveAssignments(),
    ]);
    const seen = new Set<string>();
    const drops: Array<{ assignment: any; content: any; location: any }> = [];
    for (const a of active) {
      if (seen.has(a.locationId)) continue;
      const c = conts.find((x) => x.id === a.contentId);
      const l = locs.find((x) => x.id === a.locationId);
      if (!c || !l) continue;
      drops.push({ assignment: a, content: c, location: l });
      seen.add(a.locationId);
      if (drops.length >= 10) break;
    }
    res.json(drops);
  });

  // ── Unlocked sessions ─────────────────────────────────
  app.post("/api/unlock", async (req, res) => {
    const parsed = insertUnlockedSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const session = await storage.addUnlockedSession(parsed.data);

    const content = await storage.getContent(parsed.data.contentId);
    const location = await storage.getLocation(parsed.data.nodeId);

    if (content && location) {
      const existing = await storage.getLibraryItemByContent(parsed.data.contentId, parsed.data.userId ?? undefined);
      if (existing) {
        await storage.updateLibraryItem(existing.id, {
          unlockCount: existing.unlockCount + 1,
          lastUnlockedAt: new Date(),
        });
      } else {
        await storage.addToLibrary({
          userId: parsed.data.userId,
          contentId: content.id,
          title: content.title,
          artist: content.creator,
          mode: parsed.data.mode,
          nodeId: parsed.data.nodeId,
          locationName: location.name,
          audioUrl: content.audioUrl,
          artworkUrl: content.artworkUrl ?? "",
        });
      }
    }

    res.status(201).json(session);
  });

  app.get("/api/unlocked-sessions", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    const sessions = await storage.getUnlockedSessions(userId);
    res.json(sessions);
  });

  // ── Library ────────────────────────────────────────────
  app.get("/api/library", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    const items = await storage.getLibrary(userId);
    // Back-fill artworkUrl from the content record for items saved before the fix
    const allContents = await storage.getContents();
    const contentMap = new Map(allContents.map((c) => [c.id, c]));
    const enriched = items.map((item) => {
      if (!item.artworkUrl) {
        const content = contentMap.get(item.contentId);
        return { ...item, artworkUrl: content?.artworkUrl ?? "" };
      }
      return item;
    });
    res.json(enriched);
  });

  app.delete("/api/library/:id", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const deleted = await storage.deleteLibraryItem(req.params.id, userId);
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.json({ success: true });
  });

  // ── Friends ────────────────────────────────────────────

  app.get("/api/users/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q || q.length < 2) return res.json([]);
    const results = await storage.searchUsers(q);
    res.json(results.map(u => ({ id: u.id, username: u.email || u.id, displayName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "User" })));
  });

  app.post("/api/friends/request", async (req, res) => {
    const parsed = insertFriendshipSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const existing = await storage.getFriendship(parsed.data.senderId, parsed.data.receiverId);
    if (existing) return res.status(409).json({ message: "Friend request already exists", friendship: existing });
    const f = await storage.sendFriendRequest(parsed.data);
    res.status(201).json(f);
  });

  app.get("/api/friends", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const friends = await storage.getFriends(userId);
    res.json(friends);
  });

  app.get("/api/friends/pending", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const pending = await storage.getPendingRequests(userId);
    res.json(pending);
  });

  app.get("/api/friends/sent", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const sent = await storage.getSentRequests(userId);
    res.json(sent);
  });

  app.patch("/api/friends/:id/accept", async (req, res) => {
    const updated = await storage.updateFriendshipStatus(req.params.id, "accepted");
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json(updated);
  });

  app.patch("/api/friends/:id/decline", async (req, res) => {
    const updated = await storage.updateFriendshipStatus(req.params.id, "declined");
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json(updated);
  });

  app.delete("/api/friends/:id", async (req, res) => {
    await storage.deleteFriendship(req.params.id);
    res.status(204).send();
  });

  // ── User Status ────────────────────────────────────────

  app.get("/api/status/:userId", async (req, res) => {
    const s = await storage.getStatus(req.params.userId);
    res.json(s ?? null);
  });

  app.put("/api/status", async (req, res) => {
    const parsed = insertUserStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const s = await storage.upsertStatus({ ...parsed.data, isOnline: req.body.isOnline });
    res.json(s);
  });

  app.get("/api/friends/statuses", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const friends = await storage.getFriends(userId);
    const friendIds = friends.map(f => f.senderId === userId ? f.receiverId : f.senderId);
    const statuses = await storage.getFriendsStatuses(friendIds);
    res.json(statuses);
  });

  // ── Circle Playback State (persisted to DB) ──

  app.put("/api/circles/:chatId/playback", async (req, res) => {
    const { chatId } = req.params;
    const { playing, currentTime, hostId } = req.body;
    await storage.upsertPlaybackState(chatId, { playing: !!playing, currentTime: currentTime || 0, hostId });
    res.json({ ok: true });
  });

  app.get("/api/circles/:chatId/playback", async (req, res) => {
    const state = await storage.getPlaybackState(req.params.chatId);
    if (!state) return res.json({ playing: false, currentTime: 0, updatedAt: 0, hostId: null });
    res.json({ playing: state.playing, currentTime: state.currentTime, updatedAt: state.updatedAt ? new Date(state.updatedAt).getTime() : 0, hostId: state.hostId });
  });

  app.delete("/api/circles/:chatId/playback", async (_req, res) => {
    await storage.deletePlaybackState(_req.params.chatId);
    res.status(204).send();
  });

  // ── Listen Chats ───────────────────────────────────────

  app.post("/api/listen-chats", async (req, res) => {
    const parsed = insertListenChatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const chat = await storage.createListenChat(parsed.data);
    await storage.joinListenChat({
      chatId: chat.id,
      userId: parsed.data.createdBy,
      displayName: req.body.displayName || "Host",
    });

    const hostId = parsed.data.createdBy;
    const hostName = req.body.displayName || "Someone";
    const friends = await storage.getFriends(hostId);
    const friendIds = friends.map(f => f.senderId === hostId ? f.receiverId : f.senderId);
    for (const friendId of friendIds) {
      try {
        await storage.createNotification({
          userId: friendId,
          type: "circle_started",
          title: `${hostName} started a Circle`,
          message: `Playing "${chat.contentTitle}" by ${chat.contentArtist}`,
          circleId: chat.id,
          fromUserId: hostId,
          fromDisplayName: hostName,
        });
      } catch {}
    }

    res.status(201).json(chat);
  });

  app.get("/api/listen-chats", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    if (userId) {
      const chats = await storage.getUserListenChats(userId);
      return res.json(chats);
    }
    const chats = await storage.getActiveListenChats();
    res.json(chats);
  });

  app.get("/api/listen-chats/:id", async (req, res) => {
    const chat = await storage.getListenChat(req.params.id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const members = await storage.getListenChatMembers(req.params.id);
    res.json({ ...chat, members });
  });

  app.post("/api/listen-chats/:id/join", async (req, res) => {
    const chat = await storage.getListenChat(req.params.id);
    if (!chat || !chat.isActive) return res.status(404).json({ message: "Chat not found or closed" });
    const members = await storage.getListenChatMembers(req.params.id);
    if (members.length >= (chat.maxMembers || 20)) {
      return res.status(403).json({ message: "Circle is full" });
    }
    if (members.some(m => m.userId === req.body.userId)) {
      return res.json(members.find(m => m.userId === req.body.userId));
    }
    const member = await storage.joinListenChat({
      chatId: req.params.id,
      userId: req.body.userId,
      displayName: req.body.displayName || "Listener",
    });
    res.json(member);
  });

  app.post("/api/listen-chats/:id/leave", async (req, res) => {
    await storage.leaveListenChat(req.params.id, req.body.userId);
    res.status(204).send();
  });

  app.post("/api/listen-chats/:id/close", async (req, res) => {
    await storage.closeListenChat(req.params.id);
    res.status(204).send();
  });

  // ── Chat Messages ──────────────────────────────────────

  app.get("/api/listen-chats/:id/messages", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await storage.getMessages(req.params.id, limit);
    res.json(messages.reverse());
  });

  app.post("/api/listen-chats/:id/messages", async (req, res) => {
    const data = {
      chatId: req.params.id,
      userId: req.body.userId,
      displayName: req.body.displayName || "Anonymous",
      message: req.body.message,
    };
    const parsed = insertChatMessageSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const msg = await storage.sendMessage(parsed.data);
    res.status(201).json(msg);
  });

  // ── Shared Library (find friends with common songs) ──

  app.get("/api/friends/shared-library", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const friends = await storage.getFriends(userId);
    const friendIds = friends.map(f => f.senderId === userId ? f.receiverId : f.senderId);
    if (!friendIds.length) return res.json([]);

    const myLibrary = await storage.getLibrary(userId);
    const myContentIds = new Set(myLibrary.map(l => l.contentId));

    const sharedItems: Array<{
      friendId: string;
      friendName: string;
      sharedContent: Array<{ contentId: string; title: string; artist: string; audioUrl: string }>;
    }> = [];

    for (const fid of friendIds) {
      const friendLibrary = await storage.getLibrary(fid);
      const shared = friendLibrary.filter(l => myContentIds.has(l.contentId));
      if (shared.length > 0) {
        const status = await storage.getStatus(fid);
        sharedItems.push({
          friendId: fid,
          friendName: status?.displayName || fid,
          sharedContent: shared.map(s => ({
            contentId: s.contentId,
            title: s.title,
            artist: s.artist,
            audioUrl: s.audioUrl,
          })),
        });
      }
    }

    res.json(sharedItems);
  });

  // ── Analytics ────────────────────────────────────────
  app.get("/api/analytics", async (_req, res) => {
    const [allUnlocks, allLibrary, allContents, allLocations, allAssignments] = await Promise.all([
      storage.getUnlockedSessions(),
      storage.getLibrary(),
      storage.getContents(),
      storage.getLocations(),
      storage.getAssignments(),
    ]);

    const now = new Date();
    const dayMs = 86400000;

    const unlocksByNode: Record<string, { name: string; total: number; today: number; thisWeek: number }> = {};
    for (const loc of allLocations) {
      unlocksByNode[loc.id] = { name: loc.name, total: 0, today: 0, thisWeek: 0 };
    }
    for (const u of allUnlocks) {
      const entry = unlocksByNode[u.nodeId];
      if (entry) {
        entry.total++;
        const age = now.getTime() - new Date(u.unlockedAt).getTime();
        if (age < dayMs) entry.today++;
        if (age < dayMs * 7) entry.thisWeek++;
      }
    }

    const unlocksByContent: Record<string, { title: string; creator: string; total: number }> = {};
    for (const c of allContents) {
      unlocksByContent[c.id] = { title: c.title, creator: c.creator, total: 0 };
    }
    for (const u of allUnlocks) {
      const entry = unlocksByContent[u.contentId];
      if (entry) entry.total++;
    }

    const hourBuckets: number[] = new Array(24).fill(0);
    const dayBuckets: number[] = new Array(7).fill(0);
    const last7Days: { date: string; unlocks: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      last7Days.push({ date: label, unlocks: 0 });
    }

    for (const u of allUnlocks) {
      const d = new Date(u.unlockedAt);
      hourBuckets[d.getHours()]++;
      const dayDiff = Math.floor((now.getTime() - d.getTime()) / dayMs);
      if (dayDiff < 7) {
        dayBuckets[6 - dayDiff]++;
        last7Days[6 - dayDiff].unlocks++;
      }
    }

    const hourlyData = hourBuckets.map((count, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      unlocks: count,
    }));

    const uniqueUsers = new Set(allUnlocks.map(u => u.userId).filter(Boolean));
    const uniqueUsersToday = new Set(
      allUnlocks.filter(u => now.getTime() - new Date(u.unlockedAt).getTime() < dayMs).map(u => u.userId).filter(Boolean)
    );

    const modeBreakdown = { discover: 0, park: 0 };
    for (const u of allUnlocks) {
      if (u.mode === "discover") modeBreakdown.discover++;
      else if (u.mode === "park") modeBreakdown.park++;
    }

    const topSongs = Object.entries(unlocksByContent)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const nodeStats = Object.entries(unlocksByNode)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);

    res.json({
      overview: {
        totalUnlocks: allUnlocks.length,
        totalContent: allContents.length,
        totalLocations: allLocations.length,
        totalActiveAssignments: allAssignments.filter(a => {
          const s = new Date(a.startAt).getTime();
          const e = new Date(a.endAt).getTime();
          return now.getTime() >= s && now.getTime() <= e;
        }).length,
        totalLibraryItems: allLibrary.length,
        uniqueUsers: uniqueUsers.size,
        uniqueUsersToday: uniqueUsersToday.size,
        unlocksToday: allUnlocks.filter(u => now.getTime() - new Date(u.unlockedAt).getTime() < dayMs).length,
        unlocksThisWeek: allUnlocks.filter(u => now.getTime() - new Date(u.unlockedAt).getTime() < dayMs * 7).length,
      },
      modeBreakdown,
      hourlyData,
      last7Days,
      topSongs,
      nodeStats,
    });
  });

  // ── Seed endpoint (development only) ──────────────────
  app.post("/api/seed", async (_req, res) => {
    const existingLocs = await storage.getLocations();
    if (existingLocs.length > 0) {
      return res.json({ message: "Already seeded", locations: existingLocs.length });
    }

    const now = new Date();
    const start1 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);
    const end1 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5);
    const start2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6);
    const end2 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1);

    const locs = await Promise.all([
      storage.createLocation({ name: "Union Square Node", description: "A dense corner of the city—street sound, steps, and motion.", lat: 37.787994, lng: -122.407437, isPermanent: true }),
      storage.createLocation({ name: "Dolores Park Crest", description: "Wind, laughter, and the skyline. A Park-mode anchor.", lat: 37.759615, lng: -122.4269, isPermanent: false }),
      storage.createLocation({ name: "Ferry Building Arcade", description: "Footsteps and echoes—an indoor pulse with coastal light.", lat: 37.7955, lng: -122.3937, isPermanent: true }),
      storage.createLocation({ name: "Lake Merritt Steps", description: "Open water energy and percussion from the path.", lat: 37.8014, lng: -122.2585, isPermanent: false }),
    ]);

    const conts = await Promise.all([
      storage.createContent({ title: "Gleam (Preview)", creator: "EDØR Sessions", description: "A bright minute—built for walking.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", artworkSeed: "gleam" }),
      storage.createContent({ title: "Night Transit (Preview)", creator: "Local Cut", description: "Low-end pulse and glass reflections.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", artworkSeed: "transit" }),
      storage.createContent({ title: "Park Air (Preview)", creator: "Ambient Notes", description: "A slow drift to match the trees.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", artworkSeed: "park" }),
      storage.createContent({ title: "Concrete Bloom (Preview)", creator: "EDØR Field", description: "Percussive texture, city bloom.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", artworkSeed: "bloom" }),
      storage.createContent({ title: "Harbor Light (Preview)", creator: "Dockside", description: "Bright chords and salt air.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", artworkSeed: "harbor" }),
    ]);

    await Promise.all([
      storage.createAssignment({ locationId: locs[0].id, mode: "discover", contentId: conts[1].id, startAt: start1, endAt: end1 }),
      storage.createAssignment({ locationId: locs[0].id, mode: "park", contentId: conts[0].id, startAt: start2, endAt: end2 }),
      storage.createAssignment({ locationId: locs[1].id, mode: "park", contentId: conts[2].id, startAt: start1, endAt: end1 }),
      storage.createAssignment({ locationId: locs[2].id, mode: "discover", contentId: conts[3].id, startAt: start1, endAt: end1 }),
      storage.createAssignment({ locationId: locs[3].id, mode: "discover", contentId: conts[4].id, startAt: start2, endAt: end1 }),
    ]);

    res.json({ message: "Seeded successfully", locations: locs.length, contents: conts.length });
  });

  // ── Seed social data (development only) ────────────────
  app.post("/api/seed-social", async (req, res) => {
    const callerUserId = (req.body.userId as string) || "demo-you";
    const callerDisplayName = (req.body.displayName as string) || "Pulse User";

    const existingFriends = await storage.getFriends(callerUserId);
    if (existingFriends.length > 0) {
      return res.json({ message: "Social data already seeded" });
    }

    const demoUsers = await Promise.all([
      authStorage.upsertUser({ id: "demo-maya", email: "maya@edor.app", firstName: "Maya", lastName: "Chen" }),
      authStorage.upsertUser({ id: "demo-jax", email: "jax@edor.app", firstName: "Jax", lastName: "Rivera" }),
      authStorage.upsertUser({ id: "demo-luna", email: "luna@edor.app", firstName: "Luna", lastName: "Park" }),
      authStorage.upsertUser({ id: "demo-kai", email: "kai@edor.app", firstName: "Kai", lastName: "Nakamura" }),
      authStorage.upsertUser({ id: "demo-zoe", email: "zoe@edor.app", firstName: "Zoe", lastName: "Echo" }),
    ]);

    let myUser = await storage.getUser(callerUserId);
    if (!myUser) {
      myUser = await authStorage.upsertUser({ id: callerUserId, email: `${callerUserId}@edor.app`, firstName: callerDisplayName, lastName: "" });
    }

    await Promise.all([
      storage.sendFriendRequest({ senderId: demoUsers[0].id, receiverId: myUser.id }),
      storage.sendFriendRequest({ senderId: demoUsers[1].id, receiverId: myUser.id }),
      storage.sendFriendRequest({ senderId: demoUsers[2].id, receiverId: myUser.id }),
    ]);

    const f1 = await storage.getFriendship(demoUsers[0].id, myUser.id);
    const f2 = await storage.getFriendship(demoUsers[1].id, myUser.id);
    if (f1) await storage.updateFriendshipStatus(f1.id, "accepted");
    if (f2) await storage.updateFriendshipStatus(f2.id, "accepted");

    const allContents = await storage.getContents();

    await Promise.all([
      storage.upsertStatus({
        userId: demoUsers[0].id, displayName: "Maya Chen",
        currentContentId: allContents[0]?.id, currentContentTitle: allContents[0]?.title,
        currentContentArtist: allContents[0]?.creator, statusText: "Exploring Union Square vibes",
      }),
      storage.upsertStatus({
        userId: demoUsers[1].id, displayName: "Jax Rivera",
        currentContentId: allContents[1]?.id, currentContentTitle: allContents[1]?.title,
        currentContentArtist: allContents[1]?.creator, statusText: "Night transit on repeat",
      }),
      storage.upsertStatus({
        userId: demoUsers[2].id, displayName: "Luna Park",
        statusText: "Looking for new drops",
      }),
      storage.upsertStatus({
        userId: demoUsers[3].id, displayName: "Kai Nakamura",
        currentContentId: allContents[2]?.id, currentContentTitle: allContents[2]?.title,
        currentContentArtist: allContents[2]?.creator, statusText: "Drifting at the park",
        isOnline: false,
      }),
      storage.upsertStatus({
        userId: myUser.id, displayName: callerDisplayName,
        statusText: "Just started exploring",
      }),
    ]);

    if (allContents.length >= 3) {
      await Promise.all([
        storage.addToLibrary({ userId: demoUsers[0].id, contentId: allContents[0].id, title: allContents[0].title, artist: allContents[0].creator, mode: "discover", nodeId: "seed", locationName: "Union Square", audioUrl: allContents[0].audioUrl, artworkUrl: "" }),
        storage.addToLibrary({ userId: demoUsers[0].id, contentId: allContents[1].id, title: allContents[1].title, artist: allContents[1].creator, mode: "discover", nodeId: "seed", locationName: "Ferry Building", audioUrl: allContents[1].audioUrl, artworkUrl: "" }),
        storage.addToLibrary({ userId: demoUsers[1].id, contentId: allContents[1].id, title: allContents[1].title, artist: allContents[1].creator, mode: "discover", nodeId: "seed", locationName: "Union Square", audioUrl: allContents[1].audioUrl, artworkUrl: "" }),
        storage.addToLibrary({ userId: demoUsers[1].id, contentId: allContents[2].id, title: allContents[2].title, artist: allContents[2].creator, mode: "park", nodeId: "seed", locationName: "Dolores Park", audioUrl: allContents[2].audioUrl, artworkUrl: "" }),
        storage.addToLibrary({ userId: myUser.id, contentId: allContents[0].id, title: allContents[0].title, artist: allContents[0].creator, mode: "discover", nodeId: "seed", locationName: "Union Square", audioUrl: allContents[0].audioUrl, artworkUrl: "" }),
        storage.addToLibrary({ userId: myUser.id, contentId: allContents[1].id, title: allContents[1].title, artist: allContents[1].creator, mode: "discover", nodeId: "seed", locationName: "Ferry Building", audioUrl: allContents[1].audioUrl, artworkUrl: "" }),
      ]);

      const chat = await storage.createListenChat({
        name: "Night Transit Session",
        contentId: allContents[1].id,
        contentTitle: allContents[1].title,
        contentArtist: allContents[1].creator,
        audioUrl: allContents[1].audioUrl,
        createdBy: demoUsers[0].id,
      });

      await storage.joinListenChat({ chatId: chat.id, userId: demoUsers[1].id, displayName: "Jax Rivera" });
      await storage.sendMessage({ chatId: chat.id, userId: demoUsers[0].id, displayName: "Maya Chen", message: "This track hits different at night" });
      await storage.sendMessage({ chatId: chat.id, userId: demoUsers[1].id, displayName: "Jax Rivera", message: "Facts. The bass line is incredible" });
    }

    res.json({ message: "Social data seeded", users: demoUsers.length + 1, myUserId: myUser.id });
  });

  // ── Notifications ──────────────────────────────────────

  app.get("/api/notifications", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const items = await storage.getNotifications(userId);
    res.json(items);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    await storage.markNotificationRead(req.params.id);
    res.status(204).send();
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    const userId = req.body.userId as string;
    if (!userId) return res.status(400).json({ message: "userId required" });
    await storage.markAllNotificationsRead(userId);
    res.status(204).send();
  });

  // ── Profiles ──────────────────────────────────────────────
  app.get("/api/profile/creator/:name", async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const data = await storage.getCreatorProfile(name);
    res.json(data);
  });

  app.get("/api/profile/user/:userId", async (req, res) => {
    const data = await storage.getUserProfile(req.params.userId);
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json(data);
  });

  app.patch("/api/profile/bio", async (req, res) => {
    const { userId, bio } = req.body as { userId?: string; bio?: string };
    if (!userId) return res.status(400).json({ message: "userId required" });
    const updated = await storage.updateUserBio(userId, bio ?? "");
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  });

  return httpServer;
}
