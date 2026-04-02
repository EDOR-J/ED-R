import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Shell from "@/components/edor/shell";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Library, Zap, Users, Radio, Disc3, Clock,
  ArrowLeft, UserPlus, Music, PenLine, Check
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type UserProfileData = {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    email: string | null;
    profileImageUrl: string | null;
    role: string | null;
    bio: string | null;
    createdAt: string | null;
  };
  stats: {
    libraryCount: number;
    unlockCount: number;
    friendsCount: number;
    circlesJoined: number;
  };
  status: {
    userId: string;
    displayName: string;
    isOnline: boolean;
    lastSeen: string;
    currentContentTitle: string | null;
    currentContentArtist: string | null;
  } | null;
  recentUnlocks: {
    id: string;
    contentId: string;
    nodeId: string;
    mode: string;
    unlockedAt: string;
  }[];
};

const PALETTE = ["#f59e0b", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#3b82f6", "#ec4899", "#84cc16"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function StatCard({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 px-3 rounded-2xl bg-white/[0.03] border border-white/8">
      <Icon className="h-4 w-4 text-white/25 mb-1" />
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[9px] text-white/35 uppercase tracking-widest font-semibold text-center">{label}</span>
    </div>
  );
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:  { label: "Admin",    color: "#f59e0b" },
  artist: { label: "Artist",   color: "#8b5cf6" },
  user:   { label: "Listener", color: "#06b6d4" },
};

export default function UserPublicProfilePage() {
  const [, params] = useRoute("/profile/user/:userId");
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const userId = params?.userId ?? "";
  const isOwnProfile = currentUser?.id === userId;

  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");

  const { data, isLoading, error } = useQuery<UserProfileData>({
    queryKey: ["/api/profile/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/user/${userId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!userId,
  });

  const bioMutation = useMutation({
    mutationFn: async (bio: string) => {
      const res = await fetch("/api/profile/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, bio }),
      });
      if (!res.ok) throw new Error("Failed to update bio");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile/user", userId] });
      setEditingBio(false);
      toast.success("Bio updated");
    },
  });

  const sendFriendRequest = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/friends/request", { senderId: currentUser?.id, receiverId: userId }),
    onSuccess: () => toast.success("Friend request sent"),
    onError: () => toast.error("Could not send friend request"),
  });

  if (isLoading) {
    return (
      <Shell title="" left={<button onClick={() => history.back()} className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" />Back</button>}>
        <div className="space-y-4 pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-white/10 animate-pulse" />
            <div className="h-6 w-36 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-4 w-24 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell title="" left={<button onClick={() => history.back()} className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" />Back</button>}>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Users className="h-10 w-10 text-white/10" />
          <p className="text-sm text-white/30">Profile not found</p>
        </div>
      </Shell>
    );
  }

  const { user, stats, status } = data;
  const displayName = user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "EDØR User";
  const color = avatarColor(displayName);
  const initial = displayName.charAt(0).toUpperCase();
  const role = user.role ?? "user";
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.user;

  function startEditBio() {
    setBioText(data?.user.bio ?? "");
    setEditingBio(true);
  }

  return (
    <Shell
      title=""
      left={
        <button
          onClick={() => history.back()}
          className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition flex items-center gap-1"
          data-testid="button-back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      }
    >
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 pt-4 pb-6">
        {/* Avatar */}
        <div className="relative">
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={displayName}
              className="h-24 w-24 rounded-full object-cover border-2"
              style={{ borderColor: `${color}44` }}
              data-testid="img-user-avatar"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{ background: `${color}22`, border: `2px solid ${color}44`, color }}
              data-testid="img-user-avatar"
            >
              {initial}
            </div>
          )}
          {/* Online indicator */}
          {status?.isOnline && (
            <div className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-green-400 border-2 border-black" />
          )}
        </div>

        {/* Name + role */}
        <div className="text-center">
          <h1
            className="text-2xl font-bold text-white font-serif italic tracking-tight"
            data-testid="text-user-name"
          >
            {displayName}
          </h1>
          <div
            className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: `${roleConf.color}15`, color: roleConf.color }}
          >
            {roleConf.label}
          </div>
        </div>

        {/* Currently listening */}
        {status?.currentContentTitle && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/8 border border-primary/20">
            <Disc3 className="h-3.5 w-3.5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs text-primary/80 font-medium truncate max-w-[180px]" data-testid="text-now-listening">
              {status.currentContentTitle}
            </span>
            <span className="text-[10px] text-white/30">by {status.currentContentArtist}</span>
          </div>
        )}

        {/* Friend button (not own profile) */}
        {!isOwnProfile && currentUser && (
          <Button
            size="sm"
            onClick={() => sendFriendRequest.mutate()}
            disabled={sendFriendRequest.isPending || sendFriendRequest.isSuccess}
            className="h-9 px-5 rounded-2xl text-xs font-bold gap-2"
            data-testid="button-add-friend"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {sendFriendRequest.isSuccess ? "Request Sent" : "Add Friend"}
          </Button>
        )}
      </div>

      {/* Bio */}
      <div className="mb-4">
        {editingBio ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full rounded-2xl bg-white/5 border border-white/15 p-4 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-primary/40"
              rows={3}
              placeholder="Write a short bio..."
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              maxLength={200}
              autoFocus
              data-testid="input-bio"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingBio(false)}
                className="h-8 px-4 rounded-xl text-xs text-white/40"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => bioMutation.mutate(bioText)}
                disabled={bioMutation.isPending}
                className="h-8 px-4 rounded-xl text-xs font-bold gap-1.5"
                data-testid="button-save-bio"
              >
                <Check className="h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex items-start gap-2 p-4 rounded-2xl transition-all",
              isOwnProfile && "hover:bg-white/5 cursor-pointer group"
            )}
            onClick={isOwnProfile ? startEditBio : undefined}
            data-testid="section-bio"
          >
            {user.bio ? (
              <>
                <p className="flex-1 text-sm text-white/60 leading-relaxed">{user.bio}</p>
                {isOwnProfile && <PenLine className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition shrink-0 mt-0.5" />}
              </>
            ) : (
              <p className="text-sm text-white/25 italic">
                {isOwnProfile ? "Tap to add a bio…" : "No bio yet"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard value={stats.libraryCount} label="Collected" icon={Library} />
        <StatCard value={stats.unlockCount} label="Pulses" icon={Zap} />
        <StatCard value={stats.friendsCount} label="Friends" icon={Users} />
        <StatCard value={stats.circlesJoined} label="Circles" icon={Radio} />
      </div>

      {/* Recently unlocked */}
      {data.recentUnlocks.length > 0 && (
        <div>
          <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest mb-3 ml-1">
            Recent Pulses
          </p>
          <div className="flex flex-col gap-1">
            {data.recentUnlocks.map((unlock) => (
              <button
                key={unlock.id}
                onClick={() => navigateWithTransition(setLocation, `/content/${unlock.contentId}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left w-full group"
                data-testid={`recent-unlock-${unlock.id}`}
              >
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  <Music className="h-3.5 w-3.5 text-white/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">Track unlocked</p>
                  <p className="text-[10px] text-white/25 flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(unlock.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  unlock.mode === "discover"
                    ? "bg-purple-500/15 text-purple-400"
                    : "bg-cyan-500/15 text-cyan-400"
                )}>
                  {unlock.mode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
