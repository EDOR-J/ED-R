import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Shell from "@/components/edor/shell";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { Music, Disc3, MapPin, Heart, Play, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type CreatorProfile = {
  tracks: {
    id: string;
    title: string;
    creator: string;
    description: string;
    audioUrl: string;
    artworkUrl: string | null;
    artworkSeed: string | null;
    videoUrl: string | null;
  }[];
  totalUnlocks: number;
  totalSaves: number;
  locationCount: number;
};

const PALETTE = ["#f59e0b", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#3b82f6", "#ec4899", "#84cc16"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[9px] text-white/35 uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

export default function CreatorProfilePage() {
  const [, params] = useRoute("/profile/creator/:name");
  const [, setLocation] = useLocation();
  const creatorName = decodeURIComponent(params?.name ?? "");

  const { data, isLoading } = useQuery<CreatorProfile>({
    queryKey: ["/api/profile/creator", creatorName],
    queryFn: async () => {
      const res = await fetch(`/api/profile/creator/${encodeURIComponent(creatorName)}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!creatorName,
  });

  const color = avatarColor(creatorName);
  const initial = creatorName.charAt(0).toUpperCase();

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
      <div className="flex flex-col items-center gap-4 pt-4 pb-8">
        {/* Avatar */}
        <div
          className="h-24 w-24 rounded-3xl flex items-center justify-center text-4xl font-bold shadow-xl"
          style={{ background: `${color}22`, border: `2px solid ${color}44`, color }}
          data-testid="img-creator-avatar"
        >
          {initial}
        </div>

        {/* Name */}
        <div className="text-center">
          <h1
            className="text-2xl font-bold text-white font-serif italic tracking-tight"
            data-testid="text-creator-name"
          >
            {creatorName}
          </h1>
          <div
            className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: `${color}15`, color }}
          >
            <Disc3 className="h-3 w-3" />
            Artist
          </div>
        </div>

        {/* Stats */}
        {!isLoading && data && (
          <div className="flex items-center gap-8 py-4 px-6 rounded-2xl bg-white/[0.03] border border-white/8 w-full mt-2">
            <StatPill value={data.tracks.length} label="Tracks" />
            <div className="h-8 w-px bg-white/10" />
            <StatPill value={data.totalUnlocks} label="Unlocks" />
            <div className="h-8 w-px bg-white/10" />
            <StatPill value={data.totalSaves} label="Saves" />
            <div className="h-8 w-px bg-white/10" />
            <StatPill value={data.locationCount} label={data.locationCount === 1 ? "City" : "Cities"} />
          </div>
        )}
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !data || data.tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Music className="h-10 w-10 text-white/10" />
          <p className="text-sm text-white/30">No tracks found for this artist</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest mb-3 ml-1">
            Discography
          </p>
          {data.tracks.map((track, i) => (
            <button
              key={track.id}
              onClick={() => navigateWithTransition(setLocation, `/content/${track.id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 active:bg-white/8 transition-all text-left w-full group"
              data-testid={`track-row-${track.id}`}
            >
              {/* Artwork / number */}
              <div className="relative shrink-0">
                <div
                  className="h-12 w-12 rounded-xl overflow-hidden flex items-center justify-center text-xs font-bold text-white/30"
                  style={{ background: `${color}12`, border: `1px solid ${color}25` }}
                >
                  {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
                  ) : (
                    <span style={{ color }}>{i + 1}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <Play className="h-4 w-4 text-white fill-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight" data-testid={`text-track-title-${track.id}`}>
                  {track.title}
                </p>
                {track.description && (
                  <p className="text-[11px] text-white/35 truncate mt-0.5 leading-tight">
                    {track.description}
                  </p>
                )}
              </div>

              <Play className="h-4 w-4 text-white/20 group-hover:text-primary/60 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </Shell>
  );
}
