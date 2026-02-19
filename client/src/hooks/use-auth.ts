import { useState, useEffect, useCallback } from "react";

interface GuestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  profileImageUrl: string | null;
}

const STORAGE_KEY = "edor_guest_session";

function getStoredUser(): GuestUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function loginGuest() {
  const guest: GuestUser = {
    id: "guest-" + Date.now(),
    firstName: "Guest",
    lastName: "",
    email: null,
    profileImageUrl: null,
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
