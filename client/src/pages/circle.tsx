import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { endRoom, loadSession, addToLibrary } from "@/lib/edorSession";
import { loadEdorData } from "@/lib/edorStore";
import { MessageSquare, Users, X, Clock, QrCode, Play, Pause, Disc } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateRoomEvent, type RoomEvent, blockUser, reportUser } from "@/lib/edorSession";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ShieldAlert, Ban } from "lucide-react";

export default function CircleRoom() {
  const [, setLocation] = useLocation();
  const session = useMemo(() => loadSession(), []);
  const data = useMemo(() => loadEdorData(), []);

  const room = session.activeRoom;
  const location = data.locations.find(l => l.id === room?.nodeId);
  const content = data.contents.find(c => c.id === room?.contentId);

  const [timeLeft, setTimeLeft] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynced, setIsSynced] = useState(true);

  const isHost = room?.hostId === "me";

  useEffect(() => {
    if (!room) {
      setLocation("/");
      return;
    }

    const timer = setInterval(() => {
      const diff = new Date(room.expiresAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        handleEnd();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [room]);

  // Sync effect for all participants
  useEffect(() => {
    if (!room || !audioRef.current) return;

    // Host sends sync events periodically
    const hostInterval = setInterval(() => {
      if (isHost && audioRef.current) {
        const type = audioRef.current.paused ? 'PAUSE' : 'PLAY';
        const at = audioRef.current.currentTime;
        updateRoomEvent({ type, at, timestamp: Date.now() });
      }
    }, 1000);

    // Participant sync logic
    const syncInterval = setInterval(() => {
      if (!isHost && room.lastEvent && audioRef.current) {
        const event = room.lastEvent;
        const now = Date.now();
        const latency = (now - event.timestamp) / 1000;
        const targetTime = event.at + (event.type === 'PLAY' ? latency : 0);

        if (event.type === 'PLAY') {
          if (audioRef.current.paused) audioRef.current.play().catch(() => {});
          const diff = Math.abs(audioRef.current.currentTime - targetTime);
          if (diff > 1.2) {
            audioRef.current.currentTime = targetTime;
          }
          setIsPlaying(true);
        } else {
          if (!audioRef.current.paused) audioRef.current.pause();
          const diff = Math.abs(audioRef.current.currentTime - event.at);
          if (diff > 0.5) {
            audioRef.current.currentTime = event.at;
          }
          setIsPlaying(false);
        }
        setIsSynced(true);
      }
    }, 2000);

    return () => {
      clearInterval(hostInterval);
      clearInterval(syncInterval);
    };
  }, [room, isHost]);

  function handlePlayback() {
    if (!isHost || !audioRef.current) return;
    
    const type = isPlaying ? 'PAUSE' : 'PLAY';
    const at = audioRef.current.currentTime;
    const event: RoomEvent = { type, at, timestamp: Date.now() };
    
    updateRoomEvent(event);
    if (type === 'PLAY') audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    setIsPlaying(!isPlaying);
  }

  function handleEnd() {
    // Save a "synapse" associated with the content
    if (content && room) {
      const synapse = {
        id: Math.random().toString(36).slice(2),
        locationName: location?.name || "Unknown",
        endedAt: new Date().toISOString(),
        participantsCount: 15, // Mock data
        reactions: { "🫀": 12, "🔥": 8, "✨": 5 } // Mock data
      };

      const s = loadSession();
      const existingIndex = s.library.findIndex(i => i.contentId === content.id);
      
      if (existingIndex > -1) {
        const item = s.library[existingIndex];
        if (!item.synapses) item.synapses = [];
        item.synapses.push(synapse);
        s.library[existingIndex] = { ...item };
        localStorage.setItem("edor:pulse:session:v1", JSON.stringify(s));
      } else {
        // Just in case it wasn't in library, though it should be after Pulse
        addToLibrary({
          contentId: content.id,
          title: content.title,
          artist: content.creator,
          mode: "discover",
          nodeId: room.nodeId,
          locationName: location?.name || "Unknown",
          unlockedAt: new Date().toISOString(),
          audioUrl: content.audioUrl,
          artworkUrl: "",
        });
        // We'd recurse or just skip synapse for simplicity in mockup
      }
    }
    
    endRoom();
    if (content) {
      setLocation(`/content/${content.id}?loc=${location?.id}&roomEnd=1`);
    } else {
      setLocation("/");
    }
  }

  if (!room || !location || !content) return null;

  return (
    <Shell
      title={`Circle: ${location.name}`}
      right={
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-white/40"
          onClick={handleEnd}
        >
          <X className="h-5 w-5" />
        </Button>
      }
    >
      <div className="px-6 py-4 flex flex-col gap-6">
        <audio ref={audioRef} src={content.audioUrl} preload="auto" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {isPlaying ? 'Live Session' : 'Paused'}
            </span>
          </div>
          {isSynced && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Disc className={`h-3 w-3 text-primary ${isPlaying ? 'animate-spin-slow' : ''}`} />
              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Synced with host</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/40">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] font-bold">{timeLeft} remaining</span>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 rounded-3xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden">
          {isPlaying && (
            <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
          )}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 relative z-10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-1">
              Listening Circle — {location.name}
            </h2>
            <p className="text-sm text-white/60">
              Now listening to <span className="text-primary font-bold">{content.title}</span>
            </p>
          </div>

          {isHost && (
            <Button 
              size="lg"
              className="mt-2 h-12 w-12 rounded-full p-0 flex items-center justify-center relative z-10"
              onClick={handlePlayback}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
          )}
        </Card>

        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-center px-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-[200px]">
            <p className="text-xs text-white/40 leading-relaxed italic">
              "You are in a sacred space. Connect with others through the sound."
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-tr from-white/10 to-transparent" />
                </div>
              ))}
              <div className="h-10 w-10 rounded-full border-2 border-black bg-primary flex items-center justify-center text-[10px] font-bold text-black">
                +12
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 text-white/60 hover:text-white shrink-0">
                <QrCode className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-center font-bold">Invite to Circle</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-white p-4 rounded-3xl">
                  <QRCodeSVG 
                    value={`${window.location.origin}/pulse?join=${room.id}&loc=${location.id}`} 
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-center text-sm text-white/60 px-4">
                  Others must be at <span className="text-primary font-bold">{location.name}</span> to join this session.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 h-14 rounded-2xl gap-2 font-bold text-sm bg-white text-black hover:bg-white/90">
                <MessageSquare className="h-4 w-4" />
                Join Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-h-[80vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-4 border-b border-white/10">
                <DialogTitle className="text-center font-bold">Circle Chat</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]">
                <div className="flex flex-col gap-1 items-start max-w-[80%] group">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-[10px] text-white/40 font-bold uppercase ml-1">Member_82</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <MoreHorizontal className="h-3 w-3 text-white/40" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-[#0A0A0A] border-white/10 text-white">
                        <DropdownMenuItem 
                          className="gap-2 text-xs focus:bg-white/5"
                          onClick={() => {
                            blockUser("Member_82");
                            toast.success("User blocked");
                          }}
                        >
                          <Ban className="h-3 w-3" /> Block
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-xs text-red-400 focus:bg-red-400/10 focus:text-red-400"
                          onClick={() => {
                            reportUser({ 
                              roomId: room.id, 
                              nodeId: room.nodeId, 
                              reportedId: "Member_82", 
                              reason: "Inappropriate behavior" 
                            });
                            toast.success("Report submitted");
                          }}
                        >
                          <ShieldAlert className="h-3 w-3" /> Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 text-sm text-white/80">
                    Welcome to the Circle. Connect with those around you.
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10 bg-black/50 flex flex-col gap-4">
                <div className="flex justify-between px-2">
                  {["🫀", "🔥", "😮‍💨", "✨", "🤯"].map(emoji => (
                    <button key={emoji} className="text-2xl hover:scale-125 transition-transform active:scale-95">
                      {emoji}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {["whos new?", "love this.", "Where are y’all from?", "Drop your IG?"].map(msg => (
                    <Button 
                      key={msg} 
                      variant="outline" 
                      className="text-[10px] h-8 rounded-full border-white/10 text-white/60 font-bold uppercase tracking-wider"
                    >
                      {msg}
                    </Button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            className="h-14 rounded-2xl border-white/10 text-white/60 hover:text-white"
            onClick={handleEnd}
          >
            Leave
          </Button>
        </div>
      </div>
    </Shell>
  );
}
