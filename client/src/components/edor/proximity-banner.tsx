import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Zap, X, Headphones, ChevronRight, Music, Loader2 } from "lucide-react";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { useProximityWatcher, PROXIMITY_METERS } from "@/hooks/use-proximity-watcher";
import { useAuth } from "@/hooks/use-auth";
import { type ApiContent } from "@/lib/api";

function artworkGradient(seed: string | null) {
  if (!seed) return "linear-gradient(135deg, hsl(40,70%,25%), hsl(20,60%,15%))";
  const h = parseInt(seed, 36) % 360;
  return `linear-gradient(135deg, hsl(${h},70%,25%), hsl(${(h + 60) % 360},60%,15%))`;
}

function ProximityRevealModal({
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
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/92 backdrop-blur-xl overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="overlay-proximity-reveal"
    >
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/60"
            style={{ left: `${50 + (Math.random() - 0.5) * 60}%`, top: `${40 + (Math.random() - 0.5) * 50}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: (Math.random() - 0.5) * 180, y: (Math.random() - 0.5) * 180 }}
            transition={{ duration: 1.8, delay: 0.15 + Math.random() * 0.7, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        className="relative flex flex-col items-center w-full max-w-sm px-5 py-8 gap-5"
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, type: "spring", damping: 16 }}
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-amber-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: 2, delay: 0.3 }} />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold">
              {contents.length === 1 ? "Track Unlocked" : `${contents.length} Tracks Unlocked`}
            </span>
            <motion.div className="w-2 h-2 rounded-full bg-amber-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: 2, delay: 0.5 }} />
          </div>
          <p className="text-[11px] text-white/40 flex items-center gap-1">
            <MapPin className="h-3 w-3" />{locationName}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {contents.map((content, i) => (
            <motion.button
              key={content.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              onClick={() => goToContent(content.id)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] active:bg-white/[0.15] border border-white/10 hover:border-amber-400/30 transition-all text-left w-full group"
              data-testid={`button-play-proximity-${content.id}`}
            >
              <div
                className="h-14 w-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10 shadow-lg"
                style={{ background: artworkGradient(content.artworkSeed) }}
              >
                {content.artworkUrl
                  ? <img src={content.artworkUrl} alt={content.title} className="h-full w-full object-cover" />
                  : <Music className="h-6 w-6 text-white/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{content.title}</p>
                <p className="text-[11px] text-white/50 truncate mt-0.5">{content.creator}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Headphones className="h-4 w-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onDismiss}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors mt-1"
          data-testid="button-dismiss-proximity-reveal"
        >
          Go to Library
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function ProximityBanner() {
  const { user } = useAuth();
  const [pathname] = useLocation();

  // Don't run watcher on login page or the pulse page (it has its own)
  const isOnPulse = pathname === "/pulse";
  const isLoggedIn = !!user;
  const enabled = isLoggedIn && !isOnPulse;

  const { nearbyNode, dismiss, unlockNearby, isUnlocking, unlockReveal, clearReveal } = useProximityWatcher(enabled);

  return (
    <>
      {/* In-app proximity banner */}
      <AnimatePresence>
        {nearbyNode && (
          <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            data-testid="banner-proximity"
          >
            <div className="rounded-2xl bg-black/90 border border-amber-400/30 shadow-2xl shadow-amber-500/10 backdrop-blur-xl overflow-hidden">
              {/* Glow strip */}
              <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Pulsing dot */}
                <div className="relative shrink-0">
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-amber-400/40 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white leading-tight truncate" data-testid="text-proximity-node">
                    {nearbyNode.location.name}
                  </p>
                  <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5" data-testid="text-proximity-distance">
                    <MapPin className="h-2.5 w-2.5 text-amber-400/60" />
                    {nearbyNode.distanceMeters}m away · {nearbyNode.contentCount} track{nearbyNode.contentCount !== 1 ? "s" : ""} to unlock
                  </p>
                </div>

                {/* Unlock button */}
                <button
                  onClick={() => unlockNearby()}
                  disabled={isUnlocking}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black text-[11px] font-bold transition-colors shrink-0 disabled:opacity-60"
                  data-testid="button-proximity-unlock"
                >
                  {isUnlocking
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Zap className="h-3.5 w-3.5" />}
                  {isUnlocking ? "Unlocking…" : "Pulse"}
                </button>

                {/* Dismiss */}
                <button
                  onClick={dismiss}
                  className="ml-1 text-white/30 hover:text-white/70 transition-colors shrink-0"
                  aria-label="Dismiss"
                  data-testid="button-proximity-dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock reveal modal */}
      <AnimatePresence>
        {unlockReveal && (
          <ProximityRevealModal
            contents={unlockReveal.contents}
            locationName={unlockReveal.locationName}
            locationId={unlockReveal.locationId}
            mode={unlockReveal.mode}
            onDismiss={clearReveal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
