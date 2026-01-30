import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { loadEdorData, getNearestLocation, pickContentForLocationMode } from "@/lib/edorStore";
import { loadSession, setSelectedLocation } from "@/lib/edorSession";
import { MapPin, ShieldAlert } from "lucide-react";

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
          const nearest = getNearestLocation(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
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

  const chosenLocation =
    status.state === "ready"
      ? data.locations.find((l) => l.id === status.locationId)
      : data.locations.find((l) => l.id === manualLocationId);

  function continueWith(locationId: string) {
    const location = data.locations.find((l) => l.id === locationId) ?? null;
    setSelectedLocation(location);

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

        {status.state === "ready" && chosenLocation ? (
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/55" data-testid="text-nearest-label">
              Nearest Pulse
            </p>
            <p className="mt-2 text-lg font-semibold text-white" data-testid="text-nearest-name">
              {chosenLocation.name}
            </p>
            <p className="mt-1 text-sm text-white/65" data-testid="text-nearest-desc">
              {chosenLocation.description}
            </p>
            <p className="mt-2 text-xs text-white/50" data-testid="text-nearest-distance">
              {typeof status.distanceMeters === "number"
                ? `${Math.round(status.distanceMeters)}m away`
                : ""}
            </p>

            <div className="mt-4 grid gap-2">
              <Button
                className="w-full h-12 rounded-2xl"
                onClick={() => continueWith(chosenLocation.id)}
                data-testid="button-unlock"
              >
                Unlock this Pulse
              </Button>
              <Button
                variant="secondary"
                className="w-full h-12 rounded-2xl"
                onClick={() => {
                  setStatus({ state: "denied" });
                  setManualLocationId(chosenLocation.id);
                }}
                data-testid="button-choose-manual"
              >
                Choose a different Pulse
              </Button>
            </div>
          </div>
        ) : null}

        {status.state === "denied" ? (
          <div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2">
                <ShieldAlert className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white" data-testid="text-denied-title">
                  Location not available
                </p>
                <p className="mt-1 text-xs text-white/60" data-testid="text-denied-sub">
                  Select a Pulse location manually to continue.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <div>
                <p className="text-xs text-white/60" data-testid="text-manual-label">
                  Pulse location
                </p>
                <div className="mt-2">
                  <Select
                    value={manualLocationId}
                    onValueChange={(v) => setManualLocationId(v)}
                  >
                    <SelectTrigger
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                      data-testid="select-location"
                    >
                      <SelectValue placeholder="Select a Pulse" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0b0b10]">
                      {data.locations.map((l) => (
                        <SelectItem key={l.id} value={l.id} data-testid={`option-location-${l.id}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-300" />
                            <span>{l.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-2xl"
                onClick={() => continueWith(manualLocationId)}
                data-testid="button-continue-manual"
                disabled={!manualLocationId}
              >
                Continue
              </Button>
            </div>

            {chosenLocation ? (
              <p className="mt-3 text-xs text-white/50" data-testid="text-manual-preview">
                {chosenLocation.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>
    </Shell>
  );
}
