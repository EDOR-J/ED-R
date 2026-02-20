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
  artworkUrl: string | null;
  videoUrl: string | null;
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

export function useDeleteLibraryItem() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const res = await apiRequest("DELETE", `/api/library/${id}?userId=${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
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

// ── Social types ─────────────────────────────────────────

export type ApiFriendship = {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
};

export type ApiUserStatus = {
  id: string;
  userId: string;
  displayName: string;
  currentContentId: string | null;
  currentContentTitle: string | null;
  currentContentArtist: string | null;
  statusText: string | null;
  isOnline: boolean;
  lastSeen: string;
};

export type ApiListenChat = {
  id: string;
  name: string;
  contentId: string;
  contentTitle: string;
  contentArtist: string;
  audioUrl: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  members?: ApiChatMember[];
};

export type ApiChatMember = {
  id: string;
  chatId: string;
  userId: string;
  displayName: string;
  joinedAt: string;
};

export type ApiChatMessage = {
  id: string;
  chatId: string;
  userId: string;
  displayName: string;
  message: string;
  sentAt: string;
};

export type ApiSharedLibrary = {
  friendId: string;
  friendName: string;
  sharedContent: Array<{
    contentId: string;
    title: string;
    artist: string;
    audioUrl: string;
  }>;
};

export type ApiSearchUser = {
  id: string;
  username: string;
  displayName: string | null;
};

// ── Social hooks ─────────────────────────────────────────

export function useSearchUsers(query: string) {
  return useQuery<ApiSearchUser[]>({
    queryKey: ["/api/users/search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useFriends(userId: string) {
  return useQuery<ApiFriendship[]>({
    queryKey: ["/api/friends", userId],
    queryFn: async () => {
      const res = await fetch(`/api/friends?userId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 10_000,
  });
}

export function usePendingRequests(userId: string) {
  return useQuery<ApiFriendship[]>({
    queryKey: ["/api/friends/pending", userId],
    queryFn: async () => {
      const res = await fetch(`/api/friends/pending?userId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 10_000,
  });
}

export function useFriendsStatuses(userId: string) {
  return useQuery<ApiUserStatus[]>({
    queryKey: ["/api/friends/statuses", userId],
    queryFn: async () => {
      const res = await fetch(`/api/friends/statuses?userId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useSharedLibrary(userId: string) {
  return useQuery<ApiSharedLibrary[]>({
    queryKey: ["/api/friends/shared-library", userId],
    queryFn: async () => {
      const res = await fetch(`/api/friends/shared-library?userId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: async (data: { senderId: string; receiverId: string }) => {
      const res = await apiRequest("POST", "/api/friends/request", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
  });
}

export function useAcceptFriend() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/friends/${id}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/statuses"] });
    },
  });
}

export function useDeclineFriend() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/friends/${id}/decline`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
  });
}

export function useRemoveFriend() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/friends/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/statuses"] });
    },
  });
}

export function useUpdateStatus() {
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      displayName: string;
      currentContentId?: string;
      currentContentTitle?: string;
      currentContentArtist?: string;
      statusText?: string;
      isOnline?: boolean;
    }) => {
      const res = await apiRequest("PUT", "/api/status", data);
      return res.json();
    },
  });
}

export function useActiveListenChats() {
  return useQuery<ApiListenChat[]>({
    queryKey: ["/api/listen-chats"],
    staleTime: 10_000,
  });
}

export function useListenChat(id: string) {
  return useQuery<ApiListenChat>({
    queryKey: ["/api/listen-chats", id],
    queryFn: async () => {
      const res = await fetch(`/api/listen-chats/${id}`);
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useChatMessages(chatId: string) {
  return useQuery<ApiChatMessage[]>({
    queryKey: ["/api/listen-chats", chatId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/listen-chats/${chatId}/messages`);
      return res.json();
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });
}

export function useCreateListenChat() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      contentId: string;
      contentTitle: string;
      contentArtist: string;
      audioUrl: string;
      createdBy: string;
      displayName: string;
    }) => {
      const res = await apiRequest("POST", "/api/listen-chats", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listen-chats"] });
    },
  });
}

export function useJoinListenChat() {
  return useMutation({
    mutationFn: async (data: { chatId: string; userId: string; displayName: string }) => {
      const res = await apiRequest("POST", `/api/listen-chats/${data.chatId}/join`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listen-chats"] });
    },
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (data: { chatId: string; userId: string; displayName: string; message: string }) => {
      const res = await apiRequest("POST", `/api/listen-chats/${data.chatId}/messages`, data);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listen-chats", vars.chatId, "messages"] });
    },
  });
}

export function useSeedSocial() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed-social", {});
      return res.json();
    },
  });
}
