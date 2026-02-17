import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Recovery link sent to " + email);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-sm z-10">
        <Link href="/login" className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-widest mb-10 hover:text-white transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Login
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight mb-2 italic">Recover Access</h1>
          <p className="text-xs text-white/40 uppercase tracking-[0.4em] font-medium">Reset Pulse Passcode</p>
        </div>

        <Card className="edor-noise glass border-white/10 p-8 rounded-3xl">
          <form onSubmit={handleReset} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-1">Identity (Email)</p>
              <Input
                type="email"
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 rounded-2xl h-12 pl-4 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold tracking-wide">
              <Mail className="h-4 w-4 mr-2" />
              Send Recovery Link
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
