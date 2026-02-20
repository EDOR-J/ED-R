import { useState, useEffect, useRef } from "react";
import Shell from "@/components/edor/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListenChat,
  useChatMessages,
  useCreateListenChat,
  useJoinListenChat,
  useSendChatMessage,
  useActiveListenChats,
  useSharedLibrary,
  type ApiListenChat,
  type ApiChatMessage,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import {
  Play,
  Pause,
  Send,
  Users,
  Music,
  ArrowLeft,
  Headphones,
  Disc3,
  Plus,
  MessageCircle,
} from "lucide-react";

function ChatBubble({ msg, isOwn }: { msg: ApiChatMessage; isOwn: boolean }) {
  const time = new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-0.5 max-w-[80%] ${isOwn ? "self-end items-end" : "self-start items-start"}`}
      data-testid={`message-${msg.id}`}
    >
      {!isOwn && (
        <span className="text-[9px] text-white/25 font-bold ml-3">{msg.displayName}</span>
      )}
      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
        isOwn
          ? "bg-primary text-black rounded-br-lg"
          : "bg-white/5 text-white/90 rounded-bl-lg border border-white/5"
      }`}>
        {msg.message}
      </div>
      <span className="text-[9px] text-white/15 mx-3">{time}</span>
    </motion.div>
  );
}

function ActiveChatCard({ chat, onClick }: { chat: ApiListenChat; onClick: () => void }) {
  return (
    <Card
      className="glass border-white/10 rounded-2xl p-4 edor-noise hover:border-primary/20 transition-all cursor-pointer"
      onClick={onClick}
      data-testid={`active-chat-${chat.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate" data-testid={`text-chat-name-${chat.id}`}>{chat.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Disc3 className="h-3 w-3 text-primary/50 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs text-white/40 truncate" data-testid={`text-chat-track-${chat.id}`}>{chat.contentTitle} — {chat.contentArtist}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/25 shrink-0">
          <Users className="h-3.5 w-3.5" />
          <span className="text-xs">{chat.members?.length || "?"}</span>
        </div>
      </div>
    </Card>
  );
}

function ListenChatRoom({ chatId }: { chatId: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id || "";
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Pulse User";
  const [message, setMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: chat } = useListenChat(chatId);
  const { data: messages } = useChatMessages(chatId);
  const sendMsg = useSendChatMessage();
  const joinChat = useJoinListenChat();

  useEffect(() => {
    if (chat?.id && userId) {
      joinChat.mutate({ chatId: chat.id, userId, displayName });
    }
  }, [chat?.id, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSend = () => {
    if (!message.trim() || !userId) return;
    sendMsg.mutate({ chatId, userId, displayName, message: message.trim() });
    setMessage("");
  };

  if (!chat) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-3 -mt-2">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl"
            onClick={() => navigateWithTransition(setLocation, "/social")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{chat.name}</h3>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-white/25" />
              <span className="text-[10px] text-white/25">{chat.members?.length || 0} listeners</span>
            </div>
          </div>
        </div>

        <audio ref={audioRef} src={chat.audioUrl} loop />

        <Card className="glass border-white/10 rounded-2xl p-4 edor-noise">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center border border-white/10 ${isPlaying ? 'shadow-lg shadow-primary/20' : ''}`}>
                <Music className="h-6 w-6 text-primary" />
              </div>
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate" data-testid="text-playing-title">{chat.contentTitle}</p>
              <p className="text-xs text-white/40" data-testid="text-playing-artist">{chat.contentArtist}</p>
            </div>
            <Button
              size="icon"
              className={`h-11 w-11 rounded-full ${isPlaying ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={togglePlay}
              data-testid="button-play-toggle"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-2 min-h-[300px] max-h-[400px] overflow-y-auto rounded-2xl p-3 bg-white/[0.02] border border-white/5" data-testid="messages-container">
          {messages && messages.length > 0 ? (
            messages.map(msg => (
              <ChatBubble key={msg.id} msg={msg} isOwn={msg.userId === userId} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-8 gap-3">
              <MessageCircle className="h-8 w-8 text-white/10" />
              <p className="text-xs text-white/20">No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something..."
            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/25 flex-1"
            data-testid="input-message"
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-full shrink-0"
            onClick={handleSend}
            disabled={!message.trim()}
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Shell>
  );
}

export default function ListenChatPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const chatId = params.get("chatId");
  const friendId = params.get("friendId");
  const contentId = params.get("contentId");

  const { user } = useAuth();
  const userId = user?.id || "";
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Pulse User";

  const { data: activeChats } = useActiveListenChats();
  const { data: sharedLibrary } = useSharedLibrary(userId);
  const createChat = useCreateListenChat();

  useEffect(() => {
    if (friendId && contentId && !chatId && sharedLibrary) {
      const friend = sharedLibrary.find(f => f.friendId === friendId);
      const track = friend?.sharedContent.find(c => c.contentId === contentId);
      if (track) {
        createChat.mutate({
          name: `${track.title} Session`,
          contentId: track.contentId,
          contentTitle: track.title,
          contentArtist: track.artist,
          audioUrl: track.audioUrl,
          createdBy: userId,
          displayName,
        }, {
          onSuccess: (chat) => {
            navigateWithTransition(setLocation, `/listen-chat?chatId=${chat.id}`, { replace: true });
          },
        });
      }
    }
  }, [friendId, contentId, sharedLibrary]);

  if (chatId) {
    return <ListenChatRoom chatId={chatId} />;
  }

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-xl"
              onClick={() => navigateWithTransition(setLocation, "/social")}
              data-testid="button-back-to-social"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold font-serif text-white" data-testid="text-listen-chats-title">Listen Chats</h2>
          </div>
        </div>

        {activeChats && activeChats.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1">
              Active Sessions
            </p>
            {activeChats.map(chat => (
              <ActiveChatCard
                key={chat.id}
                chat={chat}
                onClick={() => navigateWithTransition(setLocation, `/listen-chat?chatId=${chat.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Headphones className="h-10 w-10 text-primary/30" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">No Active Listen Chats</h3>
              <p className="text-sm text-white/35 max-w-[280px]">Start a listen chat from a friend's activity or from shared tracks in your library.</p>
            </div>
            <Button
              variant="outline"
              className="h-11 px-6 rounded-2xl border-white/10 text-white/60 gap-2"
              onClick={() => navigateWithTransition(setLocation, "/social")}
              data-testid="button-go-to-friends"
            >
              <Users className="h-4 w-4" /> Browse Friends
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
