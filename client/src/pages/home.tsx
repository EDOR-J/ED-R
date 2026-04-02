import Shell from "@/components/edor/shell";
import { Link, useLocation } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { usePulseData, useDrops, getNearestLocation, PulseMode } from "@/lib/api";
import { loadSession, setMode, startRoom } from "@/lib/edorSession";
import { useMemo, useState, useEffect, useRef } from "react";
import { MapPin, Sparkles, Scan, Music } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";

function useQuery() {
  const [loc] = useLocation();
  return useMemo(() => new URLSearchParams(loc.split("?")[1] ?? ""), [loc]);
}

function IceCrystal({ id, onComplete }: { id: number; onComplete: (id: number) => void }) {
  const angle = Math.random() * 360;
  const moveDistance = 60 + Math.random() * 80;
  const duration = 0.6 + Math.random() * 0.6;
  const size = 2 + Math.random() * 5;
  const isFlake = Math.random() > 0.4;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: "50%", y: "50%", rotate: Math.random() * 360 }}
      animate={{
        opacity: [0, 0.9, 0],
        scale: [0.3, 1.4, 0],
        x: `calc(50% + ${Math.cos(angle * (Math.PI / 180)) * moveDistance}px)`,
        y: `calc(50% + ${Math.sin(angle * (Math.PI / 180)) * moveDistance}px)`,
        rotate: Math.random() * 360 + 180,
      }}
      transition={{ duration, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="absolute pointer-events-none z-10"
      style={{
        top: "50%",
        left: "50%",
        marginTop: -(size / 2),
        marginLeft: -(size / 2),
        width: size,
        height: size,
      }}
    >
      {isFlake ? (
        <Sparkles className="w-full h-full text-blue-200 fill-blue-100/60 drop-shadow-[0_0_3px_rgba(180,220,255,0.6)]" />
      ) : (
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(220,240,255,0.9) 0%, rgba(180,220,255,0.4) 50%, transparent 100%)`,
            boxShadow: `0 0 ${size}px rgba(180,220,255,0.5)`,
          }}
        />
      )}
    </motion.div>
  );
}

const CONTENT_COLORS = [
  ["from-purple-500/20", "border-purple-500/20", "#a855f7"],
  ["from-cyan-500/20", "border-cyan-500/20", "#06b6d4"],
  ["from-amber-500/20", "border-amber-500/20", "#f59e0b"],
  ["from-rose-500/20", "border-rose-500/20", "#f43f5e"],
  ["from-emerald-500/20", "border-emerald-500/20", "#10b981"],
  ["from-blue-500/20", "border-blue-500/20", "#3b82f6"],
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  },
};

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const [mode, setModeState] = useState<PulseMode>(loadSession().mode as PulseMode);
  const { data: pulseData, isLoading: pulseLoading } = usePulseData();
  const { data: drops, isLoading: dropsLoading } = useDrops();
  const q = useQuery();

  const [sparkleDuration, setSparkleDuration] = useState(2.5);
  const [isHolding, setIsHolding] = useState(false);
  const [iceIntensity, setIceIntensity] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const particleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addParticle = () => setParticles(prev => [...prev, Date.now() + Math.random()]);
  const removeParticle = (id: number) => setParticles(prev => prev.filter(p => p !== id));

  const startHold = () => {
    setIsHolding(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (particleIntervalRef.current) clearInterval(particleIntervalRef.current);
    if (iceIntervalRef.current) clearInterval(iceIntervalRef.current);

    intervalRef.current = setInterval(() => setSparkleDuration(prev => Math.max(0.15, prev * 0.88)), 80);
    iceIntervalRef.current = setInterval(() => setIceIntensity(prev => Math.min(1, prev + 0.06)), 60);
    addParticle();
    particleIntervalRef.current = setInterval(() => {
      addParticle();
      if (Math.random() > 0.4) setTimeout(addParticle, 40);
      if (Math.random() > 0.7) setTimeout(addParticle, 80);
    }, 90);
  };

  const endHold = () => {
    setIsHolding(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (particleIntervalRef.current) { clearInterval(particleIntervalRef.current); particleIntervalRef.current = null; }
    if (iceIntervalRef.current) { clearInterval(iceIntervalRef.current); iceIntervalRef.current = null; }
    setSparkleDuration(2.5);
    setIceIntensity(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (particleIntervalRef.current) clearInterval(particleIntervalRef.current);
      if (iceIntervalRef.current) clearInterval(iceIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const joinId = q.get("join");
    const locId = q.get("loc");
    if (joinId && locId && pulseData?.locations) {
      if (!navigator.geolocation) { toast.error("Location required to join Circle"); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
        const targetLoc = pulseData.locations.find(l => l.id === locId);
        if (!targetLoc) return;
        const nearest = getNearestLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, [targetLoc]);
        if (nearest && nearest.distanceMeters < 100) {
          startRoom(locId, joinId.split('-')[1]);
          navigateWithTransition(setLocation, "/circle");
          toast.success(`Joined Circle at ${targetLoc.name}`);
        } else {
          toast.error("You must be at the location to join this Circle.");
        }
      });
    }
  }, [q, pulseData?.locations]);

  const isDiscover = mode === "discover";

  if (pulseLoading || dropsLoading) {
    return (
      <Shell right={<div />}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative h-16 w-16">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-white/20"
                  animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                  transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
              <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-white/40 font-medium tracking-widest uppercase" data-testid="text-loading">Tuning in…</p>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      right={
        <div className="flex items-center gap-1">
          {(role === "artist" || role === "admin") && (
            <Link
              href={role === "artist" ? "/artist" : "/upload"}
              className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
              data-testid="link-upload"
            >
              {role === "artist" ? "Dashboard" : "Upload"}
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
              data-testid="link-admin"
            >
              Admin
            </Link>
          )}
        </div>
      }
    >
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        <motion.div variants={stagger.item} className="relative">
          <div
            className="relative rounded-3xl overflow-hidden px-6 pt-10 pb-8 flex flex-col items-center gap-2"
            style={{
              background: isDiscover
                ? "radial-gradient(ellipse 90% 80% at 50% 0%, rgba(168,85,247,0.18) 0%, transparent 70%), rgba(255,255,255,0.03)"
                : "radial-gradient(ellipse 90% 80% at 50% 0%, rgba(6,182,212,0.16) 0%, transparent 70%), rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              transition: "background 0.8s ease",
            }}
          >
            <motion.h1
              className="font-serif text-[56px] leading-none tracking-tighter font-bold text-white select-none"
              data-testid="img-logo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              EDØR
            </motion.h1>
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-white/35">
              Place-based music &amp; culture
            </p>

            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{
                background: isDiscover
                  ? "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
                transition: "background 0.8s ease",
              }}
            />
          </div>
        </motion.div>

        <motion.div variants={stagger.item} className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="relative flex rounded-full p-1 gap-1"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              data-testid="text-mode-label"
            >
              <motion.div
                className="absolute top-1 bottom-1 rounded-full"
                animate={{ left: isDiscover ? "4px" : "calc(50% + 2px)", right: isDiscover ? "calc(50% + 2px)" : "4px" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                style={{ background: isDiscover ? "rgba(168,85,247,0.25)" : "rgba(6,182,212,0.22)" }}
              />
              <button
                className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${isDiscover ? "text-purple-200" : "text-white/40"}`}
                onClick={() => { setModeState("discover"); setMode("discover"); }}
                data-testid="toggle-discover"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Discover
              </button>
              <button
                className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${!isDiscover ? "text-cyan-200" : "text-white/40"}`}
                onClick={() => { setModeState("park"); setMode("park"); }}
                data-testid="toggle-park"
              >
                <MapPin className="h-3.5 w-3.5" />
                Park
              </button>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white/35 hover:text-white/60 hover:bg-white/5 transition"
                  data-testid="button-scan"
                  title="Scan to Join"
                >
                  <Scan className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-center">Scan Circle QR</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="h-48 w-48 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center">
                    <Scan className="h-12 w-12 text-white/20 animate-pulse" />
                  </div>
                  <p className="text-center text-xs text-white/40 max-w-[200px]">
                    Point your camera at a host's QR code to join their Listening Circle.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative flex items-center justify-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                animate={{ scale: [1, 2.6], opacity: [0.18, 0] }}
                transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: "easeOut" }}
                style={{
                  width: 120,
                  height: 120,
                  border: `1px solid ${isDiscover ? "rgba(168,85,247,0.5)" : "rgba(6,182,212,0.5)"}`,
                }}
              />
            ))}

            <AnimatePresence>
              {particles.map(id => (
                <IceCrystal key={id} id={id} onComplete={removeParticle} />
              ))}
            </AnimatePresence>

            <motion.button
              className={`relative z-20 h-[120px] w-[120px] rounded-full flex items-center justify-center animate-sparkle ${isHolding ? "pulse-btn-holding" : ""}`}
              style={{
                background: isDiscover
                  ? "radial-gradient(circle at 35% 35%, rgba(168,85,247,0.35), rgba(139,92,246,0.15) 60%, rgba(0,0,0,0.3))"
                  : "radial-gradient(circle at 35% 35%, rgba(6,182,212,0.35), rgba(14,165,233,0.15) 60%, rgba(0,0,0,0.3))",
                border: isDiscover ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(6,182,212,0.4)",
                boxShadow: isDiscover
                  ? "0 0 40px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
                  : "0 0 40px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                "--sparkle-duration": `${sparkleDuration}s`,
                "--ice-intensity": `${iceIntensity}`,
                transition: "background 0.8s ease, border-color 0.8s ease, box-shadow 0.8s ease",
              } as React.CSSProperties}
              onClick={() => navigateWithTransition(setLocation, "/pulse")}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              whileTap={{ scale: 0.96 }}
              data-testid="button-pulse"
            >
              <span className="font-serif text-xl font-bold text-white/90 tracking-wide select-none">
                Pulse
              </span>
            </motion.button>
          </div>

          <p className="text-[11px] text-white/35 text-center tracking-wide" data-testid="text-pulse-helper">
            We'll find your nearest drop
          </p>
        </motion.div>

        {(pulseData?.contents ?? []).length > 0 && (
          <motion.section variants={stagger.item}>
            <div className="flex items-center justify-between px-0.5 mb-4">
              <h3 className="font-serif text-base font-bold tracking-tight text-white" data-testid="text-nearby-title">
                Nearby Artists
              </h3>
              <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest" data-testid="text-nearby-subtitle">
                Local Pulse
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
              {(pulseData?.contents ?? []).slice(0, 8).map((content, i) => {
                const [fromColor, borderColor, hexColor] = CONTENT_COLORS[i % CONTENT_COLORS.length];
                return (
                  <Link
                    key={content.id}
                    href={`/content/${content.id}`}
                    className="shrink-0 group focus:outline-none"
                    data-testid={`link-artist-card-${content.id}`}
                  >
                    <div
                      className={`h-[72px] w-[72px] rounded-2xl border bg-gradient-to-br to-white/3 ${fromColor} ${borderColor} flex items-center justify-center group-active:scale-95 transition-transform`}
                      style={{ boxShadow: `0 0 18px ${hexColor}18` }}
                    >
                      <Music className="h-6 w-6" style={{ color: hexColor, opacity: 0.6 }} />
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium text-white/80 truncate max-w-[72px]" data-testid={`text-artist-name-${content.id}`}>
                      {content.creator}
                    </p>
                    <p className="text-[10px] text-white/35 truncate max-w-[72px]" data-testid={`text-artist-track-${content.id}`}>
                      {content.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        <motion.section variants={stagger.item}>
          <div className="flex items-center justify-between px-0.5 mb-4">
            <h3 className="font-serif text-base font-bold tracking-tight text-white" data-testid="text-drops-title">
              This week's Pulse drops
            </h3>
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest" data-testid="text-drops-subtitle">
              Limited rotations
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
            {(drops ?? []).length ? (
              (drops ?? []).map(({ assignment, content, location }, i) => {
                const [fromColor, borderColor, hexColor] = CONTENT_COLORS[i % CONTENT_COLORS.length];
                const isModeDiscover = assignment.mode === "discover";
                return (
                  <Link
                    key={assignment.id}
                    href={`/content/${content.id}`}
                    className="shrink-0 group focus:outline-none"
                    data-testid={`card-drop-${assignment.id}`}
                  >
                    <div
                      className={`w-44 rounded-2xl border bg-gradient-to-br to-black/30 ${fromColor} ${borderColor} p-3.5 flex flex-col gap-2 group-active:scale-[0.97] transition-transform`}
                      style={{ boxShadow: `0 4px 24px ${hexColor}12` }}
                    >
                      <div
                        className="h-10 w-10 rounded-xl border flex items-center justify-center"
                        style={{ borderColor: `${hexColor}30`, background: `${hexColor}18` }}
                        data-testid={`img-artwork-${content.id}`}
                      >
                        <Music className="h-4 w-4" style={{ color: hexColor, opacity: 0.7 }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white leading-tight truncate" data-testid={`text-title-${content.id}`}>
                          {content.title}
                        </p>
                        <p className="text-[11px] text-white/50 truncate mt-0.5" data-testid={`text-creator-${content.id}`}>
                          {content.creator}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-auto">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: `${hexColor}18`, color: hexColor }}
                          data-testid={`text-location-${location.id}`}
                        >
                          {location.name}
                        </span>
                        <span className="text-[9px] text-white/25 uppercase tracking-wider">
                          {isModeDiscover ? "Discover" : "Park"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div
                className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center"
                data-testid="empty-drops"
              >
                <p className="text-sm text-white/30" data-testid="text-empty-drops">
                  No drops active right now
                </p>
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </Shell>
  );
}
