export type PulseMode = "discover" | "park";

export type PulseLocation = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  isPermanent: boolean;
};

export type PulseContent = {
  id: string;
  title: string;
  creator: string;
  description: string;
  audioUrl: string;
  artworkSeed?: string;
};

export type PulseAssignment = {
  id: string;
  locationId: string;
  mode: PulseMode;
  contentId: string;
  startAt: string; // ISO
  endAt: string; // ISO
  createdAt: string; // ISO
};

export type EdorData = {
  locations: PulseLocation[];
  contents: PulseContent[];
  assignments: PulseAssignment[];
};

const STORAGE_KEY = "edor:pulse:data:v1";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function toIso(d: Date) {
  return d.toISOString();
}

export function isWithinWindow(iso: string, startIso: string, endIso: string) {
  const t = new Date(iso).getTime();
  return t >= new Date(startIso).getTime() && t <= new Date(endIso).getTime();
}

export function loadEdorData(): EdorData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EdorData;
  } catch {
    // ignore
  }
  const seed = seedData();
  saveEdorData(seed);
  return seed;
}

export function saveEdorData(data: EdorData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addLocation(partial: Omit<PulseLocation, "id">) {
  const data = loadEdorData();
  const loc: PulseLocation = { id: uid("loc"), ...partial };
  const next = { ...data, locations: [loc, ...data.locations] };
  saveEdorData(next);
  return loc;
}

export function updateLocation(id: string, patch: Partial<Omit<PulseLocation, "id">>) {
  const data = loadEdorData();
  const next = {
    ...data,
    locations: data.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)),
  };
  saveEdorData(next);
  return next.locations.find((l) => l.id === id) ?? null;
}

export function deleteLocation(id: string) {
  const data = loadEdorData();
  const next = {
    ...data,
    locations: data.locations.filter((l) => l.id !== id),
    assignments: data.assignments.filter((a) => a.locationId !== id),
  };
  saveEdorData(next);
}

export function addContent(partial: Omit<PulseContent, "id">) {
  const data = loadEdorData();
  const c: PulseContent = { id: uid("c"), ...partial };
  const next = { ...data, contents: [c, ...data.contents] };
  saveEdorData(next);
  return c;
}

export function updateContent(id: string, patch: Partial<Omit<PulseContent, "id">>) {
  const data = loadEdorData();
  const next = {
    ...data,
    contents: data.contents.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
  saveEdorData(next);
  return next.contents.find((c) => c.id === id) ?? null;
}

export function deleteContent(id: string) {
  const data = loadEdorData();
  const next = {
    ...data,
    contents: data.contents.filter((c) => c.id !== id),
    assignments: data.assignments.filter((a) => a.contentId !== id),
  };
  saveEdorData(next);
}

export function addAssignment(partial: Omit<PulseAssignment, "id" | "createdAt">) {
  const data = loadEdorData();
  const a: PulseAssignment = { id: uid("a"), createdAt: nowIso(), ...partial };
  const next = { ...data, assignments: [a, ...data.assignments] };
  saveEdorData(next);
  return a;
}

export function updateAssignment(id: string, patch: Partial<Omit<PulseAssignment, "id" | "createdAt">>) {
  const data = loadEdorData();
  const next = {
    ...data,
    assignments: data.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  };
  saveEdorData(next);
  return next.assignments.find((a) => a.id === id) ?? null;
}

export function deleteAssignment(id: string) {
  const data = loadEdorData();
  const next = { ...data, assignments: data.assignments.filter((a) => a.id !== id) };
  saveEdorData(next);
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dphi = ((b.lat - a.lat) * Math.PI) / 180;
  const dlambda = ((b.lng - a.lng) * Math.PI) / 180;

  const s =
    Math.sin(dphi / 2) * Math.sin(dphi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) * Math.sin(dlambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

export function getNearestLocation(coords: { lat: number; lng: number }, locations: PulseLocation[]) {
  if (!locations.length) return null;
  let best = locations[0];
  let bestD = haversineMeters(coords, { lat: best.lat, lng: best.lng });
  for (const l of locations.slice(1)) {
    const d = haversineMeters(coords, { lat: l.lat, lng: l.lng });
    if (d < bestD) {
      best = l;
      bestD = d;
    }
  }
  return { location: best, distanceMeters: bestD };
}

export function getActiveAssignments(data: EdorData, atIso = nowIso()) {
  return data.assignments
    .filter((a) => isWithinWindow(atIso, a.startAt, a.endAt))
    .sort((x, y) => new Date(y.startAt).getTime() - new Date(x.startAt).getTime());
}

export function getThisWeeksDrops(data: EdorData, limit = 5, atIso = nowIso()) {
  const active = getActiveAssignments(data, atIso);
  const seen = new Set<string>();
  const out: Array<{
    assignment: PulseAssignment;
    content: PulseContent;
    location: PulseLocation;
  }> = [];

  for (const a of active) {
    if (seen.has(a.contentId)) continue;
    const c = data.contents.find((x) => x.id === a.contentId);
    const l = data.locations.find((x) => x.id === a.locationId);
    if (!c || !l) continue;
    out.push({ assignment: a, content: c, location: l });
    seen.add(a.contentId);
    if (out.length >= limit) break;
  }

  return out;
}

export function pickContentForLocationMode(
  data: EdorData,
  args: { locationId: string; mode: PulseMode; atIso?: string },
) {
  const at = args.atIso ?? nowIso();
  const active = data.assignments
    .filter(
      (a) =>
        a.locationId === args.locationId &&
        a.mode === args.mode &&
        isWithinWindow(at, a.startAt, a.endAt),
    )
    .sort((x, y) => new Date(y.startAt).getTime() - new Date(x.startAt).getTime());

  const a = active[0];
  if (!a) return null;
  const c = data.contents.find((x) => x.id === a.contentId);
  if (!c) return null;
  return { assignment: a, content: c };
}

function seedData(): EdorData {
  const now = new Date();
  const start1 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);
  const end1 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5);
  const start2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6);
  const end2 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1);

  const locations: PulseLocation[] = [
    {
      id: "loc_union",
      name: "Union Square Node",
      description: "A dense corner of the city—street sound, steps, and motion.",
      lat: 37.787994,
      lng: -122.407437,
      isPermanent: true,
    },
    {
      id: "loc_dolores",
      name: "Dolores Park Crest",
      description: "Wind, laughter, and the skyline. A Park-mode anchor.",
      lat: 37.759615,
      lng: -122.4269,
      isPermanent: false,
    },
    {
      id: "loc_ferry",
      name: "Ferry Building Arcade",
      description: "Footsteps and echoes—an indoor pulse with coastal light.",
      lat: 37.7955,
      lng: -122.3937,
      isPermanent: true,
    },
    {
      id: "loc_oak",
      name: "Lake Merritt Steps",
      description: "Open water energy and percussion from the path.",
      lat: 37.8014,
      lng: -122.2585,
      isPermanent: false,
    },
  ];

  const contents: PulseContent[] = [
    {
      id: "c_01",
      title: "Gleam (Preview)",
      creator: "EDØR Sessions",
      description: "A bright minute—built for walking.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      artworkSeed: "gleam",
    },
    {
      id: "c_02",
      title: "Night Transit (Preview)",
      creator: "Local Cut",
      description: "Low-end pulse and glass reflections.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      artworkSeed: "transit",
    },
    {
      id: "c_03",
      title: "Park Air (Preview)",
      creator: "Ambient Notes",
      description: "A slow drift to match the trees.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      artworkSeed: "park",
    },
    {
      id: "c_04",
      title: "Concrete Bloom (Preview)",
      creator: "EDØR Field",
      description: "Percussive texture, city bloom.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      artworkSeed: "bloom",
    },
    {
      id: "c_05",
      title: "Harbor Light (Preview)",
      creator: "Dockside",
      description: "Bright chords and salt air.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      artworkSeed: "harbor",
    },
  ];

  const assignments: PulseAssignment[] = [
    {
      id: "a_01",
      locationId: "loc_union",
      mode: "discover",
      contentId: "c_02",
      startAt: toIso(start1),
      endAt: toIso(end1),
      createdAt: nowIso(),
    },
    {
      id: "a_02",
      locationId: "loc_union",
      mode: "park",
      contentId: "c_01",
      startAt: toIso(start2),
      endAt: toIso(end2),
      createdAt: nowIso(),
    },
    {
      id: "a_03",
      locationId: "loc_dolores",
      mode: "park",
      contentId: "c_03",
      startAt: toIso(start1),
      endAt: toIso(end1),
      createdAt: nowIso(),
    },
    {
      id: "a_04",
      locationId: "loc_ferry",
      mode: "discover",
      contentId: "c_04",
      startAt: toIso(start1),
      endAt: toIso(end1),
      createdAt: nowIso(),
    },
    {
      id: "a_05",
      locationId: "loc_oak",
      mode: "discover",
      contentId: "c_05",
      startAt: toIso(start2),
      endAt: toIso(end1),
      createdAt: nowIso(),
    },
  ];

  return { locations, contents, assignments };
}
