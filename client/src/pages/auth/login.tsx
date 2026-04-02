import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Lock, Mail, User, Eye, EyeOff, Phone, Shield,
  Mic2, UserCircle, ChevronRight, Loader2
} from "lucide-react";
import { loginGuest, loginWithServerUser, type UserRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type AuthTab = "join" | "admin";
type EmailMode = "signin" | "signup";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<AuthTab>("join");
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Join EDØR fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupRole, setSignupRole] = useState<"user" | "artist">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin fields
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Google config
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleInitialized = useRef(false);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.googleClientId) setGoogleClientId(d.googleClientId);
      })
      .catch(() => {});
  }, []);

  // Load Google GSI script once we have client ID
  useEffect(() => {
    if (!googleClientId || googleInitialized.current) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleInitialized.current = true;
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [googleClientId]);

  async function handleGoogleCredential(response: { credential: string }) {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google sign-in failed");
      loginWithServerUser(data);
      toast.success("Welcome to EDØR");
      navigateWithTransition(setLocation, "/");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleGoogleClick() {
    if (!googleClientId) {
      toast.error("Google Sign-In is not configured. Please use email/password or guest access.");
      return;
    }
    window.google?.accounts.id.prompt();
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (emailMode === "signup") {
        if (!displayName.trim()) {
          toast.error("Please enter your display name");
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName: displayName.trim(), role: signupRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");
        loginWithServerUser(data);
        toast.success("Account created! Welcome to EDØR");
        navigateWithTransition(setLocation, "/");
      } else {
        const res = await fetch("/api/auth/login/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Sign-in failed");
        loginWithServerUser(data);
        toast.success("Welcome back");
        navigateWithTransition(setLocation, "/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleGuestLogin() {
    loginGuest("user", false);
    toast.success("Entering as guest");
    navigateWithTransition(setLocation, "/");
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (adminUsername.toLowerCase() === "guest" && adminPassword === "edor") {
      loginGuest("admin", true);
      toast.success("Welcome, Admin");
      navigateWithTransition(setLocation, "/");
    } else {
      toast.error("Invalid admin credentials");
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <h1
            className="text-5xl font-bold text-white font-serif tracking-tight mb-1 italic"
            data-testid="text-app-title"
          >
            EDØR
          </h1>
          <p className="text-[10px] text-white/35 uppercase tracking-[0.45em] font-medium">
            Place-Based Music Discovery
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1 gap-1">
          <button
            onClick={() => setTab("join")}
            data-testid="tab-join"
            className={cn(
              "flex-1 h-9 rounded-xl text-sm font-bold transition-all",
              tab === "join"
                ? "bg-primary text-black shadow-sm"
                : "text-white/40 hover:text-white/70"
            )}
          >
            Join EDØR
          </button>
          <button
            onClick={() => setTab("admin")}
            data-testid="tab-admin"
            className={cn(
              "flex-1 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5",
              tab === "admin"
                ? "bg-primary text-black shadow-sm"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </button>
        </div>

        {/* ── JOIN TAB ── */}
        {tab === "join" && (
          <div className="flex flex-col gap-3">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleClick}
              data-testid="button-google-signin"
              disabled={authLoading}
              className="w-full h-12 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
              {!googleClientId && (
                <span className="ml-auto text-[10px] text-white/20 font-normal">not configured</span>
              )}
            </button>

            {/* Phone — coming soon */}
            <button
              disabled
              data-testid="button-phone-signin"
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/[0.02] text-white/30 font-semibold text-sm flex items-center justify-center gap-3 cursor-not-allowed"
            >
              <Phone className="h-4 w-4" />
              Continue with Phone
              <span className="ml-auto text-[10px] bg-white/10 text-white/40 font-bold px-2 py-0.5 rounded-full tracking-wider">
                SOON
              </span>
            </button>

            {/* Email divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-white/25 font-medium tracking-widest uppercase">
                or with email
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email form toggle */}
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                data-testid="button-show-email-form"
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/90 font-semibold text-sm flex items-center justify-center gap-3 transition-all"
              >
                <Mail className="h-4 w-4" />
                Sign in with email
                <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
              </button>
            ) : (
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                {/* Mode toggle */}
                <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setEmailMode("signin")}
                    className={cn(
                      "flex-1 h-8 rounded-[10px] text-xs font-bold transition-all",
                      emailMode === "signin"
                        ? "bg-white/10 text-white"
                        : "text-white/35 hover:text-white/60"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode("signup")}
                    className={cn(
                      "flex-1 h-8 rounded-[10px] text-xs font-bold transition-all",
                      emailMode === "signup"
                        ? "bg-white/10 text-white"
                        : "text-white/35 hover:text-white/60"
                    )}
                  >
                    Create Account
                  </button>
                </div>

                {/* Display name (signup only) */}
                {emailMode === "signup" && (
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Your name"
                      className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 pr-10 text-white placeholder:text-white/20 focus:border-primary/40"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      data-testid="input-displayname"
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 pr-10 text-white placeholder:text-white/20 focus:border-primary/40"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                </div>

                {/* Password */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 pr-10 text-white placeholder:text-white/20 focus:border-primary/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Role selection (signup only) */}
                {emailMode === "signup" && (
                  <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setSignupRole("user")}
                      data-testid="role-user"
                      className={cn(
                        "flex-1 h-9 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                        signupRole === "user"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-white/35 hover:text-white/60"
                      )}
                    >
                      <UserCircle className="h-3.5 w-3.5" />
                      Listener
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole("artist")}
                      data-testid="role-artist"
                      className={cn(
                        "flex-1 h-9 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                        signupRole === "artist"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-white/35 hover:text-white/60"
                      )}
                    >
                      <Mic2 className="h-3.5 w-3.5" />
                      Artist
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={authLoading}
                  data-testid="button-email-submit"
                  className="w-full h-12 rounded-2xl text-sm font-bold tracking-wide"
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : emailMode === "signup" ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            )}

            {/* Separator */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Guest button */}
            <button
              onClick={handleGuestLogin}
              data-testid="button-guest"
              className="w-full h-11 rounded-2xl text-sm text-white/35 hover:text-white/60 font-medium transition-all flex items-center justify-center gap-2"
            >
              Continue as guest
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </button>
          </div>
        )}

        {/* ── ADMIN TAB ── */}
        {tab === "admin" && (
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
            <div className="text-center mb-1">
              <p className="text-xs text-white/30">Admin access only</p>
            </div>

            <div className="relative">
              <Input
                type="text"
                placeholder="Username"
                className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 pr-10 text-white placeholder:text-white/20 focus:border-primary/40"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                data-testid="input-admin-username"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            </div>

            <div className="relative">
              <Input
                type={showAdminPassword ? "text" : "password"}
                placeholder="Password"
                className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 pr-10 text-white placeholder:text-white/20 focus:border-primary/40"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                data-testid="input-admin-password"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              >
                {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              data-testid="button-admin-login"
              className="w-full h-12 rounded-2xl text-sm font-bold tracking-wide"
            >
              <Shield className="h-4 w-4 mr-2" />
              Sign In as Admin
            </Button>

            <div className="flex items-center justify-center gap-2 mt-1">
              <Lock className="h-3 w-3 text-white/15" />
              <p className="text-[11px] text-white/20">
                Credentials: <span className="font-mono text-white/30">guest</span> /{" "}
                <span className="font-mono text-white/30">edor</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
