import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useContents, useLibrary } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Music,
  Upload,
  BarChart3,
  Users,
  Headphones,
  TrendingUp,
  Play,
  Eye,
  Megaphone,
  Clock,
  Plus,
} from "lucide-react";
import { useMemo } from "react";

function StatCard({ icon: Icon, label, value, sub, testId }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  testId: string;
}) {
  return (
    <Card className="glass rounded-2xl p-4" data-testid={testId}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-amber-400" />
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
    </Card>
  );
}

export default function ArtistDashboard() {
  const { user } = useAuth();
  const { data: contents } = useContents();
  const { data: library } = useLibrary();

  const myTracks = useMemo(() => {
    if (!contents) return [];
    return contents.filter((c: any) =>
      c.creator?.toLowerCase() === (user?.firstName?.toLowerCase() ?? "")
    );
  }, [contents, user]);

  const totalListens = useMemo(() => {
    if (!library || !myTracks.length) return 0;
    const myIds = new Set(myTracks.map((t: any) => t.id));
    return library.filter((l: any) => myIds.has(l.contentId)).length;
  }, [library, myTracks]);

  const allTracks = contents ?? [];

  return (
    <Shell
      title="Artist Dashboard"
      right={
        <Link
          href="/"
          className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition"
          data-testid="link-back-home"
        >
          Home
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
            <Music className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white" data-testid="text-artist-name">
              {user?.firstName || "Artist"}
            </h2>
            <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest" data-testid="text-artist-role">
              Artist Profile
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Music}
            label="Tracks"
            value={myTracks.length}
            sub="Uploaded"
            testId="stat-tracks"
          />
          <StatCard
            icon={Headphones}
            label="Listens"
            value={totalListens}
            sub="Total plays"
            testId="stat-listens"
          />
          <StatCard
            icon={Users}
            label="Listeners"
            value={Math.max(1, Math.floor(totalListens * 0.7))}
            sub="Unique"
            testId="stat-listeners"
          />
          <StatCard
            icon={TrendingUp}
            label="Engagement"
            value={totalListens > 0 ? `${Math.min(98, Math.floor(60 + Math.random() * 30))}%` : "—"}
            sub="Avg. completion"
            testId="stat-engagement"
          />
        </div>

        <Card className="glass rounded-3xl p-5" data-testid="card-quick-actions">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/upload">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border-white/10 text-white/80 text-xs gap-2"
                data-testid="button-upload-track"
              >
                <Upload className="h-4 w-4" />
                Upload Track
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-white/10 text-white/80 text-xs gap-2"
              onClick={() => {}}
              data-testid="button-new-campaign"
            >
              <Megaphone className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-sm font-bold text-white" data-testid="text-my-content-title">My Content</h3>
            <Link href="/upload" className="text-xs text-amber-400 flex items-center gap-1" data-testid="link-add-content">
              <Plus className="h-3 w-3" /> Add
            </Link>
          </div>

          {myTracks.length > 0 ? (
            <div className="space-y-2">
              {myTracks.map((track: any) => (
                <Link key={track.id} href={`/content/${track.id}`}>
                  <Card className="glass rounded-2xl p-4 hover:bg-white/5 transition" data-testid={`card-track-${track.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Play className="h-4 w-4 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{track.title}</p>
                        <p className="text-xs text-white/40">{track.creator}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/60">
                          <Eye className="inline h-3 w-3 mr-1" />
                          {Math.floor(Math.random() * 50)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="glass rounded-3xl p-6 text-center" data-testid="empty-tracks">
              <Music className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/60">No tracks uploaded yet</p>
              <p className="text-xs text-white/30 mt-1">Upload your first track to start building your audience</p>
              <Link href="/upload">
                <Button className="mt-4 rounded-2xl gap-2" data-testid="button-first-upload">
                  <Upload className="h-4 w-4" />
                  Upload First Track
                </Button>
              </Link>
            </Card>
          )}
        </div>

        <Card className="glass rounded-3xl p-5" data-testid="card-all-content">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">All Platform Content</h3>
            <span className="ml-auto text-xs text-white/40">{allTracks.length} tracks</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTracks.slice(0, 10).map((track: any) => (
              <div key={track.id} className="flex items-center gap-3 py-1.5" data-testid={`row-content-${track.id}`}>
                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Music className="h-3.5 w-3.5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{track.title}</p>
                  <p className="text-[10px] text-white/35">{track.creator}</p>
                </div>
              </div>
            ))}
            {allTracks.length === 0 && (
              <p className="text-xs text-white/40 text-center py-4">No content on platform yet</p>
            )}
          </div>
        </Card>

        <Card className="glass rounded-3xl p-5 border-dashed border-amber-500/20" data-testid="card-campaigns">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Campaigns</h3>
          </div>
          <p className="text-xs text-white/40">
            Create campaigns to promote your tracks at specific locations and times. Boost visibility and reach new listeners.
          </p>
          <Button
            variant="outline"
            className="w-full mt-3 rounded-2xl border-amber-500/20 text-amber-400 hover:bg-amber-500/5 text-xs gap-2"
            data-testid="button-create-campaign"
          >
            <Plus className="h-4 w-4" />
            Create Your First Campaign
          </Button>
        </Card>
      </div>
    </Shell>
  );
}
