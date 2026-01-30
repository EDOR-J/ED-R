import type { PulseLocation, PulseMode } from "@/lib/edorStore";

export type PulseSession = {
  mode: PulseMode;
  lastLocationId?: string;
  selectedLocationId?: string;
  lastContentId?: string;
};

const KEY = "edor:pulse:session:v1";

export function loadSession(): PulseSession {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PulseSession;
  } catch {
    // ignore
  }
  const init: PulseSession = { mode: "discover" };
  saveSession(init);
  return init;
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
