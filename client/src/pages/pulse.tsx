import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePulseData, useUnlock, getNearestLocation, pickContentForLocationMode, type ApiLocation, type ApiContent, type PulseMode } from "@/lib/api";
import { loadSession, setSelectedLocation } from "@/lib/edorSession";
import { MapPin, ShieldAlert, X, Music, Headphones } from "lucide-react";
import { Map, Marker, Overlay } from "pigeon-maps";
import { motion, AnimatePresence } from "framer-motion";

function triggerHeartbeatVibration() {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

function UnlockReveal({
  content,
  locationName,
  onContinue,
}: {
  content: ApiContent;
  locationName: string;
  onContinue: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onContinue, 4000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="overlay-unlock-reveal"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/60"
            style={{
              left: `${50 + (Math.random() - 0.5) * 60}%`,
              top: `${50 + (Math.random() - 0.5) * 60}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: 2,
              delay: 0.3 + Math.random() * 0.8,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="flex flex-col items-center text-center px-8 max-w-sm"
        initial={{ scale: 0.6, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, type: "spring", damping: 15 }}
      >
        <motion.div
          className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-2xl shadow-amber-500/20 mb-6"
          initial={{ rotate: -8 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: content.artworkSeed
                ? `linear-gradient(135deg, hsl(${parseInt(content.artworkSeed, 36) % 360}, 70%, 25%), hsl(${(parseInt(content.artworkSeed, 36) + 60) % 360}, 60%, 15%))`
                : "linear-gradient(135deg, hsl(40, 70%, 25%), hsl(20, 60%, 15%))",
            }}
          >
            <Music className="h-12 w-12 text-white/50" />
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-amber-400"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.6, repeat: 2, delay: 0.5 }}
          />
          <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold">
            Content Unlocked
          </span>
          <motion.div
            className="w-2 h-2 rounded-full bg-amber-400"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.6, repeat: 2, delay: 0.7 }}
          />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          data-testid="text-unlocked-title"
        >
          {content.title}
        </motion.h2>

        <motion.p
          className="text-sm text-white/60 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          data-testid="text-unlocked-creator"
        >
          {content.creator}
        </motion.p>

        <motion.p
          className="text-xs text-white/40 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <MapPin className="inline h-3 w-3 mr-1" />
          {locationName}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-6"
        >
          <Button
            className="h-11 px-8 rounded-2xl animate-sparkle"
            onClick={onContinue}
            data-testid="button-listen-now"
          >
            <Headphones className="h-4 w-4 mr-2" />
            Listen Now
          </Button>
        </motion.div>

        <motion.p
          className="text-[10px] text-white/30 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Auto-continuing in a moment…
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

type Status =
  | { state: "asking" }
  | { state: "denied" }
  | { state: "ready"; locationId: string; distanceMeters?: number };

export default function PulsePage() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = usePulseData();
  const session = useMemo(() => loadSession(), []);
  const unlockMutation = useUnlock();

  const locations = data?.locations ?? [];
  const contents = data?.contents ?? [];

  const [status, setStatus] = useState<Status>({ state: "asking" });
  const [manualLocationId, setManualLocationId] = useState<string>("");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [activeLocation, setActiveLocation] = useState<ApiLocation | null>(null);
  const [unlockReveal, setUnlockReveal] = useState<{ content: ApiContent; locationName: string; locationId: string } | null>(null);

  useEffect(() => {
    if (locations.length > 0 && !manualLocationId) {
      setManualLocationId(locations[0]?.id ?? "");
    }
  }, [locations, manualLocationId]);

  const queryParams = new URLSearchParams(window.location.search);
  const joinRoomId = queryParams.get("join");
  const joinLocId = queryParams.get("loc");

  useEffect(() => {
    if (joinRoomId && joinLocId && userCoords) {
      const location = locations.find(l => l.id === joinLocId);
      if (!location) {
        toast.error("Invalid Listening Circle");
        return;
      }

      if (!location.isPermanent) {
        toast.error("Circles are only available at permanent Pulse locations.");
        return;
      }

      const lat1 = userCoords[0];
      const lon1 = userCoords[1];
      const lat2 = location.lat;
      const lon2 = location.lng;
      
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;

      if (distanceKm > 0.1) {
        toast.error("Circles are only available at permanent Pulse locations.");
        return;
      }

      const [nodeId, contentId] = joinRoomId.split('-');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 60);
      
      const s = loadSession();
      const room = {
        id: joinRoomId,
        nodeId,
        contentId,
        expiresAt: expiresAt.toISOString(),
        hostId: "other"
      };
      
      const next = { ...s, activeRoom: room };
      (next as any).activeRoom = room;
      localStorage.setItem("edor:pulse:session:v1", JSON.stringify(next));
      
      toast.success(`Joined Circle at ${location.name}`);
      setLocation("/circle");
    }
  }, [joinRoomId, joinLocId, userCoords, locations, setLocation]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!navigator.geolocation) {
        if (!cancelled) setStatus({ state: "denied" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
          const nearest = getNearestLocation(
            { lat: coords[0], lng: coords[1] },
            locations,
          );
          if (!nearest) {
            setStatus({ state: "denied" });
            return;
          }
          setStatus({
            state: "ready",
            locationId: nearest.location.id,
            distanceMeters: nearest.distanceMeters,
          });
        },
        () => {
          if (cancelled) return;
          setStatus({ state: "denied" });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
      );
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [locations]);

  const center = userCoords || [37.7749, -122.4194];

  const handleRevealContinue = useCallback(() => {
    if (!unlockReveal) return;
    setUnlockReveal(null);
    setLocation(`/content/${unlockReveal.content.id}?loc=${unlockReveal.locationId}&mode=${session.mode}`);
  }, [unlockReveal, setLocation, session.mode]);

  async function continueWith(locationId: string) {
    if (!data) return;

    const location = locations.find((l) => l.id === locationId) ?? null;
    
    const picked = pickContentForLocationMode(data, {
      locationId,
      mode: session.mode as PulseMode,
    });

    if (!picked) {
      toast("No active drop here yet", {
        description: "Try another Pulse location or check back soon.",
      });
      return;
    }

    try {
      await unlockMutation.mutateAsync({
        nodeId: locationId,
        contentId: picked.content.id,
        mode: session.mode,
      });
    } catch {
      // continue to content even if unlock fails
    }

    triggerHeartbeatVibration();
    setUnlockReveal({
      content: picked.content,
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
          defaultZoom={13}
          boxClassname="edor-map"
        >
          {locations.map((loc) => (
            <Marker 
              key={loc.id} 
              anchor={[loc.lat, loc.lng]} 
              color={activeLocation?.id === loc.id ? "hsl(var(--primary))" : "hsl(var(--accent))"}
              onClick={() => setActiveLocation(loc)}
            />
          ))}
          {userCoords && (
            <Marker anchor={userCoords} color="white" />
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

      <Card className="edor-noise glass rounded-3xl p-5" data-testid="card-pulse-status">
        {status.state === "asking" ? (
          <div>
            <p className="text-sm text-white/80" data-testid="text-asking">
              Requesting your location…
            </p>
            <p className="mt-1 text-xs text-white/55" data-testid="text-asking-sub">
              We use it only to find the nearest Pulse.
            </p>
          </div>
        ) : null}

        {status.state === "ready" && !activeLocation && (
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/55" data-testid="text-nearest-label">
              Nearest Pulse Detected
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {locations.find(l => l.id === status.locationId)?.name}
            </p>
            <div className="mt-4">
              <Button
                className="w-full h-12 rounded-2xl animate-sparkle"
                onClick={() => continueWith(status.locationId)}
              >
                Unlock this Pulse
              </Button>
            </div>
          </div>
        )}

        {status.state === "denied" && (
          <div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2">
                <ShieldAlert className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Manual Selection</p>
                <p className="mt-1 text-xs text-white/60">Choose a location from the map or list below.</p>
              </div>
            </div>

            <div className="mt-4">
              <Select value={manualLocationId} onValueChange={setManualLocationId}>
                <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select a Pulse" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black">
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full h-12 rounded-2xl mt-3 animate-sparkle"
                onClick={() => continueWith(manualLocationId)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {unlockReveal && (
          <UnlockReveal
            content={unlockReveal.content}
            locationName={unlockReveal.locationName}
            onContinue={handleRevealContinue}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}
