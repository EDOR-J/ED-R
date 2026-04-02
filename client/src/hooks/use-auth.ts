import { useState, useEffect, useCallback } from "react";

export type UserRole = "admin" | "artist" | "user";

export interface GuestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  profileImageUrl: string | null;
  displayName: string | null;
  role: UserRole;
  isPaid: boolean;
  authProvider: "email" | "google" | "phone" | "guest" | "admin";
}

const STORAGE_KEY = "edor_guest_session";

function getStoredUser(): GuestUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.role) parsed.role = "user";
    if (parsed.isPaid === undefined) parsed.isPaid = false;
    if (!parsed.authProvider) parsed.authProvider = "guest";
    return parsed;
  } catch {
    return null;
  }
}

function storeUser(user: GuestUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

// Called after successful server login (email or Google)
export function loginWithServerUser(serverUser: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  authProvider?: string | null;
}) {
  const role = (serverUser.role as UserRole) || "user";
  const user: GuestUser = {
    id: serverUser.id,
    firstName: serverUser.firstName || serverUser.displayName || "User",
    lastName: serverUser.lastName || "",
    email: serverUser.email || null,
    profileImageUrl: serverUser.profileImageUrl || null,
    displayName: serverUser.displayName || serverUser.firstName || null,
    role,
    isPaid: role === "admin" || role === "artist",
    authProvider: (serverUser.authProvider as GuestUser["authProvider"]) || "email",
  };
  storeUser(user);
  return user;
}

// Guest login — client-side only
export function loginGuest(role: UserRole = "user", isPaid: boolean = false) {
  const roleLabels: Record<UserRole, string> = {
    admin: "Admin",
    artist: "Artist",
    user: "Guest",
  };
  const guest: GuestUser = {
    id: "guest-" + Date.now(),
    firstName: roleLabels[role],
    lastName: "",
    email: null,
    profileImageUrl: null,
    displayName: roleLabels[role],
    role,
    isPaid: role === "admin" || role === "artist" ? true : isPaid,
    authProvider: role === "admin" ? "admin" : "guest",
  };
  storeUser(guest);
  return guest;
}

export function canHostCircle(user: GuestUser | null): boolean {
  if (!user) return false;
  return user.isPaid || user.role === "admin";
}

export function logoutGuest() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<GuestUser | null>(() => getStoredUser());

  useEffect(() => {
    const handler = () => {
      setUser(getStoredUser());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const logout = useCallback(async () => {
    const stored = getStoredUser();
    // If server-authenticated user, also destroy server session
    if (stored && stored.authProvider !== "guest" && stored.authProvider !== "admin") {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Ignore network errors on logout
      }
    }
    logoutGuest();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const refreshUser = useCallback((updated: GuestUser) => {
    storeUser(updated);
    setUser(updated);
  }, []);

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    login: loginGuest,
    logout,
    refreshUser,
    isLoggingOut: false,
  };
}
