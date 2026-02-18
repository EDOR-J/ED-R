import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

export type PulseMode = "discover" | "park";

export type ApiLocation = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  isPermanent: boolean;
};

export type ApiContent = {
  id: string;
  title: string;
  creator: string;
  description: string;
  audioUrl: string;
  artworkSeed: string | null;
};

export type ApiAssignment = {
  id: string;
  locationId: string;
  mode: string;
  contentId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export type PulseData = {
  locations: ApiLocation[];
  contents: ApiContent[];
  assignments: ApiAssignment[];
};

export type Drop = {
  assignment: ApiAssignment;
  content: ApiContent;
  location: ApiLocation;
};

export type ApiLibraryItem = {
  id: string;
  userId: string | null;
  contentId: string;
  title: string;
  artist: string;
  mode: string;
  nodeId: string;
  locationName: string;
  unlockedAt: string;
  lastUnlockedAt: string | null;
  unlockCount: number;
  audioUrl: string;
  artworkUrl: string;
};

export function usePulseData() {
  return useQuery<PulseData>({
    queryKey: ["/api/pulse-data"],
    staleTime: 30_000,
  });
}

export function useDrops() {
  return useQuery<Drop[]>({
    queryKey: ["/api/drops"],
    staleTime: 30_000,
  });
}

export function useLocations() {
  return useQuery<ApiLocation[]>({
    queryKey: ["/api/locations"],
  });
}

export function useContents() {
  return useQuery<ApiContent[]>({
    queryKey: ["/api/contents"],
  });
}

export function useAssignments() {
  return useQuery<ApiAssignment[]>({
    queryKey: ["/api/assignments"],
  });
}

export function useLibrary() {
  return useQuery<ApiLibraryItem[]>({
    queryKey: ["/api/library"],
    staleTime: 10_000,
  });
}

export function useUnlock() {
  return useMutation({
    mutationFn: async (data: { nodeId: string; contentId: string; mode: string; userId?: string }) => {
      const res = await apiRequest("POST", "/api/unlock", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unlocked-sessions"] });
    },
  });
}

export function useCreateLocation() {
  return useMutation({
    mutationFn: async (data: Omit<ApiLocation, "id">) => {
      const res = await apiRequest("POST", "/api/locations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Omit<ApiLocation, "id">>) => {
      const res = await apiRequest("PATCH", `/api/locations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useDeleteLocation() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useCreateContent() {
  return useMutation({
    mutationFn: async (data: Omit<ApiContent, "id">) => {
      const res = await apiRequest("POST", "/api/contents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useUpdateContent() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Omit<ApiContent, "id">>) => {
      const res = await apiRequest("PATCH", `/api/contents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useDeleteContent() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useCreateAssignment() {
  return useMutation({
    mutationFn: async (data: { locationId: string; mode: string; contentId: string; startAt: string; endAt: string }) => {
      const res = await apiRequest("POST", "/api/assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useUpdateAssignment() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<{ locationId: string; mode: string; contentId: string; startAt: string; endAt: string }>) => {
      const res = await apiRequest("PATCH", `/api/assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function useDeleteAssignment() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulse-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
    },
  });
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dphi = ((b.lat - a.lat) * Math.PI) / 180;
  const dlambda = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function getNearestLocation(coords: { lat: number; lng: number }, locations: ApiLocation[]) {
  if (!locations.length) return null;
  let best = locations[0];
  let bestD = haversineMeters(coords, { lat: best.lat, lng: best.lng });
  for (const l of locations.slice(1)) {
    const d = haversineMeters(coords, { lat: l.lat, lng: l.lng });
    if (d < bestD) { best = l; bestD = d; }
  }
  return { location: best, distanceMeters: bestD };
}

export function pickContentForLocationMode(
  data: PulseData,
  args: { locationId: string; mode: PulseMode },
) {
  const now = new Date().getTime();
  const active = data.assignments
    .filter(a => a.locationId === args.locationId && a.mode === args.mode &&
      now >= new Date(a.startAt).getTime() && now <= new Date(a.endAt).getTime())
    .sort((x, y) => new Date(y.startAt).getTime() - new Date(x.startAt).getTime());
  const a = active[0];
  if (!a) return null;
  const c = data.contents.find(x => x.id === a.contentId);
  if (!c) return null;
  return { assignment: a, content: c };
}
