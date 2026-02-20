import { useState, useRef, useEffect } from "react";
import { loadEdorData } from "@/lib/edorStore";
import { loadSession } from "@/lib/edorSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  Trophy, 
  Music,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const data = loadEdorData();
  const session = loadSession();
  
  // Get current playing content (mocking it from session or first content)
  const currentContent = data.contents.find(c => c.id === session.lastContentId) || data.contents[0];
  
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!currentContent) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2" style={{ viewTransitionName: "mini-player" } as React.CSSProperties}>
      <audio ref={audioRef} src={currentContent.audioUrl} loop />
      
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            onClick={() => setIsExpanded(true)}
            className="glass rounded-full p-1.5 pr-4 flex items-center gap-3 cursor-pointer group hover:bg-white/10 transition-colors"
            data-testid="mini-player-collapsed"
          >
            <div className="relative h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg overflow-hidden">
               {isPlaying && (
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="absolute inset-0 bg-white/20" 
                 />
               )}
               <Music className="h-4 w-4 text-primary-foreground relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/90 leading-none truncate max-w-[80px]">
                {currentContent.title}
              </span >
              <span className="text-[9px] text-white/50 leading-none mt-1">
                {isPlaying ? "Playing" : "Paused"}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full hover:bg-white/20 ml-1"
              onClick={togglePlay}
              data-testid="button-mini-play-toggle"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="glass w-72 rounded-3xl p-4 overflow-hidden edor-noise"
            data-testid="mini-player-expanded"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{currentContent.title}</h4>
                  <p className="text-xs text-white/50 truncate">{currentContent.creator}</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-white/10"
                onClick={() => setIsExpanded(false)}
                data-testid="button-player-close"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-6">
                 <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                   <Heart className="h-5 w-5" />
                 </Button>
                 <Button 
                   size="icon" 
                   className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90 shadow-xl"
                   onClick={togglePlay}
                 >
                   {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                 </Button>
                 <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                   <Trophy className="h-5 w-5" />
                 </Button>
              </div>

              {/* Reward Stats */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Reward Stats</span>
                   <span className="text-[10px] text-primary font-bold">LVL 4</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">1,240</span>
                    <span className="text-[9px] text-white/40 uppercase">Pulse Points</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-white">#12</span>
                    <span className="text-[9px] text-white/40 uppercase">Top Fan</span>
                  </div>
                </div>
                <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
