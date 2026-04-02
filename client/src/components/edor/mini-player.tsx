import { useState, useRef, useEffect } from "react";
import { loadSession } from "@/lib/edorSession";
import { usePulseData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  ChevronDown,
  Music,
  GripHorizontal,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

export function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // React to lastContentId changes from same tab
  const [lastContentId, setLastContentId] = useState<string | undefined>(
    () => loadSession().lastContentId
  );

  useEffect(() => {
    const handler = (e: Event) => {
      setLastContentId((e as CustomEvent<string | undefined>).detail);
      setIsPlaying(false);
    };
    window.addEventListener("edor:lastContentId", handler);
    return () => window.removeEventListener("edor:lastContentId", handler);
  }, []);

  const { data: pulseData } = usePulseData();

  const currentContent = lastContentId
    ? (pulseData?.contents.find((c) => c.id === lastContentId) ?? null)
    : null;

  // Reload audio source when content changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !currentContent) return;
    el.src = currentContent.audioUrl;
    el.load();
    setIsPlaying(false);
  }, [currentContent?.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  if (!currentContent) return null;

  return (
    <>
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 39 }}
      />
      <audio ref={audioRef} />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        className="fixed z-40 flex flex-col items-end gap-2 cursor-grab active:cursor-grabbing"
        style={{
          top: 64,
          right: 16,
          viewTransitionName: "mini-player",
          touchAction: "none",
        } as React.CSSProperties}
        whileDrag={{ scale: 1.03 }}
        data-testid="mini-player-wrapper"
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              onClick={() => { if (!isDragging) setIsExpanded(true); }}
              className="glass rounded-full p-1.5 pr-4 flex items-center gap-3 group hover:bg-white/10 transition-colors select-none"
              data-testid="mini-player-collapsed"
            >
              <div className="relative h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {currentContent.artworkUrl ? (
                  <img
                    src={currentContent.artworkUrl}
                    alt={currentContent.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                {isPlaying && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white/20"
                  />
                )}
                {!currentContent.artworkUrl && (
                  <Music className="h-4 w-4 text-primary-foreground relative z-10" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white/90 leading-none truncate max-w-[80px]">
                  {currentContent.title}
                </span>
                <span className="text-[9px] text-white/50 leading-none mt-1">
                  {isPlaying ? "Playing" : "Paused"}
                </span>
              </div>
              <button
                className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/20 transition ml-1 shrink-0"
                onClick={togglePlay}
                data-testid="button-mini-play-toggle"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="glass w-72 rounded-3xl overflow-hidden edor-noise select-none"
              data-testid="mini-player-expanded"
            >
              <div
                className="flex items-center justify-center py-2 border-b border-white/5 cursor-grab active:cursor-grabbing"
                style={{ touchAction: "none" }}
              >
                <GripHorizontal className="h-4 w-4 text-white/20" />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {currentContent.artworkUrl ? (
                        <img
                          src={currentContent.artworkUrl}
                          alt={currentContent.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{currentContent.title}</h4>
                      <p className="text-xs text-white/50 truncate">{currentContent.creator}</p>
                    </div>
                  </div>
                  <button
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/10 transition shrink-0"
                    onClick={() => setIsExpanded(false)}
                    data-testid="button-player-close"
                  >
                    <ChevronDown className="h-4 w-4 text-white/50" />
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90 shadow-xl flex items-center justify-center transition"
                    onClick={togglePlay}
                    data-testid="button-mini-play-expanded"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
