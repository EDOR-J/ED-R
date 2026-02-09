import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { loadEdorData } from "@/lib/edorStore";
import { loadSession, setLastContentId } from "@/lib/edorSession";
import { Pause, Play, SkipBack } from "lucide-react";

function useQuery() {
  const [loc] = useLocation();
  return useMemo(() => new URLSearchParams(loc.split("?")[1] ?? ""), [loc]);
}

export default function ContentPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/content/:contentId");
  const contentId = params?.contentId;

  const data = useMemo(() => loadEdorData(), []);
  const session = useMemo(() => loadSession(), []);
  const q = useQuery();

  const content = data.contents.find((c) => c.id === contentId);
  const locId = q.get("loc") ?? session.selectedLocationId;
  const location = data.locations.find((l) => l.id === locId);
  const mode = (q.get("mode") ?? session.mode) as any;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (contentId) setLastContentId(contentId);
  }, [contentId]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onEnded() {
      setPlaying(false);
    }

    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, []);

  async function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  if (!content) {
    return (
      <Shell title="Content not found">
        <Card className="glass rounded-3xl p-4" data-testid="card-not-found">
          <p className="text-sm text-white/70" data-testid="text-not-found">
            This drop isn’t available.
          </p>
          <Button
            className="mt-3 w-full rounded-2xl"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            Back to Home
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell
      title="Unlocked"
      right={
        <Link
          href="/pulse"
          className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
          data-testid="link-back"
        >
          Back
        </Link>
      }
    >
      <Card className="edor-noise glass rounded-3xl p-5" data-testid="card-content">
        <div
          className="aspect-[1/1] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0"
          data-testid="img-artwork"
        >
          <div className="h-full w-full p-5">
            <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/55" data-testid="text-context">
            {location ? location.name : "Pulse location"} • {mode === "park" ? "Park" : "Discover"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white" data-testid="text-content-title">
            {content.title}
          </h2>
          <p className="mt-1 text-sm text-white/70" data-testid="text-content-creator">
            {content.creator}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/70" data-testid="text-content-desc">
            {content.description}
          </p>
        </div>

        <div className="mt-5 grid gap-2">
          <audio ref={audioRef} src={content.audioUrl} preload="none" />

          {location?.isPermanent ? (
            <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4 mb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Listening Circle Available</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-xs font-bold h-9">
                  Start Circle
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-xs font-bold h-9">
                  Join Circle
                </Button>
              </div>
            </Card>
          ) : (
            <div className="px-1 mb-2">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                Solo Pulse (Circle not available)
              </p>
            </div>
          )}

          <Button
            className="h-12 w-full rounded-2xl"
            onClick={togglePlay}
            data-testid="button-play"
          >
            <span className="mr-2 inline-flex" aria-hidden>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </span>
            {playing ? "Pause preview" : "Play preview"}
          </Button>

          <Button
            variant="secondary"
            className="h-12 w-full rounded-2xl"
            onClick={() => {
              const el = audioRef.current;
              if (el) {
                el.pause();
                el.currentTime = 0;
              }
              setPlaying(false);
              setLocation("/");
            }}
            data-testid="button-next-pulse"
          >
            <SkipBack className="mr-2 h-4 w-4" />
            Next Pulse
          </Button>
        </div>
      </Card>
    </Shell>
  );
}
