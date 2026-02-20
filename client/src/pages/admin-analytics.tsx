import Shell from "@/components/edor/shell";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useAnalytics } from "@/lib/api";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Zap, Users, Music, MapPin, TrendingUp, Clock,
  Headphones, Activity, Radio, Sparkles, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const AMBER = "#f59e0b";
const PURPLE = "#a855f7";
const CYAN = "#06b6d4";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";
const CHART_COLORS = [AMBER, PURPLE, CYAN, EMERALD, ROSE, "#3b82f6", "#ec4899", "#8b5cf6"];

function GlowNumber({ value, label, icon: Icon, color, testId }: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  color: string;
  testId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass rounded-2xl p-4 relative overflow-hidden group" data-testid={testId}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 50% 50%, ${color}08, transparent 70%)` }}
        />
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums" style={{ textShadow: `0 0 20px ${color}30` }}>
          {value}
        </p>
      </Card>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color || AMBER }}>
          {p.value} {p.name || "unlocks"}
        </p>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <Shell title="Analytics" right={
        <Link href="/admin" className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition" data-testid="link-admin">
          Admin
        </Link>
      }>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
            <p className="text-xs text-white/40">Loading analytics…</p>
          </div>
        </div>
      </Shell>
    );
  }

  const { overview, modeBreakdown, hourlyData, last7Days, topSongs, nodeStats } = data;
  const modeData = [
    { name: "Discover", value: modeBreakdown.discover },
    { name: "Park", value: modeBreakdown.park },
  ];
  const totalMode = modeBreakdown.discover + modeBreakdown.park;
  const peakHour = hourlyData.reduce((a, b) => a.unlocks > b.unlocks ? a : b, hourlyData[0]);

  return (
    <Shell
      title="Analytics"
      right={
        <Link href="/admin" className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition" data-testid="link-admin">
          Admin
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Live Overview</p>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/70 font-medium">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GlowNumber value={overview.totalUnlocks} label="Total Unlocks" icon={Zap} color={AMBER} testId="stat-total-unlocks" />
          <GlowNumber value={overview.unlocksToday} label="Today" icon={TrendingUp} color={EMERALD} testId="stat-today" />
          <GlowNumber value={overview.uniqueUsers} label="Unique Users" icon={Users} color={PURPLE} testId="stat-users" />
          <GlowNumber value={overview.uniqueUsersToday} label="Active Today" icon={Users} color={CYAN} testId="stat-active-today" />
          <GlowNumber value={overview.totalContent} label="Tracks" icon={Music} color={ROSE} testId="stat-tracks" />
          <GlowNumber value={overview.totalLocations} label="Nodes" icon={MapPin} color="#3b82f6" testId="stat-nodes" />
          <GlowNumber value={overview.totalActiveAssignments} label="Active Drops" icon={Radio} color={AMBER} testId="stat-active-drops" />
          <GlowNumber value={overview.totalLibraryItems} label="Library Saves" icon={Headphones} color={PURPLE} testId="stat-library" />
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass rounded-3xl p-5" data-testid="chart-weekly">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Weekly Unlock Trend</h3>
              <span className="ml-auto text-xs text-white/30">{overview.unlocksThisWeek} this week</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="unlockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={AMBER} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="unlocks" stroke={AMBER} strokeWidth={2} fill="url(#unlockGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass rounded-3xl p-5" data-testid="chart-hourly">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Hourly Activity</h3>
              <span className="ml-auto text-[10px] text-white/30">Peak: {peakHour?.hour}</span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="unlocks" radius={[4, 4, 0, 0]}>
                    {hourlyData.map((_, i) => (
                      <Cell key={i} fill={peakHour && hourlyData[i] === peakHour ? CYAN : `${CYAN}60`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass rounded-3xl p-5" data-testid="chart-mode">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Mode Split</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      <Cell fill={PURPLE} />
                      <Cell fill={CYAN} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PURPLE }} />
                    <span className="text-xs text-white/70 font-medium">Discover</span>
                    <span className="ml-auto text-sm font-bold text-white">{modeBreakdown.discover}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${totalMode ? (modeBreakdown.discover / totalMode * 100) : 0}%`, backgroundColor: PURPLE }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CYAN }} />
                    <span className="text-xs text-white/70 font-medium">Park</span>
                    <span className="ml-auto text-sm font-bold text-white">{modeBreakdown.park}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${totalMode ? (modeBreakdown.park / totalMode * 100) : 0}%`, backgroundColor: CYAN }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass rounded-3xl p-5" data-testid="card-top-songs">
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Top Tracks</h3>
              <span className="ml-auto text-[10px] text-white/30">by unlocks</span>
            </div>
            <div className="space-y-2">
              {topSongs.length ? topSongs.map((song, i) => {
                const maxUnlocks = topSongs[0]?.total || 1;
                const pct = (song.total / maxUnlocks) * 100;
                return (
                  <div key={song.id} className="relative" data-testid={`row-top-song-${i}`}>
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="h-full rounded-xl transition-all" style={{ width: `${pct}%`, backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}10` }} />
                    </div>
                    <div className="relative flex items-center gap-3 px-3 py-2.5">
                      <span className="text-xs font-bold text-white/25 w-5 text-right tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                        <p className="text-[10px] text-white/40">{song.creator}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold tabular-nums" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                          {song.total}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-xs text-white/40 text-center py-4">No unlock data yet</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass rounded-3xl p-5" data-testid="card-node-stats">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Node Performance</h3>
            </div>
            <div className="space-y-3">
              {nodeStats.length ? nodeStats.map((node) => (
                <div key={node.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3" data-testid={`card-node-${node.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">{node.name}</p>
                    <span className="text-lg font-bold text-amber-400 tabular-nums">{node.total}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white tabular-nums">{node.today}</p>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white tabular-nums">{node.thisWeek}</p>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">This Week</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white tabular-nums">
                        {node.thisWeek ? (node.thisWeek / 7).toFixed(1) : "0"}
                      </p>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Avg/Day</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400/60 transition-all"
                      style={{ width: `${nodeStats[0]?.total ? (node.total / nodeStats[0].total * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-white/40 text-center py-4">No node data yet</p>
              )}
            </div>
          </Card>
        </motion.div>

        <Card className="glass rounded-3xl p-4 border-dashed border-white/10" data-testid="card-analytics-note">
          <p className="text-xs text-white/40 text-center">
            Analytics refresh every 30 seconds. Data aggregated from all unlock events and library activity.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
