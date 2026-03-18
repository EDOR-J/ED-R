import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  useContents,
  useLibrary,
  useLocations,
  useAssignments,
  useAnalytics,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
} from "@/lib/api";
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
  MapPin,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  Target,
  Radio,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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

function CreateCampaignForm({ contents, locations, onSubmit, onCancel }: {
  contents: any[];
  locations: any[];
  onSubmit: (data: { contentId: string; locationId: string; mode: string; startAt: string; endAt: string }) => void;
  onCancel: () => void;
}) {
  const [contentId, setContentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [mode, setMode] = useState("discover");
  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const handleSubmit = () => {
    if (!contentId || !locationId) {
      toast.error("Select a track and location");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      toast.error("End time must be after start time");
      return;
    }
    onSubmit({
      contentId,
      locationId,
      mode,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
    });
  };

  return (
    <Card className="glass rounded-3xl p-5 border border-amber-500/20" data-testid="card-create-campaign-form">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">New Campaign</h3>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full text-white/40 hover:text-white"
          onClick={onCancel}
          data-testid="button-cancel-campaign"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Track</Label>
          <select
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 text-white text-sm px-3 outline-none focus:border-amber-500/30"
            data-testid="select-campaign-content"
          >
            <option value="" className="bg-zinc-900">Select a track…</option>
            {contents.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">
                {c.title} — {c.creator}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Location (Node)</Label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 text-white text-sm px-3 outline-none focus:border-amber-500/30"
            data-testid="select-campaign-location"
          >
            <option value="" className="bg-zinc-900">Select a location…</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id} className="bg-zinc-900">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs text-white/50 mb-1.5 block">Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "discover" ? "default" : "outline"}
              className={`h-10 rounded-2xl text-xs gap-1.5 ${mode === "discover" ? "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30" : "border-white/10 text-white/60"}`}
              onClick={() => setMode("discover")}
              data-testid="button-mode-discover"
            >
              <Target className="h-3.5 w-3.5" />
              Discover
            </Button>
            <Button
              variant={mode === "park" ? "default" : "outline"}
              className={`h-10 rounded-2xl text-xs gap-1.5 ${mode === "park" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30" : "border-white/10 text-white/60"}`}
              onClick={() => setMode("park")}
              data-testid="button-mode-park"
            >
              <Radio className="h-3.5 w-3.5" />
              Park
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-white/50 mb-1.5 block">Start</Label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white text-xs"
              data-testid="input-campaign-start"
            />
          </div>
          <div>
            <Label className="text-xs text-white/50 mb-1.5 block">End</Label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white text-xs"
              data-testid="input-campaign-end"
            />
          </div>
        </div>

        <Button
          className="w-full h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm gap-2"
          onClick={handleSubmit}
          data-testid="button-submit-campaign"
        >
          <Megaphone className="h-4 w-4" />
          Launch Campaign
        </Button>
      </div>
    </Card>
  );
}

function CampaignCard({ assignment, content, location, nodeMetrics, onDelete }: {
  assignment: any;
  content: any;
  location: any;
  nodeMetrics?: { total: number; today: number; thisWeek: number };
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const now = new Date();
  const start = new Date(assignment.startAt);
  const end = new Date(assignment.endAt);
  const isActive = now >= start && now <= end;
  const isUpcoming = now < start;
  const isExpired = now > end;

  const statusLabel = isActive ? "Live" : isUpcoming ? "Upcoming" : "Ended";
  const statusColor = isActive ? "text-emerald-400" : isUpcoming ? "text-amber-400" : "text-white/30";
  const statusDot = isActive ? "bg-emerald-400 animate-pulse" : isUpcoming ? "bg-amber-400" : "bg-white/20";

  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="glass rounded-2xl overflow-hidden" data-testid={`card-campaign-${assignment.id}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"}`}>
            <Music className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-white/40"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate" data-testid={`text-campaign-title-${assignment.id}`}>
              {content?.title || "Unknown Track"}
            </p>
            <p className="text-xs text-white/40">{content?.creator || "Unknown Artist"}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`h-2 w-2 rounded-full ${statusDot}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[10px] text-white/40 font-medium uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" />
            {location?.name || "Unknown"}
          </span>
          <span className="flex items-center gap-1">
            {assignment.mode === "discover" ? <Target className="h-2.5 w-2.5" /> : <Radio className="h-2.5 w-2.5" />}
            {assignment.mode}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(start)}
          </span>
        </div>

        {nodeMetrics && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2 text-center">
              <p className="text-lg font-bold text-white tabular-nums">{nodeMetrics.total}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Total</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2 text-center">
              <p className="text-lg font-bold text-emerald-400 tabular-nums">{nodeMetrics.today}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Today</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2 text-center">
              <p className="text-lg font-bold text-cyan-400 tabular-nums">{nodeMetrics.thisWeek}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">This Week</p>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <button
            className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1 transition"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-campaign-${assignment.id}`}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Less" : "Details"}
          </button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-full text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 gap-1 px-2"
            onClick={onDelete}
            data-testid={`button-delete-campaign-${assignment.id}`}
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-1">Window</p>
              <p className="text-white/60">{formatDate(start)} → {formatDate(end)}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-1">Location ID</p>
              <p className="text-white/50 font-mono text-[10px] break-all">{assignment.locationId}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-1">Avg / Day</p>
              <p className="text-white/60">{nodeMetrics?.thisWeek ? (nodeMetrics.thisWeek / 7).toFixed(1) : "0"}</p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-1">Assignment ID</p>
              <p className="text-white/50 font-mono text-[10px] break-all">{assignment.id}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ArtistDashboard() {
  const { user } = useAuth();
  const { data: contents } = useContents();
  const { data: library } = useLibrary();
  const { data: locations } = useLocations();
  const { data: assignments } = useAssignments();
  const { data: analytics } = useAnalytics();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

  const isAdmin = user?.role === "admin";
  const allContents = contents ?? [];
  const allLocations = locations ?? [];
  const allAssignments = assignments ?? [];

  const myCampaigns = useMemo(() => {
    if (!allAssignments.length) return [];
    if (isAdmin) return allAssignments;
    const myIds = new Set(myTracks.map((t: any) => t.id));
    return allAssignments.filter((a: any) => myIds.has(a.contentId));
  }, [allAssignments, myTracks, isAdmin]);

  const nodeMetricsMap = useMemo(() => {
    if (!analytics?.nodeStats) return {};
    const map: Record<string, { total: number; today: number; thisWeek: number }> = {};
    for (const n of analytics.nodeStats) {
      map[n.id] = { total: n.total, today: n.today, thisWeek: n.thisWeek };
    }
    return map;
  }, [analytics]);

  const activeCampaigns = myCampaigns.filter((a: any) => {
    const now = new Date();
    return now >= new Date(a.startAt) && now <= new Date(a.endAt);
  });

  const availableContents = isAdmin ? allContents : myTracks;

  const handleCreateCampaign = async (data: { contentId: string; locationId: string; mode: string; startAt: string; endAt: string }) => {
    try {
      await createAssignment.mutateAsync(data);
      toast.success("Campaign launched!", { description: "Your drop is now scheduled at the node." });
      setShowCreateForm(false);
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Remove this campaign? The assignment will be deleted.")) return;
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success("Campaign removed");
    } catch {
      toast.error("Failed to remove campaign");
    }
  };

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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
            <Music className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white" data-testid="text-artist-name">
              {user?.firstName || "Artist"}
            </h2>
            <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest" data-testid="text-artist-role">
              {isAdmin ? "Admin" : "Artist"} Profile
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/5" data-testid="tabs-artist">
            <TabsTrigger value="overview" className="rounded-xl text-xs" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-xl text-xs" data-testid="tab-campaigns">
              <Megaphone className="h-3 w-3 mr-1" />
              Campaigns
              {activeCampaigns.length > 0 && (
                <span className="ml-1.5 h-4 min-w-[16px] rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center px-1">
                  {activeCampaigns.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Music} label="Tracks" value={myTracks.length} sub="Uploaded" testId="stat-tracks" />
              <StatCard icon={Headphones} label="Listens" value={totalListens} sub="Total plays" testId="stat-listens" />
              <StatCard icon={Users} label="Listeners" value={Math.max(1, Math.floor(totalListens * 0.7))} sub="Unique" testId="stat-listeners" />
              <StatCard icon={Megaphone} label="Campaigns" value={myCampaigns.length} sub={`${activeCampaigns.length} active`} testId="stat-campaigns" />
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
                  onClick={() => { setActiveTab("campaigns"); setShowCreateForm(true); }}
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
                <span className="ml-auto text-xs text-white/40">{allContents.length} tracks</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allContents.slice(0, 10).map((track: any) => (
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
                {allContents.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">No content on platform yet</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-amber-400" />
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest">
                  {isAdmin ? "All Campaigns" : "My Campaigns"}
                </p>
              </div>
              {!showCreateForm && (
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-black text-xs gap-1.5 px-3"
                  onClick={() => setShowCreateForm(true)}
                  data-testid="button-new-campaign-tab"
                >
                  <Plus className="h-3 w-3" />
                  New
                </Button>
              )}
            </div>

            {showCreateForm && (
              <CreateCampaignForm
                contents={availableContents}
                locations={allLocations}
                onSubmit={handleCreateCampaign}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            {activeCampaigns.length > 0 && (
              <div>
                <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest mb-2 px-1">
                  Live Now ({activeCampaigns.length})
                </p>
                <div className="space-y-2">
                  {activeCampaigns.map((a: any) => (
                    <CampaignCard
                      key={a.id}
                      assignment={a}
                      content={allContents.find((c: any) => c.id === a.contentId)}
                      location={allLocations.find((l: any) => l.id === a.locationId)}
                      nodeMetrics={nodeMetricsMap[a.locationId]}
                      onDelete={() => handleDeleteCampaign(a.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {myCampaigns.filter((a: any) => {
              const now = new Date();
              return now < new Date(a.startAt);
            }).length > 0 && (
              <div>
                <p className="text-[10px] text-amber-400/60 font-bold uppercase tracking-widest mb-2 px-1">
                  Upcoming
                </p>
                <div className="space-y-2">
                  {myCampaigns.filter((a: any) => new Date() < new Date(a.startAt)).map((a: any) => (
                    <CampaignCard
                      key={a.id}
                      assignment={a}
                      content={allContents.find((c: any) => c.id === a.contentId)}
                      location={allLocations.find((l: any) => l.id === a.locationId)}
                      nodeMetrics={nodeMetricsMap[a.locationId]}
                      onDelete={() => handleDeleteCampaign(a.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {myCampaigns.filter((a: any) => new Date() > new Date(a.endAt)).length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 px-1">
                  Ended
                </p>
                <div className="space-y-2">
                  {myCampaigns.filter((a: any) => new Date() > new Date(a.endAt)).map((a: any) => (
                    <CampaignCard
                      key={a.id}
                      assignment={a}
                      content={allContents.find((c: any) => c.id === a.contentId)}
                      location={allLocations.find((l: any) => l.id === a.locationId)}
                      nodeMetrics={nodeMetricsMap[a.locationId]}
                      onDelete={() => handleDeleteCampaign(a.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {myCampaigns.length === 0 && !showCreateForm && (
              <Card className="glass rounded-3xl p-6 text-center" data-testid="empty-campaigns">
                <Megaphone className="h-8 w-8 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/60">No campaigns yet</p>
                <p className="text-xs text-white/30 mt-1">
                  Assign your tracks to locations and set time windows to create drops for listeners.
                </p>
                <Button
                  className="mt-4 rounded-2xl gap-2 bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => setShowCreateForm(true)}
                  data-testid="button-first-campaign"
                >
                  <Plus className="h-4 w-4" />
                  Create First Campaign
                </Button>
              </Card>
            )}

            {analytics?.nodeStats && analytics.nodeStats.length > 0 && (
              <Card className="glass rounded-3xl p-5" data-testid="card-node-metrics">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Node Metrics</h3>
                  <span className="ml-auto text-[10px] text-white/30">{analytics.nodeStats.length} nodes</span>
                </div>
                <div className="space-y-2">
                  {analytics.nodeStats.map((node: any) => (
                    <div key={node.id} className="flex items-center gap-3 py-2 px-1" data-testid={`row-node-metric-${node.id}`}>
                      <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{node.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-white/30 uppercase tracking-wider">
                          <span><Zap className="inline h-2.5 w-2.5" /> {node.total}</span>
                          <span><TrendingUp className="inline h-2.5 w-2.5" /> {node.today}/d</span>
                          <span><Clock className="inline h-2.5 w-2.5" /> {node.thisWeek}/wk</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-amber-400 tabular-nums">{node.total}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
