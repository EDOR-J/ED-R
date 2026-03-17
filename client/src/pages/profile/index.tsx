import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  User,
  Mail,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  MapPin,
  Volume2,
  Wifi,
  Eye,
  Clock,
  Headphones,
  Compass,
  Ruler,
  FileText,
  HelpCircle,
  Info,
  Mic2,
  UserCircle,
} from "lucide-react";

function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  onClick,
  rightElement,
  danger,
  testId,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
        onClick ? "cursor-pointer active:scale-[0.98] hover:bg-white/5" : ""
      } ${danger ? "border border-red-500/10" : ""}`}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
          danger ? "bg-red-500/10" : "bg-white/5"
        }`}>
          <Icon className={`h-4 w-4 ${danger ? "text-red-400" : "text-white/50"}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${danger ? "text-red-400" : "text-white/90"}`}>{label}</p>
          {subtitle && <p className="text-[11px] text-white/35 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {rightElement ?? (onClick ? <ChevronRight className="h-4 w-4 text-white/20 shrink-0" /> : null)}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1 mt-6 mb-2">
      {label}
    </p>
  );
}

const roleConfig = {
  admin: { label: "Admin", icon: Shield, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  artist: { label: "Artist", icon: Mic2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  user: { label: "Listener", icon: UserCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
} as const;

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Guest";
  const email = user?.email || "Guest access";
  const role = user?.role ?? "user";
  const rc = roleConfig[role];
  const RoleIcon = rc.icon;

  const [notifyNearby, setNotifyNearby] = useState(true);
  const [notifyDrops, setNotifyDrops] = useState(true);
  const [notifyCircles, setNotifyCircles] = useState(false);

  const [highQuality, setHighQuality] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  const [showListeningHistory, setShowListeningHistory] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [distanceUnit, setDistanceUnit] = useState(() => localStorage.getItem("edor:pref:distance-unit") || "metric");

  const handleSignOut = () => {
    logout();
  };

  return (
    <Shell>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-20 w-20 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center relative group overflow-hidden">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-white/20" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-serif" data-testid="text-display-name">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${rc.bg} ${rc.color} ${rc.border}`} data-testid="badge-role">
                <RoleIcon className="h-3 w-3" />
                {rc.label}
              </span>
            </div>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-2">
              <Mail className="h-3 w-3" /> {email}
            </p>
          </div>
        </div>

        <SectionHeader label="Account" />
        <Card className="edor-noise glass border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          <SettingsRow icon={User} label="Name" subtitle={displayName} testId="setting-name" />
          <SettingsRow icon={Mail} label="Email" subtitle={email || "Not set"} testId="setting-email" />
        </Card>

        <SectionHeader label="Notifications" />
        <Card className="edor-noise glass border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          <SettingsRow
            icon={MapPin}
            label="Nearby Pulse Alerts"
            subtitle="When you're near a drop location"
            rightElement={<Switch checked={notifyNearby} onCheckedChange={setNotifyNearby} data-testid="switch-notify-nearby" />}
            testId="setting-nearby"
          />
          <SettingsRow
            icon={Bell}
            label="New Drop Notifications"
            subtitle="When new content goes live"
            rightElement={<Switch checked={notifyDrops} onCheckedChange={setNotifyDrops} data-testid="switch-notify-drops" />}
            testId="setting-drops"
          />
          <SettingsRow
            icon={Headphones}
            label="Circle Invites"
            subtitle="When someone invites you to a Circle"
            rightElement={<Switch checked={notifyCircles} onCheckedChange={setNotifyCircles} data-testid="switch-notify-circles" />}
            testId="setting-circles"
          />
        </Card>

        <SectionHeader label="Audio & Playback" />
        <Card className="edor-noise glass border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          <SettingsRow
            icon={Volume2}
            label="High Quality Audio"
            subtitle="Uses more data when streaming"
            rightElement={<Switch checked={highQuality} onCheckedChange={setHighQuality} data-testid="switch-hq-audio" />}
            testId="setting-audio-quality"
          />
          <SettingsRow
            icon={Wifi}
            label="Stream on Wi-Fi Only"
            subtitle="Save mobile data"
            rightElement={<Switch checked={wifiOnly} onCheckedChange={setWifiOnly} data-testid="switch-wifi-only" />}
            testId="setting-wifi"
          />
          <SettingsRow
            icon={Compass}
            label="Auto-Play on Pulse"
            subtitle="Start playback after unlock"
            rightElement={<Switch checked={autoPlay} onCheckedChange={setAutoPlay} data-testid="switch-autoplay" />}
            testId="setting-autoplay"
          />
        </Card>

        <SectionHeader label="Location & Privacy" />
        <Card className="edor-noise glass border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          <SettingsRow
            icon={Shield}
            label="Location Privacy"
            subtitle="Your location is never shared with other users"
            rightElement={
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Protected</span>
            }
            testId="setting-location-privacy"
          />
          <SettingsRow
            icon={Eye}
            label="Profile Visible in Circles"
            subtitle="Others can see your display name"
            rightElement={<Switch checked={profileVisible} onCheckedChange={setProfileVisible} data-testid="switch-profile-visible" />}
            testId="setting-profile-visible"
          />
          <SettingsRow
            icon={Clock}
            label="Listening History"
            subtitle="Show recent Pulse activity"
            rightElement={<Switch checked={showListeningHistory} onCheckedChange={setShowListeningHistory} data-testid="switch-history" />}
            testId="setting-history"
          />
          <SettingsRow
            icon={Ruler}
            label="Distance Units"
            subtitle={distanceUnit === "metric" ? "Metric (meters)" : "Imperial (feet)"}
            onClick={() => {
              const next = distanceUnit === "metric" ? "imperial" : "metric";
              setDistanceUnit(next);
              localStorage.setItem("edor:pref:distance-unit", next);
              toast.success(`Switched to ${next === "metric" ? "meters" : "feet"}`);
            }}
            testId="setting-units"
          />
        </Card>

        <SectionHeader label="Support" />
        <Card className="edor-noise glass border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          <SettingsRow icon={HelpCircle} label="Help & FAQ" subtitle="Get help with EDØR" onClick={() => window.open("mailto:support@edor.app", "_blank")} testId="setting-help" />
          <SettingsRow icon={FileText} label="Terms of Service" subtitle="View terms" onClick={() => toast.info("Terms of Service — By using EDØR you agree to our community guidelines.")} testId="setting-terms" />
          <SettingsRow icon={Shield} label="Privacy Policy" subtitle="Your data is safe" onClick={() => toast.info("EDØR only uses your location during active Pulse sessions.")} testId="setting-privacy" />
          <SettingsRow icon={Info} label="About EDØR" subtitle="v1.0.4" onClick={() => toast.info("EDØR — Place-based music & culture discovery")} testId="setting-about" />
        </Card>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500/5 hover:text-red-400 font-bold tracking-widest uppercase text-xs gap-2"
            onClick={handleSignOut}
            data-testid="button-sign-out"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <p className="text-center text-[10px] text-white/20 uppercase font-bold tracking-[0.5em] mt-8">
          EDØR v1.0.4
        </p>
      </div>
    </Shell>
  );
}
