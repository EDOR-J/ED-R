import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertLocationSchema, insertContentSchema, insertAssignmentSchema, insertUnlockedSessionSchema, insertLibraryItemSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
    const parsed = insertAssignmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const item = await storage.createAssignment(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/assignments/:id", async (req, res) => {
    const updated = await storage.updateAssignment(req.params.id, req.body);
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
      if (seen.has(a.contentId)) continue;
      const c = conts.find((x) => x.id === a.contentId);
      const l = locs.find((x) => x.id === a.locationId);
      if (!c || !l) continue;
      drops.push({ assignment: a, content: c, location: l });
      seen.add(a.contentId);
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
          artworkUrl: "",
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
    res.json(items);
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

  return httpServer;
}
