import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addAssignment,
  addContent,
  addLocation,
  deleteAssignment,
  deleteContent,
  deleteLocation,
  loadEdorData,
  updateAssignment,
  updateContent,
  updateLocation,
  type PulseMode,
} from "@/lib/edorStore";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const PASSCODE_KEY = "edor:admin:ok:v1";
const PASSCODE = "edor";

function isAuthed() {
  return localStorage.getItem(PASSCODE_KEY) === "1";
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(isAuthed());
  const [passcode, setPasscode] = useState("");

  const [version, setVersion] = useState(0);
  const data = useMemo(() => loadEdorData(), [version]);

  function refresh() {
    setVersion((v) => v + 1);
  }

  if (!authed) {
    return (
      <Shell title="Admin">
        <Card className="glass rounded-3xl p-5" data-testid="card-admin-lock">
          <p className="text-sm text-white/75" data-testid="text-admin-lock">
            Enter passcode to continue.
          </p>
          <div className="mt-3 grid gap-2">
            <Input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              data-testid="input-passcode"
              type="password"
            />
            <Button
              className="h-12 rounded-2xl"
              onClick={() => {
                if (passcode.trim() === PASSCODE) {
                  localStorage.setItem(PASSCODE_KEY, "1");
                  setAuthed(true);
                  toast("Unlocked", { description: "Admin mode enabled" });
                } else {
                  toast("Incorrect passcode", { description: "Try again" });
                }
              }}
              data-testid="button-passcode"
            >
              Enter
            </Button>
            <Button
              variant="secondary"
              className="h-12 rounded-2xl"
              onClick={() => setLocation("/")}
              data-testid="button-admin-back"
            >
              Back to Home
            </Button>
          </div>
          <p className="mt-3 text-xs text-white/45" data-testid="text-admin-hint">
            Hint for demo: passcode is <span className="font-mono">edor</span>
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell
      title="Admin"
      right={
        <Button
          variant="secondary"
          className="h-9 rounded-full px-3"
          onClick={() => {
            localStorage.removeItem(PASSCODE_KEY);
            setAuthed(false);
            setPasscode("");
          }}
          data-testid="button-logout"
        >
          Lock
        </Button>
      }
    >
      <Tabs defaultValue="locations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/5" data-testid="tabs-admin">
          <TabsTrigger value="locations" className="rounded-xl" data-testid="tab-locations">
            Locations
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl" data-testid="tab-content">
            Content
          </TabsTrigger>
          <TabsTrigger value="assign" className="rounded-xl" data-testid="tab-assign">
            Assign
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="mt-4">
          <LocationsPanel
            locations={data.locations}
            onCreate={(v) => {
              addLocation(v);
              toast("Location added");
              refresh();
            }}
            onUpdate={(id, patch) => {
              updateLocation(id, patch);
              toast("Location updated");
              refresh();
            }}
            onDelete={(id) => {
              deleteLocation(id);
              toast("Location removed");
              refresh();
            }}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <ContentPanel
            contents={data.contents}
            onCreate={(v) => {
              addContent(v);
              toast("Content added");
              refresh();
            }}
            onUpdate={(id, patch) => {
              updateContent(id, patch);
              toast("Content updated");
              refresh();
            }}
            onDelete={(id) => {
              deleteContent(id);
              toast("Content removed");
              refresh();
            }}
          />
        </TabsContent>

        <TabsContent value="assign" className="mt-4">
          <AssignPanel
            locations={data.locations}
            contents={data.contents}
            assignments={data.assignments}
            onCreate={(v) => {
              addAssignment(v);
              toast("Assigned");
              refresh();
            }}
            onUpdate={(id, patch) => {
              updateAssignment(id, patch);
              toast("Assignment updated");
              refresh();
            }}
            onDelete={(id) => {
              deleteAssignment(id);
              toast("Assignment removed");
              refresh();
            }}
          />
        </TabsContent>
      </Tabs>

      <Card className="mt-6 glass rounded-3xl p-4" data-testid="card-admin-note">
        <p className="text-xs text-white/55" data-testid="text-admin-note">
          Rotations control scarcity. Assign different drops per location + mode with start/end dates.
        </p>
      </Card>
    </Shell>
  );
}

function LocationsPanel(props: {
  locations: Array<{ id: string; name: string; description: string; lat: number; lng: number }>;
  onCreate: (v: { name: string; description: string; lat: number; lng: number }) => void;
  onUpdate: (
    id: string,
    patch: Partial<{ name: string; description: string; lat: number; lng: number }>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  return (
    <div className="grid gap-3">
      <Card className="glass rounded-3xl p-4" data-testid="card-create-location">
        <p className="text-sm font-semibold text-white" data-testid="text-create-location-title">
          Add location
        </p>
        <div className="mt-3 grid gap-2">
          <Labeled label="Name" htmlFor="loc-name">
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid="input-location-name"
            />
          </Labeled>
          <Labeled label="Description" htmlFor="loc-desc">
            <Textarea
              id="loc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid="input-location-description"
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Lat" htmlFor="loc-lat">
              <Input
                id="loc-lat"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                data-testid="input-location-lat"
              />
            </Labeled>
            <Labeled label="Lng" htmlFor="loc-lng">
              <Input
                id="loc-lng"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                data-testid="input-location-lng"
              />
            </Labeled>
          </div>
          <Button
            className="h-11 rounded-2xl"
            onClick={() => {
              const la = Number(lat);
              const ln = Number(lng);
              if (!name.trim() || Number.isNaN(la) || Number.isNaN(ln)) {
                toast("Fill all fields", { description: "Name, lat, and lng are required" });
                return;
              }
              props.onCreate({ name: name.trim(), description: description.trim(), lat: la, lng: ln });
              setName("");
              setDescription("");
              setLat("");
              setLng("");
            }}
            data-testid="button-add-location"
          >
            Add
          </Button>
        </div>
      </Card>

      {props.locations.map((l) => (
        <LocationRow
          key={l.id}
          loc={l}
          onUpdate={(patch) => props.onUpdate(l.id, patch)}
          onDelete={() => props.onDelete(l.id)}
        />
      ))}
    </div>
  );
}

function LocationRow(props: {
  loc: { id: string; name: string; description: string; lat: number; lng: number };
  onUpdate: (patch: Partial<{ name: string; description: string; lat: number; lng: number }>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(props.loc.name);
  const [description, setDescription] = useState(props.loc.description);
  const [lat, setLat] = useState(String(props.loc.lat));
  const [lng, setLng] = useState(String(props.loc.lng));

  return (
    <Card className="glass rounded-3xl p-4" data-testid={`card-location-${props.loc.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white" data-testid={`text-location-name-${props.loc.id}`}>
            {props.loc.name}
          </p>
          <p className="mt-1 text-xs text-white/55" data-testid={`text-location-id-${props.loc.id}`}>
            {props.loc.id}
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-9 rounded-full px-3"
          onClick={props.onDelete}
          data-testid={`button-delete-location-${props.loc.id}`}
        >
          Delete
        </Button>
      </div>

      <div className="mt-3 grid gap-2">
        <Labeled label="Name" htmlFor={`name-${props.loc.id}`}>
          <Input
            id={`name-${props.loc.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
            data-testid={`input-location-name-${props.loc.id}`}
          />
        </Labeled>

        <Labeled label="Description" htmlFor={`desc-${props.loc.id}`}>
          <Textarea
            id={`desc-${props.loc.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 rounded-2xl border-white/10 bg-white/5 text-white"
            data-testid={`input-location-description-${props.loc.id}`}
          />
        </Labeled>

        <div className="grid grid-cols-2 gap-2">
          <Labeled label="Lat" htmlFor={`lat-${props.loc.id}`}>
            <Input
              id={`lat-${props.loc.id}`}
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid={`input-location-lat-${props.loc.id}`}
            />
          </Labeled>
          <Labeled label="Lng" htmlFor={`lng-${props.loc.id}`}>
            <Input
              id={`lng-${props.loc.id}`}
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid={`input-location-lng-${props.loc.id}`}
            />
          </Labeled>
        </div>

        <Button
          className="h-11 rounded-2xl"
          onClick={() => {
            const la = Number(lat);
            const ln = Number(lng);
            if (!name.trim() || Number.isNaN(la) || Number.isNaN(ln)) {
              toast("Invalid values", { description: "Name, lat, and lng are required" });
              return;
            }
            props.onUpdate({
              name: name.trim(),
              description: description.trim(),
              lat: la,
              lng: ln,
            });
          }}
          data-testid={`button-save-location-${props.loc.id}`}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

function ContentPanel(props: {
  contents: Array<{
    id: string;
    title: string;
    creator: string;
    description: string;
    audioUrl: string;
  }>;
  onCreate: (v: { title: string; creator: string; description: string; audioUrl: string }) => void;
  onUpdate: (
    id: string,
    patch: Partial<{ title: string; creator: string; description: string; audioUrl: string }>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  return (
    <div className="grid gap-3">
      <Card className="glass rounded-3xl p-4" data-testid="card-create-content">
        <p className="text-sm font-semibold text-white" data-testid="text-create-content-title">
          Add content item
        </p>
        <div className="mt-3 grid gap-2">
          <Labeled label="Title" htmlFor="c-title">
            <Input
              id="c-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid="input-content-title"
            />
          </Labeled>
          <Labeled label="Artist/creator" htmlFor="c-creator">
            <Input
              id="c-creator"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid="input-content-creator"
            />
          </Labeled>
          <Labeled label="Description" htmlFor="c-desc">
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid="input-content-description"
            />
          </Labeled>
          <Labeled label="Audio preview URL (mp3)" htmlFor="c-audio">
            <Input
              id="c-audio"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid="input-content-audio"
            />
          </Labeled>
          <Button
            className="h-11 rounded-2xl"
            onClick={() => {
              if (!title.trim() || !creator.trim() || !audioUrl.trim()) {
                toast("Missing fields", { description: "Title, creator, and audio URL are required" });
                return;
              }
              props.onCreate({
                title: title.trim(),
                creator: creator.trim(),
                description: description.trim(),
                audioUrl: audioUrl.trim(),
              });
              setTitle("");
              setCreator("");
              setDescription("");
              setAudioUrl("");
            }}
            data-testid="button-add-content"
          >
            Add
          </Button>
        </div>
      </Card>

      {props.contents.map((c) => (
        <ContentRow
          key={c.id}
          c={c}
          onDelete={() => props.onDelete(c.id)}
          onUpdate={(patch) => props.onUpdate(c.id, patch)}
        />
      ))}
    </div>
  );
}

function ContentRow(props: {
  c: { id: string; title: string; creator: string; description: string; audioUrl: string };
  onUpdate: (patch: Partial<{ title: string; creator: string; description: string; audioUrl: string }>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(props.c.title);
  const [creator, setCreator] = useState(props.c.creator);
  const [description, setDescription] = useState(props.c.description);
  const [audioUrl, setAudioUrl] = useState(props.c.audioUrl);

  return (
    <Card className="glass rounded-3xl p-4" data-testid={`card-content-${props.c.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white" data-testid={`text-content-title-${props.c.id}`}>
            {props.c.title}
          </p>
          <p className="mt-1 text-xs text-white/55" data-testid={`text-content-id-${props.c.id}`}>
            {props.c.id}
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-9 rounded-full px-3"
          onClick={props.onDelete}
          data-testid={`button-delete-content-${props.c.id}`}
        >
          Delete
        </Button>
      </div>

      <div className="mt-3 grid gap-2">
        <Labeled label="Title" htmlFor={`t-${props.c.id}`}>
          <Input
            id={`t-${props.c.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
            data-testid={`input-content-title-${props.c.id}`}
          />
        </Labeled>
        <Labeled label="Artist/creator" htmlFor={`a-${props.c.id}`}>
          <Input
            id={`a-${props.c.id}`}
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
            data-testid={`input-content-creator-${props.c.id}`}
          />
        </Labeled>
        <Labeled label="Description" htmlFor={`d-${props.c.id}`}>
          <Textarea
            id={`d-${props.c.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 rounded-2xl border-white/10 bg-white/5 text-white"
            data-testid={`input-content-description-${props.c.id}`}
          />
        </Labeled>
        <Labeled label="Audio preview URL (mp3)" htmlFor={`u-${props.c.id}`}>
          <Input
            id={`u-${props.c.id}`}
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
            data-testid={`input-content-audio-${props.c.id}`}
          />
        </Labeled>
        <Button
          className="h-11 rounded-2xl"
          onClick={() => {
            if (!title.trim() || !creator.trim() || !audioUrl.trim()) {
              toast("Missing fields", { description: "Title, creator, and audio URL are required" });
              return;
            }
            props.onUpdate({
              title: title.trim(),
              creator: creator.trim(),
              description: description.trim(),
              audioUrl: audioUrl.trim(),
            });
          }}
          data-testid={`button-save-content-${props.c.id}`}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

function AssignPanel(props: {
  locations: Array<{ id: string; name: string }>;
  contents: Array<{ id: string; title: string }>;
  assignments: Array<{
    id: string;
    locationId: string;
    mode: PulseMode;
    contentId: string;
    startAt: string;
    endAt: string;
  }>;
  onCreate: (v: { locationId: string; mode: PulseMode; contentId: string; startAt: string; endAt: string }) => void;
  onUpdate: (
    id: string,
    patch: Partial<{ locationId: string; mode: PulseMode; contentId: string; startAt: string; endAt: string }>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [locationId, setLocationId] = useState(props.locations[0]?.id ?? "");
  const [mode, setMode] = useState<PulseMode>("discover");
  const [contentId, setContentId] = useState(props.contents[0]?.id ?? "");
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 16));
  const [endAt, setEndAt] = useState(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16));

  const sorted = [...props.assignments].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );

  return (
    <div className="grid gap-3">
      <Card className="glass rounded-3xl p-4" data-testid="card-create-assignment">
        <p className="text-sm font-semibold text-white" data-testid="text-create-assignment-title">
          Assign rotation
        </p>
        <div className="mt-3 grid gap-2">
          <Labeled label="Location" htmlFor="as-loc">
            <select
              id="as-loc"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white"
              data-testid="select-assign-location"
            >
              {props.locations.map((l) => (
                <option key={l.id} value={l.id} data-testid={`option-assign-location-${l.id}`}>
                  {l.name}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label="Mode" htmlFor="as-mode">
            <select
              id="as-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as PulseMode)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white"
              data-testid="select-assign-mode"
            >
              <option value="discover" data-testid="option-assign-mode-discover">Discover</option>
              <option value="park" data-testid="option-assign-mode-park">Park</option>
            </select>
          </Labeled>

          <Labeled label="Content" htmlFor="as-content">
            <select
              id="as-content"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white"
              data-testid="select-assign-content"
            >
              {props.contents.map((c) => (
                <option key={c.id} value={c.id} data-testid={`option-assign-content-${c.id}`}>
                  {c.title}
                </option>
              ))}
            </select>
          </Labeled>

          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Start" htmlFor="as-start">
              <Input
                id="as-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                data-testid="input-assign-start"
              />
            </Labeled>
            <Labeled label="End" htmlFor="as-end">
              <Input
                id="as-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                data-testid="input-assign-end"
              />
            </Labeled>
          </div>

          <Button
            className="h-11 rounded-2xl"
            onClick={() => {
              if (!locationId || !contentId) {
                toast("Missing fields", { description: "Choose a location and content" });
                return;
              }
              const s = new Date(startAt);
              const e = new Date(endAt);
              if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
                toast("Invalid dates", { description: "End must be after start" });
                return;
              }
              props.onCreate({
                locationId,
                mode,
                contentId,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
              });
            }}
            data-testid="button-add-assignment"
          >
            Assign
          </Button>
        </div>
      </Card>

      {sorted.map((a) => (
        <AssignmentRow
          key={a.id}
          a={a}
          locations={props.locations}
          contents={props.contents}
          onUpdate={(patch) => props.onUpdate(a.id, patch)}
          onDelete={() => props.onDelete(a.id)}
        />
      ))}
    </div>
  );
}

function AssignmentRow(props: {
  a: { id: string; locationId: string; mode: PulseMode; contentId: string; startAt: string; endAt: string };
  locations: Array<{ id: string; name: string }>;
  contents: Array<{ id: string; title: string }>;
  onUpdate: (patch: Partial<{ locationId: string; mode: PulseMode; contentId: string; startAt: string; endAt: string }>) => void;
  onDelete: () => void;
}) {
  const [locationId, setLocationId] = useState(props.a.locationId);
  const [mode, setMode] = useState<PulseMode>(props.a.mode);
  const [contentId, setContentId] = useState(props.a.contentId);
  const [startAt, setStartAt] = useState(props.a.startAt.slice(0, 16));
  const [endAt, setEndAt] = useState(props.a.endAt.slice(0, 16));

  const locName = props.locations.find((l) => l.id === locationId)?.name ?? locationId;
  const contentTitle = props.contents.find((c) => c.id === contentId)?.title ?? contentId;

  return (
    <Card className="glass rounded-3xl p-4" data-testid={`card-assignment-${props.a.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white" data-testid={`text-assignment-title-${props.a.id}`}>
            {locName} • {mode === "park" ? "Park" : "Discover"}
          </p>
          <p className="mt-1 text-xs text-white/60" data-testid={`text-assignment-content-${props.a.id}`}>
            {contentTitle}
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-9 rounded-full px-3"
          onClick={props.onDelete}
          data-testid={`button-delete-assignment-${props.a.id}`}
        >
          Delete
        </Button>
      </div>

      <div className="mt-3 grid gap-2">
        <Labeled label="Location" htmlFor={`al-${props.a.id}`}>
          <select
            id={`al-${props.a.id}`}
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white"
            data-testid={`select-assignment-location-${props.a.id}`}
          >
            {props.locations.map((l) => (
              <option key={l.id} value={l.id} data-testid={`option-assignment-location-${props.a.id}-${l.id}`}>
                {l.name}
              </option>
            ))}
          </select>
        </Labeled>

        <Labeled label="Mode" htmlFor={`am-${props.a.id}`}>
          <select
            id={`am-${props.a.id}`}
            value={mode}
            onChange={(e) => setMode(e.target.value as PulseMode)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white"
            data-testid={`select-assignment-mode-${props.a.id}`}
          >
            <option value="discover" data-testid={`option-assignment-mode-${props.a.id}-discover`}>Discover</option>
            <option value="park" data-testid={`option-assignment-mode-${props.a.id}-park`}>Park</option>
          </select>
        </Labeled>

        <Labeled label="Content" htmlFor={`ac-${props.a.id}`}>
          <select
            id={`ac-${props.a.id}`}
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white"
            data-testid={`select-assignment-content-${props.a.id}`}
          >
            {props.contents.map((c) => (
              <option key={c.id} value={c.id} data-testid={`option-assignment-content-${props.a.id}-${c.id}`}>
                {c.title}
              </option>
            ))}
          </select>
        </Labeled>

        <div className="grid grid-cols-2 gap-2">
          <Labeled label="Start" htmlFor={`as-${props.a.id}`}>
            <Input
              id={`as-${props.a.id}`}
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid={`input-assignment-start-${props.a.id}`}
            />
          </Labeled>
          <Labeled label="End" htmlFor={`ae-${props.a.id}`}>
            <Input
              id={`ae-${props.a.id}`}
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              data-testid={`input-assignment-end-${props.a.id}`}
            />
          </Labeled>
        </div>

        <Button
          className="h-11 rounded-2xl"
          onClick={() => {
            const s = new Date(startAt);
            const e = new Date(endAt);
            if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
              toast("Invalid dates", { description: "End must be after start" });
              return;
            }
            props.onUpdate({
              locationId,
              mode,
              contentId,
              startAt: new Date(startAt).toISOString(),
              endAt: new Date(endAt).toISOString(),
            });
          }}
          data-testid={`button-save-assignment-${props.a.id}`}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

function Labeled(props: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={props.htmlFor} className="text-xs text-white/60" data-testid={`label-${props.htmlFor}`}>
        {props.label}
      </Label>
      <div className="mt-1">{props.children}</div>
    </div>
  );
}
