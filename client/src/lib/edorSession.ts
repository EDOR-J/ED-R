import type { PulseLocation, PulseMode } from "@/lib/edorStore";

export type UnlockedSession = {
  id: string;
  nodeId: string;
  contentId: string;
  mode: PulseMode;
  timestamp: string;
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

export type PulseSession = {
  mode: PulseMode;
  lastLocationId?: string;
  selectedLocationId?: string;
  lastContentId?: string;
  unlockedSessions: UnlockedSession[];
  activeRoom?: ListeningRoom;
};

const KEY = "edor:pulse:session:v1";

export function loadSession(): PulseSession {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as PulseSession;
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
  const init: PulseSession = { mode: "discover", unlockedSessions: [] };
  saveSession(init);
  return init;
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
  
  const room: ListeningRoom = {
    id: `${nodeId}-${contentId}-${Math.floor(Date.now() / (60 * 60 * 1000))}`,
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
    timestamp: new Date().toISOString()
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
  return s.unlockedSessions[s.unlockedSessions.length - 1];
}

export function saveSession(s: PulseSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
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
