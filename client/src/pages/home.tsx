import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { loadEdorData, getThisWeeksDrops } from "@/lib/edorStore";
import { loadSession, setMode } from "@/lib/edorSession";
import { useMemo, useState } from "react";
import { MapPin, Radio, Sparkles } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [mode, setModeState] = useState(loadSession().mode);
  const data = useMemo(() => loadEdorData(), []);

  const drops = useMemo(() => getThisWeeksDrops(data, 5), [data]);

  return (
    <Shell
      right={
        <Link
          href="/admin"
          className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
          data-testid="link-admin"
        >
          Admin
        </Link>
      }
    >
      <section className="edor-noise glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.22em] text-white/55"
              data-testid="text-brand-kicker"
            >
              Place-based music + culture
            </p>
            <h2
              className="mt-2 font-serif text-4xl font-bold leading-[1.02] tracking-tight"
              data-testid="text-brand"
            >
              EDØR
            </h2>
            <p className="mt-2 text-sm text-white/70" data-testid="text-tagline">
              Pulse nearby to unlock a drop.
            </p>
          </div>
          <div className="mt-1 hidden shrink-0 sm:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="flex items-center gap-2 text-xs text-white/70">
                <Radio className="h-4 w-4 text-amber-300" />
                <span data-testid="text-mode-hint">Two-week city launch MVP</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs text-white/60" data-testid="text-mode-label">
            Mode
          </p>
          <div className="mt-2">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => {
                if (!v) return;
                setModeState(v as any);
                setMode(v as any);
              }}
              className="grid grid-cols-2 gap-2"
            >
              <ToggleGroupItem
                value="discover"
                className="justify-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 data-[state=on]:bg-white/10 data-[state=on]:border-white/20"
                data-testid="toggle-discover"
              >
                <Sparkles className="h-4 w-4 text-purple-300" />
                <span className="font-medium">Discover</span>
                <span className="ml-auto text-xs text-white/55">Music</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="park"
                className="justify-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 data-[state=on]:bg-white/10 data-[state=on]:border-white/20"
                data-testid="toggle-park"
              >
                <MapPin className="h-4 w-4 text-sky-300" />
                <span className="font-medium">Park</span>
                <span className="ml-auto text-xs text-white/55">Ambient</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="mt-5">
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-base font-semibold tracking-wide"
            onClick={() => setLocation("/pulse")}
            data-testid="button-pulse"
          >
            Pulse
          </Button>
          <p className="mt-2 text-xs text-white/55" data-testid="text-pulse-helper">
            We’ll ask for location to find your nearest Pulse.
          </p>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between px-1">
          <h3
            className="font-serif text-lg font-bold tracking-tight"
            data-testid="text-nearby-title"
          >
            Nearby Artists
          </h3>
          <p className="text-xs text-white/45" data-testid="text-nearby-subtitle">
            Local Pulse
          </p>
        </div>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth">
          {data.contents.slice(0, 6).map((content) => (
            <Link
              key={content.id}
              href={`/content/${content.id}`}
              className="group shrink-0 w-32 focus:outline-none"
              data-testid={`link-artist-card-${content.id}`}
            >
              <div className="aspect-square w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 overflow-hidden group-hover:border-white/20 transition-colors">
                <div className="h-full w-full flex items-center justify-center bg-white/5 group-active:scale-95 transition-transform">
                  <Radio className="h-6 w-6 text-white/20" />
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-white/90 truncate" data-testid={`text-artist-name-${content.id}`}>
                {content.creator}
              </p>
              <p className="text-[10px] text-white/40 truncate" data-testid={`text-artist-track-${content.id}`}>
                {content.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-2">
        <div className="flex items-end justify-between">
          <h3
            className="font-serif text-lg font-bold tracking-tight"
            data-testid="text-drops-title"
          >
            This week’s Pulse drops
          </h3>
          <p className="text-xs text-white/45" data-testid="text-drops-subtitle">
            Limited rotations
          </p>
        </div>

        <div className="mt-3 grid gap-3">
          {drops.length ? (
            drops.map(({ assignment, content, location }) => (
              <Card
                key={assignment.id}
                className="edor-noise glass rounded-3xl p-4"
                data-testid={`card-drop-${assignment.id}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5"
                    data-testid={`img-artwork-${content.id}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white" data-testid={`text-title-${content.id}`}>
                      {content.title}
                    </p>
                    <p
                      className="mt-0.5 text-xs text-white/65"
                      data-testid={`text-creator-${content.id}`}
                    >
                      {content.creator}
                    </p>
                    <p
                      className="mt-1 text-xs text-white/50"
                      data-testid={`text-location-${location.id}`}
                    >
                      {location.name} • {assignment.mode === "discover" ? "Discover" : "Park"}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="glass rounded-3xl p-4" data-testid="empty-drops">
              <p className="text-sm text-white/70" data-testid="text-empty-drops">
                No drops are active right now.
              </p>
            </Card>
          )}
        </div>
      </section>

      <section className="mt-6">
        <Card className="glass rounded-3xl p-4" data-testid="card-note">
          <p className="text-sm text-white/70" data-testid="text-note">
            Tip: scarcity is the moat — drops rotate by location + mode.
          </p>
        </Card>
      </section>
    </Shell>
  );
}
