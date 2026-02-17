import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
          
          <div className="mt-8 flex flex-col gap-4 text-center">
            <button className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase font-bold tracking-widest">
              Forgot Credentials?
            </button>
            <div className="h-px bg-white/5 w-full" />
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
              Don't have access? <span className="text-primary">Contact Admin</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
