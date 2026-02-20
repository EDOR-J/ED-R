import { useState, useEffect, useCallback } from "react";

export type UserRole = "admin" | "artist" | "user";

interface GuestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  profileImageUrl: string | null;
  role: UserRole;
}

const STORAGE_KEY = "edor_guest_session";

function getStoredUser(): GuestUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.role) parsed.role = "user";
    return parsed;
  } catch {
    return null;
  }
}

export function loginGuest(role: UserRole = "user") {
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
    role,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guest));
  return guest;
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

  const logout = useCallback(() => {
    logoutGuest();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    login: loginGuest,
    logout,
    isLoggingOut: false,
  };
}
