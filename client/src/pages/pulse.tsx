import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { loadEdorData, getNearestLocation, pickContentForLocationMode, type PulseLocation } from "@/lib/edorStore";
import { loadSession, setSelectedLocation, addUnlockedSession, addToLibrary } from "@/lib/edorSession";
import { MapPin, ShieldAlert, X } from "lucide-react";
import { Map, Marker, Overlay } from "pigeon-maps";
import { motion, AnimatePresence } from "framer-motion";

type Status =
  | { state: "asking" }
  | { state: "denied" }
  | { state: "ready"; locationId: string; distanceMeters?: number };

export default function PulsePage() {
  const [, setLocation] = useLocation();
  const data = useMemo(() => loadEdorData(), []);
  const session = useMemo(() => loadSession(), []);

  const [status, setStatus] = useState<Status>({ state: "asking" });
  const [manualLocationId, setManualLocationId] = useState<string>(data.locations[0]?.id ?? "");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [activeLocation, setActiveLocation] = useState<PulseLocation | null>(null);

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
            data.locations,
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
  }, [data.locations]);

  const center = userCoords || [37.7749, -122.4194];

  function continueWith(locationId: string) {
    const location = data.locations.find((l) => l.id === locationId) ?? null;
    
    const picked = pickContentForLocationMode(data, {
      locationId,
      mode: session.mode,
    });

    if (!picked) {
      toast("No active drop here yet", {
        description: "Try another Pulse location or check back soon.",
      });
      return;
    }

    addUnlockedSession(locationId, picked.content.id, session.mode);
    
    // Auto-save to Library
    addToLibrary({
      contentId: picked.content.id,
      title: picked.content.title,
      artist: picked.content.creator,
      mode: session.mode,
      nodeId: locationId,
      locationName: location?.name || "Unknown Location",
      unlockedAt: new Date().toISOString(),
      audioUrl: picked.content.audioUrl,
      artworkUrl: "" // placeholder
    });

    setLocation(`/content/${picked.content.id}?loc=${locationId}&mode=${session.mode}`);
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
          {data.locations.map((loc) => (
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
                  className="w-full mt-3 h-9 rounded-xl text-xs font-bold"
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
              {data.locations.find(l => l.id === status.locationId)?.name}
            </p>
            <div className="mt-4">
              <Button
                className="w-full h-12 rounded-2xl"
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
                  {data.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full h-12 rounded-2xl mt-3"
                onClick={() => continueWith(manualLocationId)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Shell>
  );
}
