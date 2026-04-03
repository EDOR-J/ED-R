import { useEffect, useRef, useState, useCallback } from "react";
import { usePulseData, pickAllContentForLocationMode, haversineMeters, type ApiContent, type PulseMode } from "@/lib/api";
import { loadSession } from "@/lib/edorSession";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const PROXIMITY_METERS = 80;

export type NearbyNode = {
  location: { id: string; name: string; lat: number; lng: number; isPermanent: boolean | null; description: string | null };
  distanceMeters: number;
  contentCount: number;
  contents: ApiContent[];
};

export type ProximityReveal = {
  contents: ApiContent[];
  locationName: string;
  locationId: string;
  mode: string;
};

export function useProximityWatcher(enabled = true) {
  const { data } = usePulseData();
  const [nearbyNode, setNearbyNode] = useState<NearbyNode | null>(null);
  const [unlockReveal, setUnlockReveal] = useState<ProximityReveal | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const notifiedRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);

  // Request notification permission once
  useEffect(() => {
    if (!enabled) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [enabled]);

  const sendSystemNotification = useCallback((name: string, count: number, locId: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!document.hidden) return; // Only send when tab is not visible
    new Notification("EDØR — Pulse Nearby", {
      body: `You're near ${name}. ${count} track${count !== 1 ? "s" : ""} ready to unlock.`,
      icon: "/favicon.ico",
      tag: `edor-proximity-${locId}`,
      silent: false,
    });
  }, []);

  useEffect(() => {
    if (!enabled || !data || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const mode = loadSession().mode as PulseMode;

        let closest: NearbyNode | null = null;
        let closestDist = PROXIMITY_METERS + 1;

        for (const loc of data.locations) {
          if (dismissedRef.current.has(loc.id)) continue;
          const dist = haversineMeters(userCoords, { lat: loc.lat, lng: loc.lng });
          if (dist <= PROXIMITY_METERS && dist < closestDist) {
            const allPicked = pickAllContentForLocationMode(data, { locationId: loc.id, mode });
            if (allPicked.length > 0) {
              closestDist = dist;
              closest = {
                location: loc,
                distanceMeters: Math.round(dist),
                contentCount: allPicked.length,
                contents: allPicked.map((p) => p.content),
              };
            }
          }
        }

        setNearbyNode(closest);

        if (closest && !notifiedRef.current.has(closest.location.id)) {
          notifiedRef.current.add(closest.location.id);
          sendSystemNotification(closest.location.name, closest.contentCount, closest.location.id);
        }
      },
      () => {}, // silently ignore errors (user may have denied location)
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [data, enabled, sendSystemNotification]);

  const dismiss = useCallback(() => {
    if (nearbyNode) dismissedRef.current.add(nearbyNode.location.id);
    setNearbyNode(null);
  }, [nearbyNode]);

  const unlockNearby = useCallback(async () => {
    if (!nearbyNode) return;
    setIsUnlocking(true);
    const mode = loadSession().mode;
    try {
      await Promise.allSettled(
        nearbyNode.contents.map((c) =>
          apiRequest("POST", "/api/unlock", {
            nodeId: nearbyNode.location.id,
            contentId: c.id,
            mode,
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["/api/unlocked-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      dismissedRef.current.add(nearbyNode.location.id);
      setUnlockReveal({
        contents: nearbyNode.contents,
        locationName: nearbyNode.location.name,
        locationId: nearbyNode.location.id,
        mode,
      });
      setNearbyNode(null);
    } finally {
      setIsUnlocking(false);
    }
  }, [nearbyNode]);

  const clearReveal = useCallback(() => setUnlockReveal(null), []);

  return { nearbyNode, dismiss, unlockNearby, isUnlocking, unlockReveal, clearReveal };
}
