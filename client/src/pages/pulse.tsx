import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { usePulseData, useJoinListenChat, getNearestLocation, pickContentForLocationMode, pickAllContentForLocationMode, type ApiLocation, type ApiContent, type PulseMode } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { loadSession, setSelectedLocation, startRoom } from "@/lib/edorSession";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ShieldAlert, X, Music, Headphones, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Map, Overlay } from "pigeon-maps";
import { motion, AnimatePresence } from "framer-motion";

function triggerHeartbeatVibration() {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

function artworkGradient(seed: string | null) {
  if (!seed) return "linear-gradient(135deg, hsl(40,70%,25%), hsl(20,60%,15%))";
  const h = parseInt(seed, 36) % 360;
  return `linear-gradient(135deg, hsl(${h},70%,25%), hsl(${(h + 60) % 360},60%,15%))`;
}

function UnlockReveal({
  contents,
  locationName,
  locationId,
  mode,
  onDismiss,
}: {
  contents: ApiContent[];
  locationName: string;
  locationId: string;
  mode: string;
  onDismiss: () => void;
}) {
  const [, setLocation] = useLocation();

  function goToContent(contentId: string) {
    onDismiss();
    navigateWithTransition(setLocation, `/content/${contentId}?loc=${locationId}&mode=${mode}`);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92 backdrop-blur-xl overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      data-testid="overlay-unlock-reveal"
    >
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/60"
            style={{
              left: `${50 + (Math.random() - 0.5) * 60}%`,
              top: `${40 + (Math.random() - 0.5) * 50}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 }}
            transition={{ duration: 2, delay: 0.2 + Math.random() * 0.8, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        className="relative flex flex-col items-center w-full max-w-sm px-5 py-8 gap-5"
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, type: "spring", damping: 16 }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-amber-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: 2, delay: 0.4 }} />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold" data-testid="text-unlocked-label">
              {contents.length === 1 ? "Track Unlocked" : `${contents.length} Tracks Unlocked`}
            </span>
            <motion.div className="w-2 h-2 rounded-full bg-amber-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: 2, delay: 0.6 }} />
          </div>
          <p className="text-[11px] text-white/40 flex items-center gap-1">
            <MapPin className="h-3 w-3" />{locationName}
          </p>
        </div>

        {/* Track cards */}
        <div className="flex flex-col gap-2 w-full">
          {contents.map((content, i) => (
            <motion.button
              key={content.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              onClick={() => goToContent(content.id)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] active:bg-white/[0.15] border border-white/10 hover:border-amber-400/30 transition-all text-left w-full group"
              data-testid={`button-play-unlocked-${content.id}`}
            >
              {/* Artwork */}
              <div
                className="h-14 w-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10 shadow-lg"
                style={{ background: artworkGradient(content.artworkSeed) }}
              >
                {content.artworkUrl
                  ? <img src={content.artworkUrl} alt={content.title} className="h-full w-full object-cover" />
                  : <Music className="h-6 w-6 text-white/40" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight" data-testid={`text-unlocked-title-${content.id}`}>
                  {content.title}
                </p>
                <p className="text-[11px] text-white/50 truncate mt-0.5" data-testid={`text-unlocked-creator-${content.id}`}>
                  {content.creator}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Headphones className="h-4 w-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Dismiss */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onDismiss}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors mt-1"
          data-testid="button-dismiss-reveal"
        >
          Go to Library
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

type Status =
  | { state: "asking" }
  | { state: "denied"; reason?: string }
  | { state: "ready"; locationId: string; distanceMeters?: number };

export default function PulsePage() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = usePulseData();
  const session = useMemo(() => loadSession(), []);
  const joinChatMutation = useJoinListenChat();
  const { user } = useAuth();

  const locations = data?.locations ?? [];

  const [status, setStatus] = useState<Status>({ state: "asking" });
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [activeLocation, setActiveLocation] = useState<ApiLocation | null>(null);
  const [unlockReveal, setUnlockReveal] = useState<{ contents: ApiContent[]; locationName: string; locationId: string } | null>(null);


  const queryParams = new URLSearchParams(window.location.search);
  const joinCircleId = queryParams.get("joinCircle");
  const joinLocId = queryParams.get("loc");

  useEffect(() => {
    if (joinCircleId && joinLocId) {
      const location = locations.find(l => l.id === joinLocId);
      if (!location) {
        toast.error("Invalid Listening Circle");
        return;
      }

      const userId = user?.id || "guest";
      const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Guest";

      joinChatMutation.mutate({
        chatId: joinCircleId,
        userId,
        displayName,
      }, {
        onSuccess: () => {
          startRoom(joinLocId, "", { serverChatId: joinCircleId, hostId: "other" });
          toast.success(`Joined Circle at ${location.name}`);
          navigateWithTransition(setLocation, "/circle");
        },
        onError: () => {
          toast.error("Circle not found or has ended");
        },
      });
    }
  }, [joinCircleId, joinLocId, locations, setLocation]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus({ state: "denied", reason: "Geolocation is not supported by this browser." });
      return;
    }
    setStatus({ state: "asking" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        const nearest = getNearestLocation({ lat: coords[0], lng: coords[1] }, locations);
        if (!nearest) {
          setStatus({ state: "denied", reason: "No Pulse nodes found near you. Try the map below." });
          return;
        }
        setStatus({ state: "ready", locationId: nearest.location.id, distanceMeters: nearest.distanceMeters });
      },
      (err) => {
        if (err.code === 1) {
          setStatus({ state: "denied", reason: "Location permission denied. Allow it in your browser settings, or pick a node below." });
        } else if (err.code === 2) {
          setStatus({ state: "denied", reason: "Location unavailable. Check your signal and try again." });
        } else {
          setStatus({ state: "denied", reason: "Location request timed out. Try again or pick a node manually." });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [locations]);

  useEffect(() => {
    if (locations.length > 0) requestLocation();
  }, [locations]);

  const firstNode = locations[0];
  const center: [number, number] = userCoords ?? (firstNode ? [firstNode.lat, firstNode.lng] : [51.505, -0.09]);

  const handleRevealContinue = useCallback(() => {
    setUnlockReveal(null);
    navigateWithTransition(setLocation, "/library");
  }, [setLocation]);

  async function continueWith(locationId: string) {
    if (!data) return;

    const location = locations.find((l) => l.id === locationId) ?? null;
    const allPicked = pickAllContentForLocationMode(data, { locationId, mode: session.mode as PulseMode });

    if (allPicked.length === 0) {
      toast("No active drop here yet", {
        description: "Try another Pulse location or check back soon.",
      });
      return;
    }

    // Unlock all tracks in parallel (fire-and-forget, we show the reveal regardless)
    await Promise.allSettled(
      allPicked.map(({ content }) =>
        apiRequest("POST", "/api/unlock", { nodeId: locationId, contentId: content.id, mode: session.mode })
      )
    );

    triggerHeartbeatVibration();
    setUnlockReveal({
      contents: allPicked.map(({ content }) => content),
      locationName: location?.name ?? "Unknown Location",
      locationId,
    });
  }

  if (isLoading) {
    return (
      <Shell
        title="Find your Pulse"
        right={
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
            data-testid="link-back-home"
          >
            Home
          </Link>
        }
      >
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-sm text-white/60">Loading Pulse data…</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Find your Pulse"
      right={
        <Link
          href="/"
          className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
          data-testid="link-back-home"
        >
          Home
        </Link>
      }
    >
      <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10 edor-noise glass mb-6">
        <Map 
          height={400} 
          defaultCenter={center as [number, number]} 
          defaultZoom={14}
          boxClassname="edor-map"
        >
          {locations.map((loc) => {
            const isActive = activeLocation?.id === loc.id;
            return (
              <Overlay key={loc.id} anchor={[loc.lat, loc.lng]}>
                <button
                  onPointerUp={(e) => { e.stopPropagation(); setActiveLocation(loc); }}
                  style={{ transform: "translate(-50%, -100%)" }}
                  className="flex flex-col items-center gap-0.5 cursor-pointer group select-none"
                  data-testid={`button-map-node-${loc.id}`}
                >
                  <div
                    className={[
                      "w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-150",
                      isActive
                        ? "bg-amber-400 border-white scale-125 shadow-amber-400/50"
                        : "bg-black/70 border-amber-400 group-hover:scale-110"
                    ].join(" ")}
                  >
                    <MapPin className={["h-4 w-4", isActive ? "text-black" : "text-amber-400"].join(" ")} />
                  </div>
                  <div
                    className={[
                      "px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap shadow",
                      isActive ? "bg-amber-400 text-black" : "bg-black/75 text-white/80"
                    ].join(" ")}
                  >
                    {loc.name}
                  </div>
                </button>
              </Overlay>
            );
          })}
          {userCoords && (
            <Overlay anchor={userCoords}>
              <div
                style={{ transform: "translate(-50%, -50%)" }}
                className="w-3 h-3 rounded-full bg-white border-2 border-black shadow-lg"
              />
            </Overlay>
          )}
        </Map>

        <AnimatePresence>
          {activeLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 z-10"
            >
              <Card className="glass p-4 rounded-2xl relative border-white/20">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6 text-white/40"
                  onClick={() => setActiveLocation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <h4 className="font-bold text-white pr-8">{activeLocation.name}</h4>
                <p className="text-xs text-white/60 mt-1">{activeLocation.description}</p>
                <Button 
                  size="sm" 
                  className="w-full mt-3 h-9 rounded-xl text-xs font-bold animate-sparkle"
                  onClick={() => continueWith(activeLocation.id)}
                >
                  Pulse here
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Card className="edor-noise glass rounded-3xl p-5 space-y-4" data-testid="card-pulse-status">
        {/* GPS status banner */}
        {status.state === "asking" && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0 animate-pulse">
              <MapPin className="h-4 w-4 text-white/40" />
            </div>
            <div>
              <p className="text-sm text-white/80" data-testid="text-asking">Requesting your location…</p>
              <p className="text-xs text-white/40">Or tap a node below to pulse manually</p>
            </div>
          </div>
        )}

        {status.state === "ready" && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2" data-testid="text-nearest-label">
              Nearest Pulse
            </p>
            <Button
              className="w-full h-12 rounded-2xl animate-sparkle"
              onClick={() => continueWith(status.locationId)}
              data-testid="button-unlock-nearest"
            >
              Unlock {locations.find(l => l.id === status.locationId)?.name ?? "this Pulse"}
            </Button>
          </div>
        )}

        {status.state === "denied" && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-white/10 bg-white/5 p-2 shrink-0">
              <ShieldAlert className="h-4 w-4 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Manual Selection</p>
              <p className="mt-0.5 text-xs text-white/55 leading-relaxed">
                {status.reason ?? "Choose a node below."}
              </p>
              <button
                className="mt-2 text-xs text-amber-400 underline underline-offset-2"
                onClick={requestLocation}
                data-testid="button-retry-gps"
              >
                Try GPS again
              </button>
            </div>
          </div>
        )}

        {/* Always-visible tappable node list */}
        <div data-testid="section-node-list">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2 px-0.5">
            {status.state === "ready" ? "All Nodes" : "Pulse Nodes"}
          </p>
          <div className="space-y-2">
            {locations.map((loc) => {
              const hasDrop = data
                ? !!pickContentForLocationMode(data, { locationId: loc.id, mode: session.mode as PulseMode })
                : false;
              const isNearest = status.state === "ready" && status.locationId === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => continueWith(loc.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition active:scale-[0.98]",
                    isNearest
                      ? "bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/15"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                  data-testid={`button-node-${loc.id}`}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                    isNearest
                      ? "bg-amber-400/15 border-amber-400/30"
                      : "bg-white/5 border-white/10"
                  )}>
                    <MapPin className={cn("h-4 w-4", isNearest ? "text-amber-400" : "text-white/40")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-semibold", isNearest ? "text-amber-300" : "text-white")}>
                      {loc.name}
                      {isNearest && <span className="ml-2 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">NEAREST</span>}
                    </div>
                    <div className="text-[11px] text-white/40 truncate mt-0.5">{loc.description}</div>
                  </div>
                  {hasDrop ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="text-[9px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">Live</div>
                      <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                    </div>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-white/15 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {unlockReveal && (
          <UnlockReveal
            contents={unlockReveal.contents}
            locationName={unlockReveal.locationName}
            locationId={unlockReveal.locationId}
            mode={session.mode}
            onDismiss={handleRevealContinue}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}
