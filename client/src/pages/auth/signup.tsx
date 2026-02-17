import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Zap, UserPlus, Mail } from "lucide-react";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account created successfully");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif tracking-tight mb-2 italic">EDØR</h1>
          <p className="text-xs text-white/40 uppercase tracking-[0.4em] font-medium">Create Pulse ID</p>
        </div>

        <Card className="edor-noise glass border-white/10 p-8 rounded-3xl">
          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Identity (Email)</p>
              <Input
                type="email"
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 text-white focus:border-primary/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Secure Passcode</p>
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

            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold tracking-wide mt-2">
              <UserPlus className="h-4 w-4 mr-2" />
              Join the Pulse
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
              Already have an ID? <Link href="/login" className="text-primary">Sign In</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
