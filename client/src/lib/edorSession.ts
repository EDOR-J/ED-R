import type { PulseLocation, PulseMode } from "@/lib/edorStore";

export type UnlockedSession = {
  id: string;
  nodeId: string;
  contentId: string;
  mode: PulseMode;
  unlockedAt: string;
};

export type RoomEvent = 
  | { type: 'PLAY', at: number, timestamp: number }
  | { type: 'PAUSE', at: number, timestamp: number }
  | { type: 'SEEK', at: number, timestamp: number };

export type ListeningRoom = {
  id: string; // nodeId-contentId-window
  nodeId: string;
  contentId: string;
  expiresAt: string;
  hostId: string; // current user for mockup
  lastEvent?: RoomEvent;
};

export type UnlockedItem = {
  id: string;
  contentId: string;
  title: string;
  artist: string;
  mode: PulseMode;
  nodeId: string;
  locationName: string;
  unlockedAt: string;
  lastUnlockedAt?: string;
  unlockCount: number;
  audioUrl: string;
  artworkUrl: string;
};

export type PulseSession = {
  mode: PulseMode;
  lastLocationId?: string;
  selectedLocationId?: string;
  lastContentId?: string;
  unlockedSessions: UnlockedSession[];
  activeRoom?: ListeningRoom;
  library: UnlockedItem[];
  blockedUserIds: string[];
  reports: Array<{
    id: string;
    roomId: string;
    nodeId: string;
    timestamp: string;
    reporterId: string;
    reportedId: string;
    reason: string;
  }>;
};

const KEY = "edor:pulse:session:v1";

export function saveSession(s: PulseSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): PulseSession {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as PulseSession;
      if (!s.library) s.library = [];
      if (!s.unlockedSessions) s.unlockedSessions = [];
      // Handle room expiration
      if (s.activeRoom && new Date(s.activeRoom.expiresAt) < new Date()) {
        delete s.activeRoom;
        saveSession(s);
      }
      return s;
    }
  } catch {
    // ignore
  }
  const init: PulseSession = { mode: "discover", unlockedSessions: [], library: [], blockedUserIds: [], reports: [] };
  saveSession(init);
  return init;
}

export function addToLibrary(item: Omit<UnlockedItem, "id" | "unlockCount">) {
  const s = loadSession();
  
  // Find existing entry for this contentId
  const existingIndex = s.library.findIndex(i => i.contentId === item.contentId);
  
  if (existingIndex > -1) {
    const existing = s.library[existingIndex];
    const updated: UnlockedItem = {
      ...existing,
      ...item,
      lastUnlockedAt: new Date().toISOString(),
      unlockCount: (existing.unlockCount || 1) + 1
    };
    
    const nextLibrary = [...s.library];
    nextLibrary[existingIndex] = updated;
    const next = { ...s, library: nextLibrary };
    saveSession(next);
    return updated;
  }

  const newItem: UnlockedItem = {
    ...item,
    id: Math.random().toString(36).slice(2),
    unlockCount: 1
  };
  
  const next = { ...s, library: [newItem, ...s.library] };
  saveSession(next);
  return newItem;
}

export function updateRoomEvent(event: RoomEvent) {
  const s = loadSession();
  if (s.activeRoom) {
    s.activeRoom.lastEvent = event;
    saveSession(s);
  }
}

export function startRoom(nodeId: string, contentId: string) {
  const s = loadSession();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 60);
  
  // timeWindow is the current hour bucket
  const timeWindow = Math.floor(Date.now() / (60 * 60 * 1000));
  
  const room: ListeningRoom = {
    id: `${nodeId}-${contentId}-${timeWindow}`,
    nodeId,
    contentId,
    expiresAt: expiresAt.toISOString(),
    hostId: "me"
  };
  
  const next = { ...s, activeRoom: room };
  saveSession(next);
  return room;
}

export function endRoom() {
  const s = loadSession();
  const next = { ...s };
  delete next.activeRoom;
  saveSession(next);
}

export function addUnlockedSession(nodeId: string, contentId: string, mode: PulseMode) {
  const s = loadSession();
  const session: UnlockedSession = {
    id: Math.random().toString(36).slice(2),
    nodeId,
    contentId,
    mode,
    unlockedAt: new Date().toISOString()
  };
  const next = { 
    ...s, 
    lastContentId: contentId,
    selectedLocationId: nodeId,
    unlockedSessions: [...s.unlockedSessions, session] 
  };
  saveSession(next);
  return session;
}

export function getLatestSession() {
  const s = loadSession();
  if (!s.unlockedSessions || s.unlockedSessions.length === 0) return null;
  return s.unlockedSessions[s.unlockedSessions.length - 1];
}

export function setMode(mode: PulseMode) {
  const s = loadSession();
  const next = { ...s, mode };
  saveSession(next);
  return next;
}

export function setSelectedLocation(location: PulseLocation | null) {
  const s = loadSession();
  const next = { ...s, selectedLocationId: location?.id };
  saveSession(next);
  return next;
}

export function setLastContentId(contentId: string | undefined) {
  const s = loadSession();
  const next = { ...s, lastContentId: contentId };
  saveSession(next);
  return next;
}

export function blockUser(userId: string) {
  const s = loadSession();
  if (!s.blockedUserIds.includes(userId)) {
    s.blockedUserIds.push(userId);
    saveSession(s);
  }
}

export function reportUser(report: { roomId: string; nodeId: string; reportedId: string; reason: string }) {
  const s = loadSession();
  const newReport = {
    ...report,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    reporterId: "me"
  };
  s.reports.push(newReport);
  saveSession(s);
}
