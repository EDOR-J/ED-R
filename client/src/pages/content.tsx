import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { usePulseData, useCreateListenChat, useJoinListenChat, useActiveListenChats } from "@/lib/api";
import { loadSession, setLastContentId, getLatestSession, startRoom } from "@/lib/edorSession";
import { useAuth } from "@/hooks/use-auth";
import { Pause, Play, SkipBack, Users } from "lucide-react";
import { toast } from "sonner";

function useQuery() {
  const [loc] = useLocation();
  return useMemo(() => new URLSearchParams(loc.split("?")[1] ?? ""), [loc]);
}

export default function ContentPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/content/:contentId");
  const contentId = params?.contentId;

  const { data: pulseData, isLoading } = usePulseData();
  const { data: activeChats } = useActiveListenChats();
  const session = useMemo(() => loadSession(), []);
  const latestSession = useMemo(() => getLatestSession(), []);
  const q = useQuery();
  const { user } = useAuth();

  const createChat = useCreateListenChat();
  const joinChat = useJoinListenChat();

  const content = pulseData?.contents.find((c) => c.id === contentId);
  const locId = q.get("loc") ?? session.selectedLocationId;
  const location = pulseData?.locations.find((l) => l.id === locId);
  const mode = (q.get("mode") ?? session.mode) as any;
  const fromNfc = q.get("nfc") === "1";

  const isLatestForThisContent = latestSession?.contentId === contentId && latestSession?.nodeId === locId;
  const canStartCircle = location?.isPermanent && isLatestForThisContent;

  const existingCircle = activeChats?.find(c => c.contentId === contentId && c.isActive);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [launching, setLaunching] = useState(false);

  const userId = user?.id || "guest";
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Guest";

  function handleStartCircle() {
    if (!locId || !contentId || !content || launching) return;
    setLaunching(true);

    createChat.mutate({
      name: `Circle: ${location?.name || "Unknown"}`,
      contentId,
      contentTitle: content.title,
      contentArtist: content.creator,
      audioUrl: content.audioUrl,
      createdBy: userId,
      displayName,
    }, {
      onSuccess: (chat) => {
        startRoom(locId, contentId, { serverChatId: chat.id, hostId: userId });
        toast.success("Circle created!");
        navigateWithTransition(setLocation, "/circle");
      },
      onError: () => {
        setLaunching(false);
        toast.error("Failed to create circle");
      },
    });
  }

  function handleJoinCircle() {
    if (!locId || !contentId || !content || launching) return;

    if (existingCircle) {
      setLaunching(true);
      joinChat.mutate({
        chatId: existingCircle.id,
        userId,
        displayName,
      }, {
        onSuccess: () => {
          startRoom(locId, contentId, { serverChatId: existingCircle.id, hostId: existingCircle.createdBy });
          toast.success("Joined circle!");
          navigateWithTransition(setLocation, "/circle");
        },
        onError: () => {
          setLaunching(false);
          toast.error("Failed to join circle");
        },
      });
    } else {
      handleStartCircle();
    }
  }

  useEffect(() => {
    if (contentId) setLastContentId(contentId);
  }, [contentId]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    function onEnded() { setPlaying(false); }
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, []);

  // Autoplay when arriving via NFC
  useEffect(() => {
    if (!fromNfc || !content) return;
    const el = audioRef.current;
    if (!el) return;
    el.play().then(() => setPlaying(true)).catch(() => {
      // Browser blocked autoplay — the pulsing play button guides the user
    });
  }, [fromNfc, content]);

  async function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }

  if (isLoading) {
    return (
      <Shell title="Loading…">
        <Card className="glass rounded-3xl p-4" data-testid="card-loading">
          <p className="text-sm text-white/70 text-center py-8">Loading content…</p>
        </Card>
      </Shell>
    );
  }

  if (!content) {
    return (
      <Shell title="Content not found">
        <Card className="glass rounded-3xl p-4" data-testid="card-not-found">
          <p className="text-sm text-white/70" data-testid="text-not-found">
            This drop isn't available.
          </p>
          <Button
            className="mt-3 w-full rounded-2xl"
            onClick={() => navigateWithTransition(setLocation, "/")}
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
          {content.videoUrl ? (
            <video
              src={content.videoUrl}
              className="h-full w-full object-cover"
              controls
              playsInline
              poster={content.artworkUrl ?? undefined}
            />
          ) : content.artworkUrl ? (
            <img
              src={content.artworkUrl}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full p-5">
              <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5" />
            </div>
          )}
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
          <audio ref={audioRef} src={content.audioUrl} preload={fromNfc ? "auto" : "none"} />

          {location?.isPermanent ? (
            <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4 mb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Listening Circle Available</span>
              </div>

              {existingCircle && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-[10px] text-primary/80 font-medium">
                    Active circle with {existingCircle.members?.length || 1} listener(s) — join now!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-primary/20 text-xs font-bold h-9"
                  onClick={handleStartCircle}
                  disabled={!isLatestForThisContent || launching}
                  data-testid="button-start-circle"
                >
                  {launching ? "Creating…" : "Start Circle"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-primary/20 text-xs font-bold h-9"
                  onClick={handleJoinCircle}
                  disabled={!isLatestForThisContent || launching}
                  data-testid="button-join-circle"
                >
                  {existingCircle ? "Join Circle" : "Start & Join"}
                </Button>
              </div>
              {!isLatestForThisContent && (
                <p className="mt-2 text-[10px] text-white/30 uppercase font-bold tracking-widest text-center">
                  Must Pulse to join
                </p>
              )}
            </Card>
          ) : (
            <div className="px-1 mb-2">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                Solo Pulse (Circle not available)
              </p>
            </div>
          )}

          <Button
            className={`h-12 w-full rounded-2xl transition-all ${fromNfc && !playing ? "animate-pulse shadow-lg shadow-amber-400/30 scale-[1.02]" : ""}`}
            onClick={togglePlay}
            data-testid="button-play"
          >
            <span className="mr-2 inline-flex" aria-hidden>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </span>
            {playing ? "Pause" : fromNfc ? "Tap to play" : "Play preview"}
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
              navigateWithTransition(setLocation, "/");
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
