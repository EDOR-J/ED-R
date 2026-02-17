import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert, Lock, Zap } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [envError, setEnvError] = useState<string | null>(null);

  // Mock runtime check for environment variables
  useEffect(() => {
    // In a real app, these would come from process.env or import.meta.env
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setEnvError("Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY");
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (envError) {
      toast.error("Connection failed: Server configuration error");
      return;
    }
    // Mock login success
    toast.success("Welcome back to EDØR");
    setLocation("/");
  };

  if (envError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="edor-noise glass border-red-500/20 p-8 max-w-md w-full text-center flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white font-serif">Configuration Error</h1>
          <p className="text-sm text-white/60 leading-relaxed">
            EDØR requires specific environment variables to connect to the secure vault.
          </p>
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 w-full text-left">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Missing Variables</p>
            <code className="text-xs text-red-300/80 block">SUPABASE_URL</code>
            <code className="text-xs text-red-300/80 block">SUPABASE_ANON_KEY</code>
          </div>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
            Check your README or .env file to resolve.
          </p>
          <Button 
            variant="outline" 
            className="mt-4 border-white/10 text-white/60 hover:text-white"
            onClick={() => setEnvError(null)} // Bypass for mockup demo
          >
            Bypass for Prototype
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background element */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif tracking-tight mb-2 italic">EDØR</h1>
          <p className="text-xs text-white/40 uppercase tracking-[0.4em] font-medium">Secure Pulse Access</p>
        </div>

        <Card className="edor-noise glass border-white/10 p-8 rounded-3xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Identity</p>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email"
                  className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 text-white focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Passcode</p>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 text-white focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-base font-bold tracking-wide mt-2 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Initialize Pulse
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground opacity-0 group-hover:opacity-10 transition-opacity" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-[#0A0A0A] px-2 text-white/30">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 hover:text-white relative overflow-hidden group"
            onClick={() => {
              // Mock Google Login
              toast.success("Authenticating with Google...");
              setTimeout(() => {
                toast.success("Welcome back to EDØR");
                setLocation("/");
              }, 1500);
            }}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-white/80 font-medium">Google</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 hover:text-white relative overflow-hidden group mt-3"
            onClick={() => {
              // Mock Apple Login
              toast.success("Authenticating with Apple...");
              setTimeout(() => {
                toast.success("Welcome back to EDØR");
                setLocation("/");
              }, 1500);
            }}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.36-.16-.7-.31-1.12-.31-.44 0-.79.15-1.2.32-.87.4-1.83.56-2.87-.2-2.22-1.63-3.69-5.17-1.54-7.94.88-1.13 2.16-1.74 3.42-1.74 1 0 1.83.65 2.53.65s2.22-.68 3.52-.61c.6.02 1.77.25 2.65 1.19-2.31 1.25-1.92 4.49.52 5.51-.43 1.15-1.07 2.22-1.83 3.03l-.47.63v.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="text-white/80 font-medium">Apple</span>
          </Button>
          
          <div className="mt-8 flex flex-col gap-4 text-center">
            <Link href="/forgot-password" className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase font-bold tracking-widest">
              Forgot Credentials?
            </Link>
            <div className="h-px bg-white/5 w-full" />
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
              Don't have access? <Link href="/signup" className="text-primary">Create ID</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
