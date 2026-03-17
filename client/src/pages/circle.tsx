import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { endRoom, loadSession } from "@/lib/edorSession";
import {
  usePulseData, useListenChat, useChatMessages, useSendChatMessage,
  useCirclePlayback, useUpdateCirclePlayback, useLeaveListenChat, useCloseListenChat,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Users, X, Clock, QrCode, Play, Pause, Disc, Send } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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
  const [chatOpen, setChatOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room) {
      navigateWithTransition(setLocation, "/");
      return;
    }

    const timer = setInterval(() => {
      const diff = new Date(room.expiresAt).getTime() - Date.now();
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePlayback = useCallback(() => {
    if (!isHost || !audioRef.current || !chatId) return;
    const audio = audioRef.current;
    const nowPlaying = !audio.paused;

    if (nowPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }

    updatePlayback.mutate({
      chatId,
      playing: !nowPlaying,
      currentTime: audio.currentTime,
      hostId: userId,
    });
  }, [isHost, chatId, userId, updatePlayback]);

  function handleEnd() {
    if (chatId) {
      leaveChat.mutate({ chatId, userId });
      if (isHost) closeChat.mutate(chatId);
    }
    endRoom();
    if (content) {
      navigateWithTransition(setLocation, `/content/${content.id}?loc=${location?.id}&roomEnd=1`);
    } else {
      navigateWithTransition(setLocation, "/");
    }
  }

  function handleSendMessage(text: string) {
    if (!text.trim() || !chatId) return;
    sendMessage.mutate({
      chatId,
      userId,
      displayName,
      message: text.trim(),
    });
    setMessageText("");
  }

  const memberCount = chatData?.members?.length || 1;

  if (isLoading) {
    return (
      <Shell title="Circle">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-white/40 text-sm">Loading…</div>
        </div>
      </Shell>
    );
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
          data-testid="button-leave-circle"
        >
          <X className="h-5 w-5" />
        </Button>
      }
    >
      <div className="px-2 py-4 flex flex-col gap-6">
        <audio ref={audioRef} src={content.audioUrl} preload="auto" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {isPlaying ? 'Live Session' : 'Paused'}
            </span>
          </div>
          {!isHost && playbackState?.updatedAt ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Disc className={`h-3 w-3 text-primary ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Synced</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-white/40">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] font-bold">{timeLeft} left</span>
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
            <h2 className="text-xl font-bold text-white mb-1" data-testid="text-circle-title">
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
              data-testid="button-playback"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
          )}
        </Card>

        <div className="flex items-center justify-center gap-4">
          <div className="flex -space-x-3">
            {(chatData?.members || []).slice(0, 4).map((m, i) => (
              <div key={m.id || i} className="h-10 w-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center overflow-hidden" title={m.displayName}>
                <span className="text-[10px] font-bold text-white/60">
                  {m.displayName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            ))}
            {memberCount > 4 && (
              <div className="h-10 w-10 rounded-full border-2 border-black bg-primary flex items-center justify-center text-[10px] font-bold text-black">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <p className="text-xs text-white/40 font-medium" data-testid="text-member-count">
            {memberCount} {memberCount === 1 ? "listener" : "listeners"}
          </p>
        </div>

        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 text-white/60 hover:text-white shrink-0" data-testid="button-qr">
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
                    value={`${window.location.origin}/pulse?joinCircle=${chatId}&loc=${location.id}`}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-center text-sm text-white/60 px-4">
                  Others must be at <span className="text-primary font-bold">{location.name}</span> to join this circle.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={chatOpen} onOpenChange={setChatOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 h-14 rounded-2xl gap-2 font-bold text-sm bg-white text-black hover:bg-white/90" data-testid="button-open-chat">
                <MessageSquare className="h-4 w-4" />
                Chat {messages?.length ? `(${messages.length})` : ""}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-h-[80vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-4 border-b border-white/10">
                <DialogTitle className="text-center font-bold">Circle Chat</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]">
                {(!messages || messages.length === 0) && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-white/30 italic">No messages yet. Say something!</p>
                  </div>
                )}
                {messages?.map((msg) => {
                  const isMe = msg.userId === userId;
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} max-w-[80%] ${isMe ? 'self-end' : ''}`}>
                      <span className="text-[10px] text-white/40 font-bold uppercase mx-1">
                        {isMe ? "You" : msg.displayName}
                      </span>
                      <div className={`${isMe ? 'bg-primary/20 border-primary/30 rounded-2xl rounded-tr-none' : 'bg-white/5 border-white/10 rounded-2xl rounded-tl-none'} border p-3 text-sm text-white/80`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10 bg-black/50 flex flex-col gap-3">
                <div className="flex justify-between px-2">
                  {["🫀", "🔥", "😮‍💨", "✨", "🤯"].map(emoji => (
                    <button
                      key={emoji}
                      className="text-2xl hover:scale-125 transition-transform active:scale-95"
                      onClick={() => handleSendMessage(emoji)}
                      data-testid={`button-emoji-${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {["whos new?", "love this.", "Where are y'all from?", "Drop your IG?"].map(msg => (
                    <Button
                      key={msg}
                      variant="outline"
                      className="text-[10px] h-8 rounded-full border-white/10 text-white/60 font-bold uppercase tracking-wider"
                      onClick={() => handleSendMessage(msg)}
                      data-testid={`button-quick-${msg}`}
                    >
                      {msg}
                    </Button>
                  ))}
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(messageText);
                  }}
                >
                  <Input
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 h-10 rounded-full bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
                    data-testid="input-chat-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 rounded-full shrink-0"
                    disabled={!messageText.trim()}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="h-14 rounded-2xl border-white/10 text-white/60 hover:text-white"
            onClick={handleEnd}
            data-testid="button-leave"
          >
            Leave
          </Button>
        </div>
      </div>
    </Shell>
  );
}
