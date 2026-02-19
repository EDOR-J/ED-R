import { useState, useEffect } from "react";
import Shell from "@/components/edor/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFriends,
  usePendingRequests,
  useFriendsStatuses,
  useSharedLibrary,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriend,
  useDeclineFriend,
  useSeedSocial,
  type ApiUserStatus,
  type ApiSharedLibrary,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Music,
  Headphones,
  MessageCircle,
  Clock,
  Disc3,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react";

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FriendStatusCard({ status, onListenChat }: { status: ApiUserStatus; onListenChat: (s: ApiUserStatus) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all group"
      data-testid={`friend-status-${status.userId}`}
    >
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-white/40">
          {status.displayName.charAt(0)}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-black ${
          status.isOnline ? "bg-green-400" : "bg-white/20"
        }`} data-testid={`status-indicator-${status.userId}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white truncate" data-testid={`text-friend-name-${status.userId}`}>{status.displayName}</p>
          {!status.isOnline && (
            <span className="text-[9px] text-white/25 flex items-center gap-1" data-testid={`text-last-seen-${status.userId}`}>
              <Clock className="h-2.5 w-2.5" /> {timeAgo(status.lastSeen)}
            </span>
          )}
        </div>
        {status.currentContentTitle ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Disc3 className="h-3 w-3 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs text-primary/80 truncate font-medium" data-testid={`text-listening-track-${status.userId}`}>
              {status.currentContentTitle}
            </span>
            <span className="text-[10px] text-white/25" data-testid={`text-listening-artist-${status.userId}`}>by {status.currentContentArtist}</span>
          </div>
        ) : status.statusText ? (
          <p className="text-xs text-white/35 truncate mt-0.5" data-testid={`text-status-${status.userId}`}>{status.statusText}</p>
        ) : null}
      </div>
      {status.currentContentId && (
        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-3 rounded-xl text-xs text-white/40 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all gap-1.5"
          onClick={() => onListenChat(status)}
          data-testid={`button-listen-with-${status.userId}`}
        >
          <Headphones className="h-3.5 w-3.5" />
          Listen
        </Button>
      )}
    </motion.div>
  );
}

function SharedLibraryCard({ item, onStartChat }: { item: ApiSharedLibrary; onStartChat: (item: ApiSharedLibrary) => void }) {
  return (
    <Card
      className="glass border-white/10 rounded-2xl p-4 edor-noise hover:border-primary/20 transition-all cursor-pointer"
      onClick={() => onStartChat(item)}
      data-testid={`shared-library-${item.friendId}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {item.friendName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{item.friendName}</p>
          <p className="text-[10px] text-white/30">{item.sharedContent.length} shared {item.sharedContent.length === 1 ? "track" : "tracks"}</p>
        </div>
        <Button size="sm" variant="ghost" className="ml-auto h-8 px-3 rounded-xl text-xs gap-1.5 text-primary/60 hover:text-primary hover:bg-primary/10" data-testid={`button-start-listen-chat-${item.friendId}`}>
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {item.sharedContent.map(c => (
          <div key={c.contentId} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 shrink-0">
            <Music className="h-3 w-3 text-primary/50" />
            <span className="text-[11px] text-white/60 whitespace-nowrap">{c.title}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function FriendsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id || "";
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Pulse User";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"activity" | "requests" | "discover">("activity");

  const { data: friends } = useFriends(userId);
  const { data: pending } = usePendingRequests(userId);
  const { data: statuses } = useFriendsStatuses(userId);
  const { data: sharedLibrary } = useSharedLibrary(userId);
  const { data: searchResults } = useSearchUsers(searchQuery);

  const sendRequest = useSendFriendRequest();
  const acceptFriend = useAcceptFriend();
  const declineFriend = useDeclineFriend();
  const seedSocial = useSeedSocial();

  const handleSeedSocial = async () => {
    try {
      await seedSocial.mutateAsync();
      toast.success("Social data loaded!");
      window.location.reload();
    } catch {
      toast.error("Already seeded");
    }
  };

  const handleListenChat = (status: ApiUserStatus) => {
    if (status.currentContentId) {
      setLocation(`/listen-chat?friendId=${status.userId}&contentId=${status.currentContentId}`);
    }
  };

  const handleStartSharedChat = (item: ApiSharedLibrary) => {
    if (item.sharedContent.length > 0) {
      setLocation(`/listen-chat?friendId=${item.friendId}&contentId=${item.sharedContent[0].contentId}`);
    }
  };

  if (!userId) {
    return (
      <Shell title="Social">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-10 w-10 text-primary/50" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Set Up Social</h3>
            <p className="text-sm text-white/40 max-w-[280px]">Load demo friends and activity to explore the social features</p>
          </div>
          <Button
            className="h-12 px-8 rounded-2xl gap-2"
            onClick={handleSeedSocial}
            disabled={seedSocial.isPending}
            data-testid="button-seed-social"
          >
            {seedSocial.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Load Demo Data
          </Button>
        </div>
      </Shell>
    );
  }

  const listeningFriends = statuses?.filter(s => s.currentContentId) || [];
  const onlineFriends = statuses?.filter(s => s.isOnline && !s.currentContentId) || [];
  const offlineFriends = statuses?.filter(s => !s.isOnline) || [];

  const statusUserIds = new Set(statuses?.map(s => s.userId) || []);
  const friendsWithoutStatus = (friends || [])
    .map(f => f.senderId === userId ? f.receiverId : f.senderId)
    .filter(id => !statusUserIds.has(id));

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-serif text-white" data-testid="text-social-title">Social</h2>
          <div className="flex items-center gap-2">
            {pending && pending.length > 0 && (
              <div className="h-6 px-2 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-black">{pending.length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25"
            data-testid="input-search-users"
          />
        </div>

        {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
          <Card className="glass border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3" data-testid={`search-result-${u.id}`}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                    {(u.displayName || u.username).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{u.displayName || u.username}</p>
                    <p className="text-[10px] text-white/30">@{u.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 rounded-xl text-xs gap-1.5 text-primary"
                  onClick={() => {
                    sendRequest.mutate({ senderId: userId, receiverId: u.id });
                    toast.success(`Friend request sent to ${u.displayName || u.username}`);
                  }}
                  data-testid={`button-add-friend-${u.id}`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            ))}
          </Card>
        )}

        <div className="flex gap-2">
          {(["activity", "requests", "discover"] as const).map(tab => (
            <Button
              key={tab}
              size="sm"
              variant="ghost"
              className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider ${
                activeTab === tab ? "bg-white/10 text-white" : "text-white/35"
              }`}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tab === "activity" ? "Activity" : tab === "requests" ? `Requests${pending?.length ? ` (${pending.length})` : ""}` : "Discover"}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              {listeningFriends.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1 mb-2">
                    Listening Now
                  </p>
                  <Card className="glass border-white/10 rounded-2xl overflow-hidden edor-noise divide-y divide-white/5">
                    {listeningFriends.map(s => (
                      <FriendStatusCard key={s.userId} status={s} onListenChat={handleListenChat} />
                    ))}
                  </Card>
                </div>
              )}

              {onlineFriends.filter(s => !s.currentContentId).length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1 mb-2">
                    Online
                  </p>
                  <Card className="glass border-white/10 rounded-2xl overflow-hidden edor-noise divide-y divide-white/5">
                    {onlineFriends.filter(s => !s.currentContentId).map(s => (
                      <FriendStatusCard key={s.userId} status={s} onListenChat={handleListenChat} />
                    ))}
                  </Card>
                </div>
              )}

              {offlineFriends.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1 mb-2">
                    Recently Active
                  </p>
                  <Card className="glass border-white/10 rounded-2xl overflow-hidden edor-noise divide-y divide-white/5">
                    {offlineFriends.map(s => (
                      <FriendStatusCard key={s.userId} status={s} onListenChat={handleListenChat} />
                    ))}
                  </Card>
                </div>
              )}

              {friendsWithoutStatus.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1 mb-2">
                    Friends
                  </p>
                  <Card className="glass border-white/10 rounded-2xl overflow-hidden edor-noise divide-y divide-white/5">
                    {friendsWithoutStatus.map(fid => (
                      <div key={fid} className="flex items-center gap-3 p-4" data-testid={`friend-${fid}`}>
                        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white/20">
                          ?
                        </div>
                        <p className="text-sm text-white/50" data-testid={`text-friend-id-${fid}`}>Friend</p>
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {(!friends || friends.length === 0) && (!statuses || statuses.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <Users className="h-12 w-12 text-white/10" />
                  <p className="text-sm text-white/30" data-testid="text-no-friends">No friends yet. Search for people above to send friend requests.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {pending && pending.length > 0 ? (
                <Card className="glass border-white/10 rounded-2xl overflow-hidden edor-noise divide-y divide-white/5">
                  {pending.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4" data-testid={`pending-request-${p.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary/60">
                          ?
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Friend Request</p>
                          <p className="text-[10px] text-white/30">{timeAgo(p.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 px-3 rounded-xl text-xs gap-1"
                          onClick={() => {
                            acceptFriend.mutate(p.id);
                            toast.success("Friend request accepted!");
                          }}
                          data-testid={`button-accept-${p.id}`}
                        >
                          <UserCheck className="h-3 w-3" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 rounded-xl text-xs text-white/30"
                          onClick={() => {
                            declineFriend.mutate(p.id);
                            toast("Request declined");
                          }}
                          data-testid={`button-decline-${p.id}`}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <UserCheck className="h-12 w-12 text-white/10" />
                  <p className="text-sm text-white/30">No pending requests</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1 mb-1">
                Friends with Shared Tracks
              </p>
              {sharedLibrary && sharedLibrary.length > 0 ? (
                sharedLibrary.map(item => (
                  <SharedLibraryCard key={item.friendId} item={item} onStartChat={handleStartSharedChat} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <Music className="h-12 w-12 text-white/10" />
                  <p className="text-sm text-white/30">No shared tracks with friends yet. Pulse at more locations to discover common music.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}
