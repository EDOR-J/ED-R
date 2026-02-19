import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Lock, User } from "lucide-react";
import { loginGuest } from "@/hooks/use-auth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.toLowerCase() === "guest" && password === "edor") {
      loginGuest();
      toast.success("Welcome to EDØR");
      setLocation("/");
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif tracking-tight mb-2 italic" data-testid="text-app-title">EDØR</h1>
          <p className="text-xs text-white/40 uppercase tracking-[0.4em] font-medium">Place-Based Music Discovery</p>
        </div>

        <Card className="edor-noise glass border-white/10 p-8 rounded-3xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Name</p>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter name"
                  className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 text-white focus:border-primary/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-name"
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Password</p>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 text-white focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-14 rounded-2xl text-base font-bold tracking-wide mt-2 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Enter EDØR
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground opacity-0 group-hover:opacity-10 transition-opacity" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
