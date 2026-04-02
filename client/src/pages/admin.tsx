import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  useLocations,
  useContents,
  useAssignments,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  type PulseMode,
} from "@/lib/api";
import { useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { toast } from "sonner";
import { BarChart3, MapPin, Navigation, ChevronDown, ChevronUp, Trash2, Check, Nfc, Copy } from "lucide-react";
import { Map, Marker } from "pigeon-maps";
import { motion, AnimatePresence } from "framer-motion";

const PASSCODE_KEY = "edor:admin:ok:v1";
const PASSCODE = "edor";

function isAuthed() {
  return localStorage.getItem(PASSCODE_KEY) === "1";
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
};

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(isAuthed());
  const [passcode, setPasscode] = useState("");

  const { data: locations = [], isLoading: locLoading } = useLocations();
  const { data: contents = [], isLoading: conLoading } = useContents();
  const { data: assignments = [], isLoading: asnLoading } = useAssignments();

  const createLocation = useCreateLocation();
  const updateLoc = useUpdateLocation();
  const deleteLoc = useDeleteLocation();
  const createContent = useCreateContent();
  const updateCon = useUpdateContent();
  const deleteCon = useDeleteContent();
  const createAssignment = useCreateAssignment();
  const updateAsn = useUpdateAssignment();
  const deleteAsn = useDeleteAssignment();

  if (!authed) {
    return (
      <Shell title="Admin">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div
            variants={stagger.item}
            className="rounded-3xl p-6 space-y-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            data-testid="card-admin-lock"
          >
            <p className="text-sm text-white/60" data-testid="text-admin-lock">
              Enter passcode to continue.
            </p>
            <Input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (passcode.trim() === PASSCODE) {
                    localStorage.setItem(PASSCODE_KEY, "1");
                    setAuthed(true);
                  } else {
                    toast("Incorrect passcode");
                  }
                }
              }}
              placeholder="Passcode"
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              data-testid="input-passcode"
              type="password"
            />
            <Button
              className="h-12 w-full rounded-2xl animate-sparkle"
              onClick={() => {
                if (passcode.trim() === PASSCODE) {
                  localStorage.setItem(PASSCODE_KEY, "1");
                  setAuthed(true);
                } else {
                  toast("Incorrect passcode");
                }
              }}
              data-testid="button-passcode"
            >
              Enter
            </Button>
            <p className="text-xs text-white/30" data-testid="text-admin-hint">
              Demo passcode: <span className="font-mono text-white/50">edor</span>
            </p>
          </motion.div>
        </motion.div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Admin"
      right={
        <button
          className="rounded-full px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition"
          onClick={() => {
            localStorage.removeItem(PASSCODE_KEY);
            setAuthed(false);
            setPasscode("");
          }}
          data-testid="button-logout"
        >
          Lock
        </button>
      }
    >
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {(locLoading || conLoading || asnLoading) ? (
          <motion.div variants={stagger.item} className="text-sm text-white/40 text-center py-12">
            Loading…
          </motion.div>
        ) : (
          <>
            <motion.div variants={stagger.item}>
              <Link href="/admin/analytics" data-testid="link-admin-analytics">
                <div
                  className="flex items-center gap-3 rounded-2xl p-4 hover:bg-white/[0.04] transition cursor-pointer group"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Analytics</p>
                    <p className="text-[10px] text-white/35">Unlock rates · top tracks · node performance</p>
                  </div>
                  <span className="text-xs text-white/25 group-hover:text-white/50 transition">→</span>
                </div>
              </Link>
            </motion.div>

            <motion.div variants={stagger.item}>
              <Tabs defaultValue="locations" className="w-full">
                <TabsList
                  className="grid w-full grid-cols-3 rounded-2xl mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  data-testid="tabs-admin"
                >
                  <TabsTrigger value="locations" className="rounded-xl text-xs" data-testid="tab-locations">
                    Nodes
                  </TabsTrigger>
                  <TabsTrigger value="content" className="rounded-xl text-xs" data-testid="tab-content">
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="assign" className="rounded-xl text-xs" data-testid="tab-assign">
                    Assign
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="locations">
                  <LocationsPanel
                    locations={locations}
                    onCreate={async (v) => {
                      await createLocation.mutateAsync(v);
                      toast("Node added");
                    }}
                    onUpdate={async (id, patch) => {
                      await updateLoc.mutateAsync({ id, ...patch });
                      toast("Node updated");
                    }}
                    onDelete={async (id) => {
                      await deleteLoc.mutateAsync(id);
                      toast("Node removed");
                    }}
                  />
                </TabsContent>

                <TabsContent value="content">
                  <ContentPanel
                    contents={contents}
                    onCreate={async (v) => {
                      await createContent.mutateAsync({ ...v, artworkSeed: null, artworkUrl: null, videoUrl: null });
                      toast("Content added");
                    }}
                    onUpdate={async (id, patch) => {
                      await updateCon.mutateAsync({ id, ...patch });
                      toast("Content updated");
                    }}
                    onDelete={async (id) => {
                      await deleteCon.mutateAsync(id);
                      toast("Content removed");
                    }}
                  />
                </TabsContent>

                <TabsContent value="assign">
                  <AssignPanel
                    locations={locations}
                    contents={contents}
                    assignments={assignments.map(a => ({ ...a, mode: a.mode as PulseMode }))}
                    onCreate={async (v) => {
                      await createAssignment.mutateAsync(v);
                      toast("Assigned");
                    }}
                    onUpdate={async (id, patch) => {
                      await updateAsn.mutateAsync({ id, ...patch });
                      toast("Assignment updated");
                    }}
                    onDelete={async (id) => {
                      await deleteAsn.mutateAsync(id);
                      toast("Assignment removed");
                    }}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}
      </motion.div>
    </Shell>
  );
}

function NodeCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-[10px] uppercase tracking-widest font-semibold text-white/35">
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-11 rounded-2xl px-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/25 transition placeholder:text-white/25 ${props.className ?? ""}`}
    />
  );
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/25 transition placeholder:text-white/25 min-h-[80px] ${props.className ?? ""}`}
    />
  );
}

function CoordPicker({
  lat,
  lng,
  onChange,
  existingNodes,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  existingNodes: Array<{ id: string; name: string; lat: number; lng: number }>;
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const defaultCenter: [number, number] = lat && lng ? [lat, lng] : [51.505, -0.09];

  const useGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onChange(
          Math.round(pos.coords.latitude * 1e6) / 1e6,
          Math.round(pos.coords.longitude * 1e6) / 1e6,
        );
        toast.success("Location locked in!");
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          toast.error("Location permission denied — allow it in browser settings");
        } else {
          toast.error("Could not get your location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ height: 200, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Map
          height={200}
          defaultCenter={defaultCenter}
          defaultZoom={13}
          onClick={({ latLng }) => onChange(
            Math.round(latLng[0] * 1e6) / 1e6,
            Math.round(latLng[1] * 1e6) / 1e6,
          )}
        >
          {existingNodes.map((n) => (
            <Marker key={n.id} anchor={[n.lat, n.lng]} color="rgba(255,255,255,0.4)" width={24} />
          ))}
          {lat !== null && lng !== null && (
            <Marker anchor={[lat, lng]} color="hsl(45,96%,54%)" width={32} />
          )}
        </Map>
        <div className="absolute top-2 right-2 text-[10px] text-white/50 bg-black/60 rounded-lg px-2 py-1 pointer-events-none">
          Tap map to pin
        </div>
      </div>

      <button
        type="button"
        onClick={useGPS}
        disabled={gpsLoading}
        className="w-full h-10 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition"
        style={{
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          color: gpsLoading ? "rgba(245,158,11,0.4)" : "rgba(245,158,11,0.85)",
        }}
      >
        <Navigation className={`h-3.5 w-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
        {gpsLoading ? "Finding your location…" : "Use my GPS location"}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <FieldLabel label="Latitude">
          <StyledInput
            inputMode="decimal"
            placeholder="e.g. 51.5074"
            value={lat ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(v, lng ?? 0);
              else if (e.target.value === "" || e.target.value === "-") onChange(NaN, lng ?? 0);
            }}
            data-testid="input-location-lat"
          />
        </FieldLabel>
        <FieldLabel label="Longitude">
          <StyledInput
            inputMode="decimal"
            placeholder="e.g. -0.1278"
            value={lng ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(lat ?? 0, v);
              else if (e.target.value === "" || e.target.value === "-") onChange(lat ?? 0, NaN);
            }}
            data-testid="input-location-lng"
          />
        </FieldLabel>
      </div>
    </div>
  );
}

function LocationsPanel(props: {
  locations: Array<{ id: string; name: string; description: string; lat: number; lng: number; isPermanent: boolean; nfcEnabled?: boolean; nfcId?: string | null }>;
  onCreate: (v: { name: string; description: string; lat: number; lng: number; isPermanent: boolean; nfcEnabled: boolean; nfcId: string }) => void;
  onUpdate: (id: string, patch: Partial<{ name: string; description: string; lat: number; lng: number; isPermanent: boolean; nfcEnabled: boolean; nfcId: string | null }>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [nfcSlug, setNfcSlug] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCoord = useCallback((la: number, lo: number) => {
    setLat(isNaN(la) ? null : la);
    setLng(isNaN(lo) ? null : lo);
  }, []);

  const handleAdd = () => {
    if (!name.trim() || lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      toast("Fill all fields", { description: "Name and map pin are required" });
      return;
    }
    props.onCreate({ name: name.trim(), description: description.trim(), lat, lng, isPermanent, nfcEnabled, nfcId: nfcSlug.trim() });
    setName("");
    setDescription("");
    setLat(null);
    setLng(null);
    setIsPermanent(false);
    setNfcEnabled(false);
    setNfcSlug("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(v => !v)}
        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white animate-sparkle transition"
        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}
        data-testid="button-show-add-location"
      >
        <MapPin className="h-4 w-4 text-amber-400" />
        Add new node
        {showForm ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <NodeCard>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">New node</p>
              <FieldLabel label="Name">
                <StyledInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Victoria Park Gate"
                  data-testid="input-location-name"
                />
              </FieldLabel>
              <FieldLabel label="Description">
                <StyledTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this spot…"
                  data-testid="input-location-description"
                />
              </FieldLabel>
              <FieldLabel label="Pin location">
                <CoordPicker
                  lat={lat}
                  lng={lng}
                  onChange={handleCoord}
                  existingNodes={props.locations}
                />
              </FieldLabel>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-white/40">Permanent node</span>
                <Switch
                  checked={isPermanent}
                  onCheckedChange={setIsPermanent}
                  data-testid="switch-location-permanent"
                />
              </div>
              <div className="border-t border-white/5 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Nfc className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs text-white/70 font-medium">NFC tag</span>
                  </div>
                  <Switch
                    checked={nfcEnabled}
                    onCheckedChange={setNfcEnabled}
                    data-testid="switch-location-nfc"
                  />
                </div>
                {nfcEnabled && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30">Slug to program on the tag (e.g. dauphine-dream)</p>
                    <StyledInput
                      value={nfcSlug}
                      onChange={(e) => setNfcSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="my-node-slug"
                      data-testid="input-location-nfc-id"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleAdd}
                className="w-full h-11 rounded-2xl text-sm font-bold text-black animate-sparkle transition"
                style={{ background: lat !== null && lng !== null ? "hsl(45,96%,54%)" : "rgba(255,255,255,0.15)" }}
                data-testid="button-add-location"
              >
                {lat !== null && lng !== null ? "Save node" : "Pin a location first"}
              </button>
            </NodeCard>
          </motion.div>
        )}
      </AnimatePresence>

      {props.locations.length === 0 && (
        <p className="text-center text-xs text-white/30 py-6">No nodes yet. Add one above.</p>
      )}

      {props.locations.map((l) => (
        <LocationRow
          key={l.id}
          loc={l}
          allNodes={props.locations}
          onUpdate={(patch) => props.onUpdate(l.id, patch)}
          onDelete={() => props.onDelete(l.id)}
        />
      ))}
    </div>
  );
}

function LocationRow(props: {
  loc: { id: string; name: string; description: string; lat: number; lng: number; isPermanent: boolean; nfcEnabled?: boolean; nfcId?: string | null };
  allNodes: Array<{ id: string; name: string; lat: number; lng: number }>;
  onUpdate: (patch: Partial<{ name: string; description: string; lat: number; lng: number; isPermanent: boolean; nfcEnabled: boolean; nfcId: string | null }>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(props.loc.name);
  const [description, setDescription] = useState(props.loc.description);
  const [lat, setLat] = useState<number | null>(props.loc.lat);
  const [lng, setLng] = useState<number | null>(props.loc.lng);
  const [isPermanent, setIsPermanent] = useState(props.loc.isPermanent);
  const [nfcEnabled, setNfcEnabled] = useState(props.loc.nfcEnabled ?? false);
  const [nfcId, setNfcId] = useState(props.loc.nfcId ?? "");
  const [saved, setSaved] = useState(false);
  const nfcUrl = nfcId ? `${window.location.origin}/nfc/${nfcId}` : "";

  const handleCoord = useCallback((la: number, lo: number) => {
    setLat(isNaN(la) ? null : la);
    setLng(isNaN(lo) ? null : lo);
  }, []);

  const handleSave = () => {
    if (!name.trim() || lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      toast("Name and coordinates are required");
      return;
    }
    props.onUpdate({ name: name.trim(), description: description.trim(), lat, lng, isPermanent, nfcEnabled, nfcId: nfcId.trim() || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      data-testid={`card-location-${props.loc.id}`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition"
        onClick={() => setExpanded(v => !v)}
      >
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,158,11,0.1)" }}
        >
          <MapPin className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate" data-testid={`text-location-name-${props.loc.id}`}>
            {props.loc.name}
          </p>
          <p className="text-[10px] text-white/30 font-mono">
            {props.loc.lat.toFixed(4)}, {props.loc.lng.toFixed(4)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {props.loc.isPermanent && (
            <span className="text-[9px] uppercase tracking-wider text-amber-400/60 font-bold">Permanent</span>
          )}
          {props.loc.nfcEnabled && (
            <span className="flex items-center gap-0.5 text-[9px] uppercase tracking-wider text-cyan-400/70 font-bold">
              <Nfc className="h-3 w-3" />NFC
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-white/25" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/25" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              <FieldLabel label="Name">
                <StyledInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid={`input-location-name-${props.loc.id}`}
                />
              </FieldLabel>
              <FieldLabel label="Description">
                <StyledTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid={`input-location-description-${props.loc.id}`}
                />
              </FieldLabel>
              <FieldLabel label="Pin location">
                <CoordPicker
                  lat={lat}
                  lng={lng}
                  onChange={handleCoord}
                  existingNodes={props.allNodes.filter(n => n.id !== props.loc.id)}
                />
              </FieldLabel>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-white/40">Permanent node</span>
                <Switch
                  checked={isPermanent}
                  onCheckedChange={setIsPermanent}
                  data-testid={`switch-location-permanent-${props.loc.id}`}
                />
              </div>

              {/* NFC Section */}
              <div className="border-t border-white/5 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Nfc className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs text-white/70 font-medium">NFC tag</span>
                  </div>
                  <Switch
                    checked={nfcEnabled}
                    onCheckedChange={setNfcEnabled}
                    data-testid={`switch-location-nfc-${props.loc.id}`}
                  />
                </div>
                {nfcEnabled && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/30">Tag slug (e.g. dauphine-dream)</p>
                      <StyledInput
                        value={nfcId}
                        onChange={(e) => setNfcId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        placeholder="node-slug"
                        data-testid={`input-location-nfc-id-${props.loc.id}`}
                      />
                    </div>
                    {nfcUrl && (
                      <div
                        className="flex items-center gap-2 rounded-xl p-2.5 cursor-pointer group"
                        style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)" }}
                        onClick={() => { navigator.clipboard.writeText(nfcUrl); toast("URL copied to clipboard"); }}
                        data-testid={`button-copy-nfc-url-${props.loc.id}`}
                      >
                        <Nfc className="h-3 w-3 text-cyan-400 shrink-0" />
                        <span className="text-[10px] text-cyan-300/80 font-mono flex-1 truncate">{nfcUrl}</span>
                        <Copy className="h-3 w-3 text-cyan-400/50 group-hover:text-cyan-400 shrink-0 transition" />
                      </div>
                    )}
                    {!nfcId && (
                      <p className="text-[10px] text-white/25 italic">Enter a slug above to generate the tag URL.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 h-10 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition"
                  style={{ background: saved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.25)"}`, color: saved ? "rgb(52,211,153)" : "rgb(251,191,36)" }}
                  data-testid={`button-save-location-${props.loc.id}`}
                >
                  {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : "Save changes"}
                </button>
                <button
                  onClick={props.onDelete}
                  className="h-10 w-10 rounded-2xl flex items-center justify-center transition hover:bg-red-500/10"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  data-testid={`button-delete-location-${props.loc.id}`}
                >
                  <Trash2 className="h-4 w-4 text-white/30 hover:text-red-400 transition" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContentPanel(props: {
  contents: Array<{ id: string; title: string; creator: string; description: string; audioUrl: string }>;
  onCreate: (v: { title: string; creator: string; description: string; audioUrl: string }) => void;
  onUpdate: (id: string, patch: Partial<{ title: string; creator: string; description: string; audioUrl: string }>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(v => !v)}
        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        data-testid="button-show-add-content"
      >
        + Add content item
        {showForm ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <NodeCard>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">New content</p>
              <FieldLabel label="Title">
                <StyledInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track or release name" data-testid="input-content-title" />
              </FieldLabel>
              <FieldLabel label="Artist / Creator">
                <StyledInput value={creator} onChange={(e) => setCreator(e.target.value)} placeholder="Artist name" data-testid="input-content-creator" />
              </FieldLabel>
              <FieldLabel label="Description">
                <StyledTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description…" data-testid="input-content-description" />
              </FieldLabel>
              <FieldLabel label="Audio URL (mp3)">
                <StyledInput value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://…" data-testid="input-content-audio" />
              </FieldLabel>
              <button
                onClick={() => {
                  if (!title.trim() || !creator.trim() || !audioUrl.trim()) {
                    toast("Title, creator, and audio URL are required");
                    return;
                  }
                  props.onCreate({ title: title.trim(), creator: creator.trim(), description: description.trim(), audioUrl: audioUrl.trim() });
                  setTitle(""); setCreator(""); setDescription(""); setAudioUrl("");
                  setShowForm(false);
                }}
                className="w-full h-11 rounded-2xl text-sm font-bold text-black animate-sparkle"
                style={{ background: "hsl(45,96%,54%)" }}
                data-testid="button-add-content"
              >
                Add content
              </button>
            </NodeCard>
          </motion.div>
        )}
      </AnimatePresence>

      {props.contents.length === 0 && (
        <p className="text-center text-xs text-white/30 py-6">No content yet.</p>
      )}

      {props.contents.map((c) => (
        <ContentRow key={c.id} c={c} onDelete={() => props.onDelete(c.id)} onUpdate={(patch) => props.onUpdate(c.id, patch)} />
      ))}
    </div>
  );
}

function ContentRow(props: {
  c: { id: string; title: string; creator: string; description: string; audioUrl: string };
  onUpdate: (patch: Partial<{ title: string; creator: string; description: string; audioUrl: string }>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(props.c.title);
  const [creator, setCreator] = useState(props.c.creator);
  const [description, setDescription] = useState(props.c.description);
  const [audioUrl, setAudioUrl] = useState(props.c.audioUrl);
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      data-testid={`card-content-${props.c.id}`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate" data-testid={`text-content-title-${props.c.id}`}>{props.c.title}</p>
          <p className="text-[10px] text-white/35 truncate">{props.c.creator}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-white/25 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/25 shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              <FieldLabel label="Title"><StyledInput value={title} onChange={(e) => setTitle(e.target.value)} data-testid={`input-content-title-${props.c.id}`} /></FieldLabel>
              <FieldLabel label="Artist / Creator"><StyledInput value={creator} onChange={(e) => setCreator(e.target.value)} data-testid={`input-content-creator-${props.c.id}`} /></FieldLabel>
              <FieldLabel label="Description"><StyledTextarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid={`input-content-description-${props.c.id}`} /></FieldLabel>
              <FieldLabel label="Audio URL (mp3)"><StyledInput value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} data-testid={`input-content-audio-${props.c.id}`} /></FieldLabel>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!title.trim() || !creator.trim() || !audioUrl.trim()) { toast("Missing required fields"); return; }
                    props.onUpdate({ title: title.trim(), creator: creator.trim(), description: description.trim(), audioUrl: audioUrl.trim() });
                    setSaved(true); setTimeout(() => setSaved(false), 2000);
                  }}
                  className="flex-1 h-10 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition"
                  style={{ background: saved ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`, color: saved ? "rgb(52,211,153)" : "rgb(255,255,255,0.8)" }}
                  data-testid={`button-save-content-${props.c.id}`}
                >
                  {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : "Save changes"}
                </button>
                <button
                  onClick={props.onDelete}
                  className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-red-500/10 transition"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  data-testid={`button-delete-content-${props.c.id}`}
                >
                  <Trash2 className="h-4 w-4 text-white/30 hover:text-red-400 transition" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignPanel(props: {
  locations: Array<{ id: string; name: string }>;
  contents: Array<{ id: string; title: string; creator: string }>;
  assignments: Array<{ id: string; locationId: string; contentId: string; mode: PulseMode; startAt: string | null; endAt: string | null }>;
  onCreate: (v: { locationId: string; contentId: string; mode: PulseMode; startAt: string; endAt: string }) => void;
  onUpdate: (id: string, patch: Partial<{ locationId: string; contentId: string; mode: PulseMode; startAt: string; endAt: string }>) => void;
  onDelete: (id: string) => void;
}) {
  const [locId, setLocId] = useState(props.locations[0]?.id ?? "");
  const [conId, setConId] = useState(props.contents[0]?.id ?? "");
  const [mode, setMode] = useState<PulseMode>("discover");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  const selectClass = "w-full h-11 rounded-2xl px-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/25 transition";

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(v => !v)}
        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        data-testid="button-show-add-assign"
      >
        + New assignment
        {showForm ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <NodeCard>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">New assignment</p>
              <FieldLabel label="Node">
                <select value={locId} onChange={(e) => setLocId(e.target.value)} className={selectClass} data-testid="select-assign-location">
                  {props.locations.map(l => <option key={l.id} value={l.id} style={{ background: "#111" }}>{l.name}</option>)}
                </select>
              </FieldLabel>
              <FieldLabel label="Content">
                <select value={conId} onChange={(e) => setConId(e.target.value)} className={selectClass} data-testid="select-assign-content">
                  {props.contents.map(c => <option key={c.id} value={c.id} style={{ background: "#111" }}>{c.title} — {c.creator}</option>)}
                </select>
              </FieldLabel>
              <FieldLabel label="Mode">
                <select value={mode} onChange={(e) => setMode(e.target.value as PulseMode)} className={selectClass} data-testid="select-assign-mode">
                  <option value="discover" style={{ background: "#111" }}>Discover</option>
                  <option value="park" style={{ background: "#111" }}>Park</option>
                </select>
              </FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <FieldLabel label="Start">
                  <StyledInput type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} data-testid="input-assign-start" />
                </FieldLabel>
                <FieldLabel label="End">
                  <StyledInput type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} data-testid="input-assign-end" />
                </FieldLabel>
              </div>
              <button
                onClick={() => {
                  if (!locId || !conId || !startAt || !endAt) { toast("All fields required"); return; }
                  props.onCreate({ locationId: locId, contentId: conId, mode, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() });
                  setStartAt(""); setEndAt("");
                  setShowForm(false);
                }}
                className="w-full h-11 rounded-2xl text-sm font-bold text-black animate-sparkle"
                style={{ background: "hsl(45,96%,54%)" }}
                data-testid="button-add-assignment"
              >
                Assign
              </button>
            </NodeCard>
          </motion.div>
        )}
      </AnimatePresence>

      {props.assignments.length === 0 && (
        <p className="text-center text-xs text-white/30 py-6">No assignments yet.</p>
      )}

      {props.assignments.map((a) => {
        const loc = props.locations.find(l => l.id === a.locationId);
        const con = props.contents.find(c => c.id === a.contentId);
        const now = new Date();
        const start = a.startAt ? new Date(a.startAt) : null;
        const end = a.endAt ? new Date(a.endAt) : null;
        const isLive = start && end && now >= start && now <= end;
        const isEnded = end && now > end;
        return (
          <div
            key={a.id}
            className="rounded-2xl p-3 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            data-testid={`card-assignment-${a.id}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isLive ? "rgba(16,185,129,0.15)" : isEnded ? "rgba(255,255,255,0.05)" : "rgba(245,158,11,0.12)",
                    color: isLive ? "rgb(52,211,153)" : isEnded ? "rgba(255,255,255,0.25)" : "rgb(251,191,36)",
                  }}
                >
                  {isLive ? "Live" : isEnded ? "Ended" : "Upcoming"}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">{a.mode}</span>
              </div>
              <p className="text-sm font-semibold text-white mt-1 truncate">{con?.title ?? a.contentId}</p>
              <p className="text-[11px] text-white/40 truncate">{loc?.name ?? a.locationId}</p>
              {a.startAt && a.endAt && (
                <p className="text-[10px] text-white/25 mt-1 font-mono">
                  {new Date(a.startAt).toLocaleDateString()} → {new Date(a.endAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => props.onDelete(a.id)}
              className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition shrink-0"
              data-testid={`button-delete-assignment-${a.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-white/25 hover:text-red-400 transition" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
