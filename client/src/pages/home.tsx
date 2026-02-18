import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { usePulseData, useDrops, getNearestLocation } from "@/lib/api";
import { loadSession, setMode, startRoom } from "@/lib/edorSession";
import { useMemo, useState, useEffect } from "react";
import { MapPin, Radio, Sparkles, Scan, Library, User } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logo from "@assets/Screenshot_20260130_133453_Gallery_1769832888373.jpeg";

function useQuery() {
  const [loc] = useLocation();
  return useMemo(() => new URLSearchParams(loc.split("?")[1] ?? ""), [loc]);
}

import { AnimatePresence, motion } from "framer-motion";

function SparkleParticle({ id, onComplete }: { id: number; onComplete: (id: number) => void }) {
  // Random start position around the center
  const angle = Math.random() * 360;
  const distance = 20 + Math.random() * 20; // Start slightly outside center
  
  // Random movement vector
  const moveDistance = 60 + Math.random() * 50;
  const duration = 0.5 + Math.random() * 0.5;
  
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0,
        x: "50%", 
        y: "50%",
        rotate: Math.random() * 360
      }}
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0],
        x: `calc(50% + ${Math.cos(angle * (Math.PI / 180)) * moveDistance}px)`,
        y: `calc(50% + ${Math.sin(angle * (Math.PI / 180)) * moveDistance}px)`,
        rotate: Math.random() * 360 + 180
      }}
      transition={{ duration, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="absolute top-0 left-0 w-3 h-3 pointer-events-none z-10"
      style={{
        top: "50%",
        left: "50%",
        marginTop: -6,
        marginLeft: -6
      }}
    >
      <Sparkles className="w-full h-full text-amber-200 fill-amber-100/50" />
    </motion.div>
  );
}

export default function HomePage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Disabled environment check for mockup mode
    /* 
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setLocation("/login");
    }
    */
  }, [setLocation]);
  const [mode, setModeState] = useState(loadSession().mode);
  const { data: pulseData, isLoading: pulseLoading } = usePulseData();
  const { data: drops, isLoading: dropsLoading } = useDrops();
  const q = useQuery();

  // Pulse button interaction
  const [sparkleDuration, setSparkleDuration] = useState(2.5);
  const [isHolding, setIsHolding] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  
  // We use a ref for the interval to clear it easily
  const intervalRef = useState<{ current: NodeJS.Timeout | null }>({ current: null })[0];
  const particleIntervalRef = useState<{ current: NodeJS.Timeout | null }>({ current: null })[0];

  const addParticle = () => {
    setParticles(prev => [...prev, Date.now() + Math.random()]);
  };

  const removeParticle = (id: number) => {
    setParticles(prev => prev.filter(p => p !== id));
  };

  const startHold = () => {
    setIsHolding(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (particleIntervalRef.current) clearInterval(particleIntervalRef.current);
    
    // Speed up shimmer
    intervalRef.current = setInterval(() => {
      setSparkleDuration((prev) => Math.max(0.2, prev * 0.9)); // Accelerate
    }, 100);

    // Spawn particles
    addParticle(); // Immediate spawn
    particleIntervalRef.current = setInterval(() => {
      addParticle();
      // Sometimes add two
      if (Math.random() > 0.5) setTimeout(addParticle, 50);
    }, 100);
  };

  const endHold = () => {
    setIsHolding(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (particleIntervalRef.current) {
      clearInterval(particleIntervalRef.current);
      particleIntervalRef.current = null;
    }
    setSparkleDuration(2.5); // Reset
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (particleIntervalRef.current) clearInterval(particleIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const joinId = q.get("join");
    const locId = q.get("loc");
    
    if (joinId && locId && pulseData?.locations) {
      if (!navigator.geolocation) {
        toast.error("Location required to join Circle");
        return;
      }

      navigator.geolocation.getCurrentPosition((pos) => {
        const targetLoc = pulseData.locations.find(l => l.id === locId);
        if (!targetLoc) return;

        const nearest = getNearestLocation(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          [targetLoc]
        );

        if (nearest && nearest.distanceMeters < 100) {
          startRoom(locId, joinId.split('-')[1]);
          setLocation("/circle");
          toast.success(`Joined Circle at ${targetLoc.name}`);
        } else {
          toast.error("You must be at the location to join this Circle.");
        }
      });
    }
  }, [q, pulseData?.locations]);

  if (pulseLoading || dropsLoading) {
    return (
      <Shell right={<div />}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <p className="text-sm text-white/50" data-testid="text-loading">Loading…</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      right={
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition flex items-center gap-2"
            data-testid="link-profile"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/library"
            className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition flex items-center gap-2"
            data-testid="link-library"
          >
            <Library className="h-4 w-4" />
            Library
          </Link>
          <Link
            href="/admin"
            className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition"
            data-testid="link-admin"
          >
            Admin
          </Link>
        </div>
      }
    >
      <div className="w-full pt-4 pb-8 overflow-hidden">
        <img 
          src={logo} 
          alt="EDØR Logo" 
          className="w-full h-auto object-contain max-w-none"
          data-testid="img-logo"
        />
      </div>

      <section className="edor-noise glass rounded-3xl p-5">
        <div>
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

        <div className="mt-5 relative">
          <AnimatePresence>
            {particles.map(id => (
              <SparkleParticle key={id} id={id} onComplete={removeParticle} />
            ))}
          </AnimatePresence>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-base font-semibold tracking-wide animate-sparkle transition-all duration-300 active:scale-[0.98] relative z-20"
            onClick={() => setLocation("/pulse")}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            style={{ "--sparkle-duration": `${sparkleDuration}s` } as React.CSSProperties}
            data-testid="button-pulse"
          >
            Pulse
          </Button>
          <div className="mt-4 flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 rounded-2xl h-12 border-white/10 text-white/60 text-xs gap-2">
                  <Scan className="h-4 w-4" />
                  Scan to Join
                </Button>
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
          <p className="mt-2 text-xs text-white/55 text-center" data-testid="text-pulse-helper">
            We’ll ask for location to find your nearest Pulse.
          </p>
        </div>
      </section>

      <section className="mt-8">
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
          {(pulseData?.contents ?? []).slice(0, 6).map((content) => (
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
        <div className="flex items-end justify-between px-1">
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
          {(drops ?? []).length ? (
            (drops ?? []).map(({ assignment, content, location }) => (
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

    </Shell>
  );
}
