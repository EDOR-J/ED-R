import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useActiveListenChats, useUserCircles, useCreateListenChat, useJoinListenChat,
  useLibrary, useFriends, useFriendsStatuses,
  type ApiListenChat, type ApiLibraryItem, type ApiUserStatus,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { startRoom, loadSession } from "@/lib/edorSession";
import { useViewTransitionNavigate } from "@/hooks/use-view-transition";
import { useLocation as useWouterLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, Users, Play, Lock, Globe, Crown, Music, Headphones,
  ChevronRight, Settings2, Shield, UserPlus, Radio, Disc,
  Sparkles, Clock, Hash, Eye, EyeOff, MessageSquare, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CreateStep = "track" | "settings" | "invite";

export default function CirclesHub() {
  const { user } = useAuth();
  const userId = user?.id || "guest";
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Guest";
  const navigate = useViewTransitionNavigate();
  const [, setLocation] = useWouterLocation();

  const { data: allCircles } = useActiveListenChats();
  const { data: myCircles } = useUserCircles(userId);
  const { data: library } = useLibrary();
  const { data: friends } = useFriends(userId);
  const { data: friendStatuses } = useFriendsStatuses(userId);

  const createChat = useCreateListenChat();
  const joinChat = useJoinListenChat();

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("track");
  const [selectedTrack, setSelectedTrack] = useState<ApiLibraryItem | null>(null);
  const [circleName, setCircleName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [maxMembers, setMaxMembers] = useState(20);
  const [allowChat, setAllowChat] = useState(true);
  const [trackSearch, setTrackSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const session = loadSession();
  const isInActiveCircle = !!session.activeRoom;

  const activeCircles = useMemo(() => {
    return (allCircles || []).filter(c => c.isActive);
  }, [allCircles]);

  const myActiveCircles = useMemo(() => {
    return (myCircles || []).filter(c => c.isActive);
  }, [myCircles]);

  const publicCircles = useMemo(() => {
    return activeCircles.filter(c => !c.isPrivate && !myActiveCircles.some(mc => mc.id === c.id));
  }, [activeCircles, myActiveCircles]);

  const filteredLibrary = useMemo(() => {
    if (!library) return [];
    if (!trackSearch) return library;
    const q = trackSearch.toLowerCase();
    return library.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [library, trackSearch]);

  const friendsListening = useMemo(() => {
    return (friendStatuses || []).filter(s => s.isOnline && s.currentContentTitle);
  }, [friendStatuses]);

  function resetCreate() {
    setCreateStep("track");
    setSelectedTrack(null);
    setCircleName("");
    setIsPrivate(false);
    setIsRemote(false);
    setMaxMembers(20);
    setAllowChat(true);
    setTrackSearch("");
  }

  async function handleCreate() {
    if (!selectedTrack) return;
    try {
      const chat = await createChat.mutateAsync({
        name: circleName || `${displayName}'s Circle`,
        contentId: selectedTrack.contentId,
        contentTitle: selectedTrack.title,
        contentArtist: selectedTrack.artist,
        audioUrl: selectedTrack.audioUrl,
        createdBy: userId,
        displayName,
        isPrivate,
        isRemote,
        maxMembers,
        allowChat,
        locationId: isRemote ? undefined : selectedTrack.nodeId,
      });

      startRoom({
        nodeId: selectedTrack.nodeId,
        contentId: selectedTrack.contentId,
        mode: selectedTrack.mode as "discover" | "park",
        expiresAt: new Date(Date.now() + 45 * 60000).toISOString(),
      }, { serverChatId: chat.id, hostId: userId });

      setCreateOpen(false);
      resetCreate();
      navigate("/circle");
    } catch {
      toast.error("Failed to create circle");
    }
  }

  async function handleJoin(circle: ApiListenChat) {
    try {
      await joinChat.mutateAsync({
        chatId: circle.id,
        userId,
        displayName,
      });

      startRoom({
        nodeId: circle.locationId || "",
        contentId: circle.contentId,
        mode: "discover",
        expiresAt: new Date(Date.now() + 45 * 60000).toISOString(),
      }, { serverChatId: circle.id });

      navigate("/circle");
    } catch (err: any) {
      toast.error(err?.message || "Failed to join circle");
    }
  }

  return (
    <Shell title="Circles">
      <div className="px-2 py-4 flex flex-col gap-6 pb-28">

        {isInActiveCircle && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card
              className="edor-noise glass border-primary/30 rounded-3xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate("/circle")}
              data-testid="card-active-circle"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Disc className="h-6 w-6 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">You're in a Circle</p>
                  <p className="text-sm text-white/60 truncate">Tap to return to your session</p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </div>
            </Card>
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white" data-testid="text-circles-heading">Listen Together</h2>
            <p className="text-xs text-white/40 mt-0.5">Start or join a shared listening session</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-white/10" data-testid="button-circle-settings">
                  <Settings2 className="h-4 w-4 text-white/60" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Default Circle Settings
                  </DialogTitle>
                </DialogHeader>
                <CircleSettingsPanel />
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreate(); }}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-2xl gap-2 font-bold text-sm px-4" data-testid="button-create-circle">
                  <Plus className="h-4 w-4" /> New Circle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/10">
                  <DialogTitle className="text-center font-bold">
                    {createStep === "track" && "Choose a Track"}
                    {createStep === "settings" && "Circle Settings"}
                    {createStep === "invite" && "Invite Friends"}
                  </DialogTitle>
                </DialogHeader>

                <AnimatePresence mode="wait">
                  {createStep === "track" && (
                    <motion.div key="track" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                      <Input
                        placeholder="Search your library…"
                        value={trackSearch}
                        onChange={e => setTrackSearch(e.target.value)}
                        className="h-10 rounded-full bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
                        data-testid="input-track-search"
                      />
                      {filteredLibrary.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-white/30">
                          <Music className="h-8 w-8 mb-2" />
                          <p className="text-sm">No tracks found</p>
                          <p className="text-xs mt-1">Unlock content at Pulse locations first</p>
                        </div>
                      )}
                      {filteredLibrary.map(track => (
                        <Card
                          key={track.id}
                          className={`p-3 rounded-2xl cursor-pointer transition-all ${
                            selectedTrack?.id === track.id
                              ? "bg-primary/15 border-primary/40"
                              : "bg-white/5 border-white/10 hover:bg-white/8"
                          }`}
                          onClick={() => {
                            setSelectedTrack(track);
                            setCircleName(`${track.title} — Circle`);
                          }}
                          data-testid={`card-track-${track.contentId}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-white/10 shrink-0">
                              <Music className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{track.title}</p>
                              <p className="text-xs text-white/40 truncate">{track.artist}</p>
                            </div>
                            {selectedTrack?.id === track.id && (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Play className="h-3 w-3 text-black ml-0.5" />
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                      <div className="pt-2">
                        <Button
                          className="w-full h-12 rounded-2xl font-bold"
                          disabled={!selectedTrack}
                          onClick={() => setCreateStep("settings")}
                          data-testid="button-next-settings"
                        >
                          Next: Settings <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {createStep === "settings" && (
                    <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Circle Name</label>
                        <Input
                          value={circleName}
                          onChange={e => setCircleName(e.target.value)}
                          placeholder="Name your circle…"
                          className="h-10 rounded-xl bg-white/5 border-white/10 text-white text-sm"
                          data-testid="input-circle-name"
                        />
                      </div>

                      <Card className="bg-white/5 border-white/10 rounded-2xl divide-y divide-white/5">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Lock className="h-4 w-4 text-white/40" />
                            <div>
                              <p className="text-sm font-bold text-white">Private Circle</p>
                              <p className="text-[10px] text-white/40">Invite-only access</p>
                            </div>
                          </div>
                          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} data-testid="switch-private" />
                        </div>

                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-white/40" />
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                Remote Listening
                                <span className="text-[8px] font-bold text-primary uppercase px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">Premium</span>
                              </p>
                              <p className="text-[10px] text-white/40">Listen from anywhere, no location needed</p>
                            </div>
                          </div>
                          <Switch checked={isRemote} onCheckedChange={setIsRemote} data-testid="switch-remote" />
                        </div>

                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-4 w-4 text-white/40" />
                            <div>
                              <p className="text-sm font-bold text-white">Circle Chat</p>
                              <p className="text-[10px] text-white/40">Allow messages during session</p>
                            </div>
                          </div>
                          <Switch checked={allowChat} onCheckedChange={setAllowChat} data-testid="switch-chat" />
                        </div>

                        <div className="p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <Users className="h-4 w-4 text-white/40" />
                            <div>
                              <p className="text-sm font-bold text-white">Max Listeners</p>
                              <p className="text-[10px] text-white/40">Capacity limit for this circle</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {[5, 10, 20, 50].map(n => (
                              <Button
                                key={n}
                                variant={maxMembers === n ? "default" : "outline"}
                                size="sm"
                                className={`flex-1 h-8 rounded-xl text-xs font-bold ${
                                  maxMembers === n ? "" : "border-white/10 text-white/60"
                                }`}
                                onClick={() => setMaxMembers(n)}
                                data-testid={`button-max-${n}`}
                              >
                                {n}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </Card>

                      {selectedTrack && (
                        <Card className="bg-primary/5 border-primary/20 rounded-2xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Music className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{selectedTrack.title}</p>
                              <p className="text-xs text-white/40 truncate">{selectedTrack.artist} · {selectedTrack.locationName}</p>
                            </div>
                          </div>
                        </Card>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 rounded-2xl border-white/10 font-bold"
                          onClick={() => setCreateStep("track")}
                        >
                          Back
                        </Button>
                        <Button
                          className="flex-1 h-12 rounded-2xl font-bold"
                          onClick={handleCreate}
                          disabled={createChat.isPending}
                          data-testid="button-start-circle"
                        >
                          {createChat.isPending ? "Starting…" : "Start Circle"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {myActiveCircles.length > 0 && (
          <section>
            <SectionLabel label="Your Active Circles" count={myActiveCircles.length} />
            <div className="flex flex-col gap-3">
              {myActiveCircles.map(circle => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  isYours
                  onJoin={() => handleJoin(circle)}
                  userId={userId}
                />
              ))}
            </div>
          </section>
        )}

        {friendsListening.length > 0 && (
          <section>
            <SectionLabel label="Friends Listening Now" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
              {friendsListening.map(friend => (
                <FriendListeningCard key={friend.id} friend={friend} />
              ))}
            </div>
          </section>
        )}

        {publicCircles.length > 0 && (
          <section>
            <SectionLabel label="Open Circles" count={publicCircles.length} />
            <div className="flex flex-col gap-3">
              {publicCircles.map(circle => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  onJoin={() => handleJoin(circle)}
                  userId={userId}
                />
              ))}
            </div>
          </section>
        )}

        {activeCircles.length === 0 && myActiveCircles.length === 0 && (
          <Card className="bg-white/5 border-white/10 rounded-3xl p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">No Active Circles</h3>
                <p className="text-sm text-white/40 max-w-xs mx-auto">
                  Start a circle to listen to your unlocked tracks with friends — in person or remotely.
                </p>
              </div>
              <Button
                className="h-11 rounded-2xl gap-2 font-bold px-6"
                onClick={() => setCreateOpen(true)}
                data-testid="button-create-empty"
              >
                <Plus className="h-4 w-4" /> Create Circle
              </Button>
            </div>
          </Card>
        )}

        <section>
          <SectionLabel label="How Circles Work" />
          <div className="grid grid-cols-2 gap-3">
            <FeatureCard icon={Radio} title="Pick a Track" desc="Choose from your unlocked library" />
            <FeatureCard icon={Users} title="Invite Friends" desc="Share a link or QR code" />
            <FeatureCard icon={Shield} title="Stay Private" desc="Control who can join" />
            <FeatureCard icon={Sparkles} title="Go Remote" desc="Premium: listen from anywhere" color="primary" />
          </div>
        </section>

      </div>
    </Shell>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</p>
      {count !== undefined && (
        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

function CircleCard({ circle, isYours, onJoin, userId }: {
  circle: ApiListenChat;
  isYours?: boolean;
  onJoin: () => void;
  userId: string;
}) {
  const memberCount = circle.members?.length || 0;
  const isFull = memberCount >= circle.maxMembers;
  const isHost = circle.createdBy === userId;

  return (
    <Card
      className={`edor-noise glass rounded-2xl p-4 transition-all ${
        isYours ? "border-primary/20 hover:border-primary/40" : "border-white/10 hover:border-white/20"
      }`}
      data-testid={`card-circle-${circle.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border shrink-0 ${
          isYours ? "bg-primary/20 border-primary/30" : "bg-white/5 border-white/10"
        }`}>
          <Headphones className={`h-5 w-5 ${isYours ? "text-primary" : "text-white/40"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white truncate">{circle.name}</p>
            {circle.isPrivate && <Lock className="h-3 w-3 text-white/30 shrink-0" />}
            {circle.isRemote && (
              <span className="text-[8px] font-bold text-primary px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">Remote</span>
            )}
          </div>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {circle.contentTitle} · {circle.contentArtist}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-white/30 flex items-center gap-1">
              <Users className="h-3 w-3" /> {memberCount}/{circle.maxMembers}
            </span>
            {isHost && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Crown className="h-3 w-3" /> Host
              </span>
            )}
            {!circle.allowChat && (
              <span className="text-[10px] text-white/20 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Chat off
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className={`h-9 rounded-xl font-bold text-xs shrink-0 ${
            isYours ? "bg-primary text-black" : ""
          }`}
          variant={isYours ? "default" : "outline"}
          disabled={!isYours && isFull}
          onClick={onJoin}
          data-testid={`button-join-${circle.id}`}
        >
          {isYours ? "Return" : isFull ? "Full" : "Join"}
        </Button>
      </div>
    </Card>
  );
}

function FriendListeningCard({ friend }: { friend: ApiUserStatus }) {
  return (
    <Card className="bg-white/5 border-white/10 rounded-2xl p-3 min-w-[160px] shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-green-400">
            {friend.displayName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{friend.displayName}</p>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-green-400">Listening</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-white/50 truncate">{friend.currentContentTitle}</p>
      <p className="text-[9px] text-white/30 truncate">{friend.currentContentArtist}</p>
    </Card>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: {
  icon: any; title: string; desc: string; color?: string;
}) {
  return (
    <Card className={`p-3 rounded-2xl ${color === "primary" ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/10"}`}>
      <Icon className={`h-5 w-5 mb-2 ${color === "primary" ? "text-primary" : "text-white/40"}`} />
      <p className={`text-xs font-bold ${color === "primary" ? "text-primary" : "text-white"}`}>{title}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>
    </Card>
  );
}

function CircleSettingsPanel() {
  const [autoAcceptFriends, setAutoAcceptFriends] = useState(true);
  const [defaultPrivate, setDefaultPrivate] = useState(false);
  const [defaultChat, setDefaultChat] = useState(true);
  const [defaultMax, setDefaultMax] = useState(20);
  const [notifyFriends, setNotifyFriends] = useState(true);

  return (
    <div className="flex flex-col gap-4 py-2">
      <Card className="bg-white/5 border-white/10 rounded-2xl divide-y divide-white/5">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-sm font-bold text-white">Default Private</p>
              <p className="text-[10px] text-white/40">New circles are invite-only</p>
            </div>
          </div>
          <Switch checked={defaultPrivate} onCheckedChange={setDefaultPrivate} data-testid="switch-default-private" />
        </div>

        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <UserPlus className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-sm font-bold text-white">Auto-accept Friends</p>
              <p className="text-[10px] text-white/40">Friends can join without approval</p>
            </div>
          </div>
          <Switch checked={autoAcceptFriends} onCheckedChange={setAutoAcceptFriends} data-testid="switch-auto-accept" />
        </div>

        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-sm font-bold text-white">Chat Enabled</p>
              <p className="text-[10px] text-white/40">Allow messages by default</p>
            </div>
          </div>
          <Switch checked={defaultChat} onCheckedChange={setDefaultChat} data-testid="switch-default-chat" />
        </div>

        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Radio className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-sm font-bold text-white">Notify Friends</p>
              <p className="text-[10px] text-white/40">Let friends know when you start</p>
            </div>
          </div>
          <Switch checked={notifyFriends} onCheckedChange={setNotifyFriends} data-testid="switch-notify-friends" />
        </div>
      </Card>

      <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-emerald-400" />
          <p className="text-xs font-bold text-emerald-400">Security Note</p>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed">
          Your exact location is never shared with Circle members. Only the app uses your position to check proximity to Pulse locations. Circle hosts can manage members and remove anyone at any time.
        </p>
      </Card>
    </div>
  );
}
