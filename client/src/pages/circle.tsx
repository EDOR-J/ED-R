import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { endRoom, loadSession } from "@/lib/edorSession";
import {
  usePulseData, useListenChat, useChatMessages, useSendChatMessage,
  useCirclePlayback, useUpdateCirclePlayback, useLeaveListenChat, useCloseListenChat,
  type ApiChatMember, type ApiChatMessage,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  X, Clock, QrCode, Play, Pause, Send, Crown, Lock, MessageSquare,
  SkipBack, SkipForward, Volume2, VolumeX, Music
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const MEMBER_COLORS = [
  "rgb(251,191,36)", "rgb(52,211,153)", "rgb(96,165,250)", "rgb(244,114,182)",
  "rgb(167,139,250)", "rgb(251,146,60)", "rgb(45,212,191)", "rgb(248,113,113)",
  "rgb(163,230,53)", "rgb(129,140,248)",
];

function getMemberColor(index: number) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type ChatTab = "circle" | "dm";

export default function CircleRoom() {
  const [, setLocation] = useLocation();
  const session = useMemo(() => loadSession(), []);
  const { data: pulseData, isLoading } = usePulseData();
  const { user } = useAuth();

  const room = session.activeRoom;
  const chatId = room?.serverChatId || "";
  const userId = user?.id || "guest";
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Guest";
  const isHost = room?.hostId === userId;

  const location = pulseData?.locations.find(l => l.id === room?.nodeId);
  const content = pulseData?.contents.find(c => c.id === room?.contentId);

  const { data: chatData } = useListenChat(chatId);
  const { data: messages } = useChatMessages(chatId);
  const { data: playbackState } = useCirclePlayback(chatId);
  const sendMessage = useSendChatMessage();
  const updatePlayback = useUpdateCirclePlayback();
  const leaveChat = useLeaveListenChat();
  const closeChat = useCloseListenChat();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [chatTab, setChatTab] = useState<ChatTab>("circle");
  const [isTyping, setIsTyping] = useState(false);
  const [dmTarget, setDmTarget] = useState<ApiChatMember | null>(null);
  const [dmText, setDmText] = useState("");
  const [dmMessages, setDmMessages] = useState<Array<{ id: string; from: string; to: string; text: string; fromName: string }>>([]);
  const [floatingMessages, setFloatingMessages] = useState<Array<{ id: string; msg: ApiChatMessage; memberIndex: number }>>([]);
  const [isSeeking, setIsSeeking] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessageCountRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room) {
      navigateWithTransition(setLocation, "/circles");
      return;
    }
    const timer = setInterval(() => {
      const diff = new Date(room.expiresAt).getTime() - Date.now();
      if (diff <= 0) { handleEnd(); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [room]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => { if (!isSeeking) setCurrentTime(audio.currentTime); };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isSeeking]);

  useEffect(() => {
    if (!isHost && playbackState && audioRef.current) {
      const audio = audioRef.current;
      const elapsed = (Date.now() - playbackState.updatedAt) / 1000;
      const targetTime = playbackState.playing
        ? playbackState.currentTime + elapsed
        : playbackState.currentTime;
      if (playbackState.playing) {
        if (audio.paused) audio.play().catch(() => {});
        const drift = Math.abs(audio.currentTime - targetTime);
        if (drift > 2) audio.currentTime = targetTime;
        setIsPlaying(true);
      } else {
        if (!audio.paused) audio.pause();
        const drift = Math.abs(audio.currentTime - playbackState.currentTime);
        if (drift > 0.5) audio.currentTime = playbackState.currentTime;
        setIsPlaying(false);
      }
    }
  }, [playbackState, isHost]);

  useEffect(() => {
    if (!isHost || !audioRef.current || !chatId) return;
    const interval = setInterval(() => {
      if (audioRef.current) {
        updatePlayback.mutate({
          chatId,
          playing: !audioRef.current.paused,
          currentTime: audioRef.current.currentTime,
          hostId: userId,
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isHost, chatId, userId]);

  useEffect(() => {
    if (!messages || !chatData?.members) return;
    if (messages.length > prevMessageCountRef.current) {
      const newMsgs = messages.slice(prevMessageCountRef.current);
      const mems = chatData.members || [];
      const newFloating = newMsgs.map(msg => {
        const memberIdx = mems.findIndex(m => m.userId === msg.userId);
        return { id: msg.id, msg, memberIndex: memberIdx >= 0 ? memberIdx : 0 };
      });
      setFloatingMessages(prev => [...prev, ...newFloating]);
      newFloating.forEach(f => {
        setTimeout(() => {
          setFloatingMessages(prev => prev.filter(p => p.id !== f.id));
        }, 5000);
      });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, chatData?.members]);

  const handlePlayback = useCallback(() => {
    if (!isHost || !audioRef.current || !chatId) return;
    const audio = audioRef.current;
    const nowPlaying = !audio.paused;
    if (nowPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().catch(() => {}); setIsPlaying(true); }
    updatePlayback.mutate({ chatId, playing: !nowPlaying, currentTime: audio.currentTime, hostId: userId });
  }, [isHost, chatId, userId, updatePlayback]);

  const handleSeek = useCallback((clientX: number) => {
    if (!isHost || !progressBarRef.current || !audioRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    updatePlayback.mutate({ chatId, playing: !audioRef.current.paused, currentTime: newTime, hostId: userId });
  }, [isHost, duration, chatId, userId, updatePlayback]);

  const handleSkip = useCallback((delta: number) => {
    if (!isHost || !audioRef.current) return;
    const audio = audioRef.current;
    const newTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    updatePlayback.mutate({ chatId, playing: !audio.paused, currentTime: newTime, hostId: userId });
  }, [isHost, chatId, userId, updatePlayback]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback((val: number) => {
    if (!audioRef.current) return;
    const v = Math.max(0, Math.min(1, val));
    audioRef.current.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  function handleEnd() {
    if (chatId) {
      leaveChat.mutate({ chatId, userId });
      if (isHost) closeChat.mutate(chatId);
    }
    endRoom();
    if (content) {
      navigateWithTransition(setLocation, `/content/${content.id}?loc=${location?.id}&roomEnd=1`);
    } else {
      navigateWithTransition(setLocation, "/circles");
    }
  }

  function handleSendMessage(text: string) {
    if (!text.trim() || !chatId) return;
    sendMessage.mutate({ chatId, userId, displayName, message: text.trim() });
    setMessageText("");
    setIsTyping(false);
  }

  function handleTyping(val: string) {
    setMessageText(val);
    if (val.length > 0 && !isTyping) setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  }

  function handleSendDM(text: string) {
    if (!text.trim() || !dmTarget) return;
    setDmMessages(prev => [...prev, {
      id: `dm-${Date.now()}`,
      from: userId,
      to: dmTarget.userId,
      text: text.trim(),
      fromName: displayName,
    }]);
    setDmText("");
  }

  const members = chatData?.members || [];
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (!room || !content) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden" data-testid="circle-room">
      <audio ref={audioRef} src={content.audioUrl} preload="auto" />

      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-2 w-2 rounded-full shrink-0 ${isPlaying ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
          <span className="text-xs font-bold text-primary uppercase tracking-wider truncate">
            {content.title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-white/30">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] font-bold">{timeLeft}</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-white/30 hover:text-white/60 transition-colors" data-testid="button-qr">
                <QrCode className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-center font-bold">Invite to Circle</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-white p-4 rounded-3xl">
                  <QRCodeSVG
                    value={`${window.location.origin}/pulse?joinCircle=${chatId}${location ? `&loc=${location.id}` : ''}`}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-center text-sm text-white/60 px-4">
                  Scan to join <span className="text-primary font-bold">{content.title}</span>
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <button
            className="text-white/30 hover:text-white/60 transition-colors"
            onClick={handleEnd}
            data-testid="button-leave-circle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
        <CircleFormation
          members={members}
          userId={userId}
          isPlaying={isPlaying}
          isHost={isHost}
          isTyping={isTyping}
          onPlayback={handlePlayback}
          floatingMessages={floatingMessages}
          onMemberTap={(m) => { setDmTarget(m); setChatTab("dm"); }}
          content={content}
          currentTime={currentTime}
          duration={duration}
        />
      </div>

      <div className="shrink-0 px-4 pb-1">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shrink-0">
              {content.artworkUrl ? (
                <img src={content.artworkUrl} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Music className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate" data-testid="text-player-title">{content.title}</p>
              <p className="text-[10px] text-white/40 truncate">{content.creator}</p>
            </div>
            <button
              onClick={toggleMute}
              className="text-white/30 hover:text-white/60 transition-colors shrink-0"
              data-testid="button-mute"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div
            ref={progressBarRef}
            className="relative h-1.5 rounded-full bg-white/[0.06] mb-2 group cursor-pointer"
            onClick={(e) => handleSeek(e.clientX)}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            data-testid="progress-bar"
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${progressPct}%` }}
              layout
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
            {isPlaying && (
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
                style={{ width: `${progressPct}%` }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-white/25 tabular-nums w-10">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSkip(-10)}
                className={`transition-colors ${isHost ? 'text-white/40 hover:text-white/70 active:scale-90' : 'text-white/10 cursor-not-allowed'}`}
                disabled={!isHost}
                data-testid="button-skip-back"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <motion.button
                onClick={isHost ? handlePlayback : undefined}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  isHost
                    ? 'bg-primary text-black hover:bg-primary/90 active:scale-90'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
                whileTap={isHost ? { scale: 0.85 } : {}}
                data-testid="button-playback-main"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </motion.button>
              <button
                onClick={() => handleSkip(10)}
                className={`transition-colors ${isHost ? 'text-white/40 hover:text-white/70 active:scale-90' : 'text-white/10 cursor-not-allowed'}`}
                disabled={!isHost}
                data-testid="button-skip-forward"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
            <span className="text-[9px] font-mono text-white/25 tabular-nums w-10 text-right">{formatTime(duration)}</span>
          </div>

          {!isHost && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={isPlaying ? { scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[8px] font-bold text-primary/60 uppercase tracking-wider">
                {isPlaying ? "Synced with host" : "Host paused"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="flex border-b border-white/5">
          <button
            className={`flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${
              chatTab === "circle" ? "text-primary border-b-2 border-primary" : "text-white/30"
            }`}
            onClick={() => setChatTab("circle")}
            data-testid="tab-circle-chat"
          >
            <MessageSquare className="h-3 w-3 inline mr-1.5" />
            Circle {messages?.length ? `(${messages.length})` : ""}
          </button>
          <button
            className={`flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
              chatTab === "dm" ? "text-primary border-b-2 border-primary" : "text-white/30"
            }`}
            onClick={() => setChatTab("dm")}
            data-testid="tab-dm"
          >
            <Lock className="h-3 w-3 inline mr-1.5" />
            Direct {dmMessages.length > 0 && (
              <span className="absolute -top-0.5 right-4 h-4 w-4 rounded-full bg-primary text-[8px] text-black font-bold flex items-center justify-center">
                {dmMessages.length}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {chatTab === "circle" ? (
            <motion.div key="circle-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
              <div className="max-h-[100px] overflow-y-auto px-3 py-2 flex flex-col gap-1.5 scrollbar-none">
                {(!messages || messages.length === 0) ? (
                  <p className="text-[10px] text-white/20 text-center py-2 italic">No messages yet</p>
                ) : (
                  messages.slice(-8).map((msg) => {
                    const isMe = msg.userId === userId;
                    const idx = members.findIndex(m => m.userId === msg.userId);
                    const color = getMemberColor(idx >= 0 ? idx : 0);
                    return (
                      <div key={msg.id} className="flex items-start gap-2" data-testid={`msg-${msg.id}`}>
                        <div
                          className="h-4 w-4 rounded-full border-2 shrink-0 mt-0.5"
                          style={{ borderColor: color, background: `${color}15` }}
                        />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider mr-1.5" style={{ color }}>
                            {isMe ? "You" : msg.displayName}
                          </span>
                          <span className="text-[11px] text-white/70">{msg.message}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-center gap-3 px-3 py-1">
                {["🫀", "🔥", "😮‍💨", "✨", "🤯"].map(emoji => (
                  <button
                    key={emoji}
                    className="text-lg hover:scale-125 transition-transform active:scale-90"
                    onClick={() => handleSendMessage(emoji)}
                    data-testid={`button-emoji-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form
                className="flex gap-2 px-3 pb-3 pt-1"
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(messageText); }}
              >
                <Input
                  value={messageText}
                  onChange={e => handleTyping(e.target.value)}
                  placeholder="Say something..."
                  className="flex-1 h-9 rounded-full bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20"
                  data-testid="input-chat-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0"
                  disabled={!messageText.trim()}
                  data-testid="button-send-message"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="dm-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
              {!dmTarget ? (
                <div className="px-3 py-3 flex flex-col gap-2">
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Tap a member to DM</p>
                  <div className="flex flex-wrap gap-2">
                    {members.filter(m => m.userId !== userId).map((m) => {
                      const idx = members.indexOf(m);
                      const color = getMemberColor(idx);
                      return (
                        <button
                          key={m.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-colors hover:bg-white/5"
                          style={{ borderColor: `${color}40` }}
                          onClick={() => setDmTarget(m)}
                          data-testid={`dm-select-${m.userId}`}
                        >
                          <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: color }} />
                          <span className="text-[10px] font-bold text-white/60">{m.displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <button onClick={() => setDmTarget(null)} className="text-white/30 hover:text-white/60">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div
                      className="h-4 w-4 rounded-full border-2"
                      style={{ borderColor: getMemberColor(members.indexOf(dmTarget)) }}
                    />
                    <span className="text-xs font-bold text-white/60">{dmTarget.displayName}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase">Private</span>
                  </div>
                  <div className="max-h-[80px] overflow-y-auto px-3 py-2 flex flex-col gap-1.5 scrollbar-none">
                    {dmMessages.filter(d =>
                      (d.from === userId && d.to === dmTarget.userId) ||
                      (d.from === dmTarget.userId && d.to === userId)
                    ).map(d => (
                      <div key={d.id} className={`flex ${d.from === userId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`text-[11px] px-2.5 py-1 rounded-full max-w-[70%] ${
                          d.from === userId
                            ? 'bg-primary/20 text-white/80'
                            : 'bg-white/5 text-white/70'
                        }`}>
                          {d.text}
                        </div>
                      </div>
                    ))}
                    {dmMessages.filter(d =>
                      (d.from === userId && d.to === dmTarget.userId) ||
                      (d.from === dmTarget.userId && d.to === userId)
                    ).length === 0 && (
                      <p className="text-[10px] text-white/20 text-center py-2 italic">Start a private conversation</p>
                    )}
                  </div>
                  <form
                    className="flex gap-2 px-3 pb-3 pt-1"
                    onSubmit={(e) => { e.preventDefault(); handleSendDM(dmText); }}
                  >
                    <Input
                      value={dmText}
                      onChange={e => setDmText(e.target.value)}
                      placeholder={`DM ${dmTarget.displayName}...`}
                      className="flex-1 h-9 rounded-full bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20"
                      data-testid="input-dm-message"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-9 w-9 rounded-full shrink-0"
                      disabled={!dmText.trim()}
                      data-testid="button-send-dm"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CircleFormation({
  members,
  userId,
  isPlaying,
  isHost,
  isTyping,
  onPlayback,
  floatingMessages,
  onMemberTap,
  content,
  currentTime,
  duration,
}: {
  members: ApiChatMember[];
  userId: string;
  isPlaying: boolean;
  isHost: boolean;
  isTyping: boolean;
  onPlayback: () => void;
  floatingMessages: Array<{ id: string; msg: ApiChatMessage; memberIndex: number }>;
  onMemberTap: (m: ApiChatMember) => void;
  content: { title: string; creator: string };
  currentTime: number;
  duration: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(260);

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    setSize(Math.min(w, h, 300) - 20);
  }, []);

  const radius = size / 2 - 28;
  const ringSize = members.length <= 4 ? 42 : members.length <= 8 ? 36 : 30;
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0.85, 0.6, 0.35].map((scale, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/[0.03]"
              style={{ width: size * scale, height: size * scale }}
              animate={isPlaying ? {
                scale: [1, 1.02, 1],
                opacity: [0.3, 0.5, 0.3],
              } : {}}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 100 100" className="absolute">
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="2.5"
            />
            <motion.circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="rgb(251,191,36)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${progressPct * 2.89} ${289 - progressPct * 2.89}`}
              strokeDashoffset="72.25"
              style={{ filter: isPlaying ? 'drop-shadow(0 0 4px rgba(251,191,36,0.4))' : 'none' }}
            />
          </svg>
        </div>

        <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5 pointer-events-none">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
            {members.length} {members.length === 1 ? "listener" : "listeners"}
          </span>
        </div>

        {members.map((member, i) => {
          const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const color = getMemberColor(i);
          const isMe = member.userId === userId;
          const isMemberHost = member.userId === (members[0]?.userId);
          const isMeTyping = isMe && isTyping;
          const memberFloating = floatingMessages.filter(f => f.memberIndex === i);

          return (
            <div
              key={member.id}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px - ${ringSize / 2}px)`,
                top: `calc(50% + ${y}px - ${ringSize / 2}px)`,
              }}
            >
              <AnimatePresence>
                {memberFloating.map((f, fi) => (
                  <motion.div
                    key={f.id}
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20"
                    style={{ bottom: ringSize + 8 + fi * 28 }}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className="px-2.5 py-1 rounded-full text-[10px] font-medium max-w-[140px] truncate"
                      style={{
                        background: `${color}20`,
                        border: `1px solid ${color}40`,
                        color: `${color}`,
                      }}
                    >
                      {f.msg.message}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                className="relative"
                onClick={() => !isMe && onMemberTap(member)}
                whileHover={!isMe ? { scale: 1.1 } : {}}
                whileTap={!isMe ? { scale: 0.95 } : {}}
                data-testid={`member-ring-${member.userId}`}
              >
                <motion.div
                  className="rounded-full flex items-center justify-center relative"
                  style={{
                    width: ringSize,
                    height: ringSize,
                    border: `2.5px solid ${color}`,
                    background: `${color}10`,
                  }}
                  animate={isMeTyping ? {
                    borderWidth: ['2.5px', '4px', '2.5px'],
                    boxShadow: [`0 0 0px ${color}00`, `0 0 12px ${color}60`, `0 0 0px ${color}00`],
                  } : isPlaying ? {
                    boxShadow: [`0 0 0px ${color}00`, `0 0 8px ${color}30`, `0 0 0px ${color}00`],
                  } : {}}
                  transition={{ duration: isMeTyping ? 0.8 : 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span
                    className="font-bold"
                    style={{ color, fontSize: ringSize < 36 ? '10px' : '12px' }}
                  >
                    {member.displayName?.charAt(0)?.toUpperCase() || "?"}
                  </span>

                  {isMemberHost && (
                    <div
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                      style={{ background: color }}
                    >
                      <Crown className="h-2.5 w-2.5 text-black" />
                    </div>
                  )}

                  {isMe && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <div className="text-[7px] font-bold uppercase tracking-wider px-1 rounded-full bg-white/10 text-white/50">
                        you
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
