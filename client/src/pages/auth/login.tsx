import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function LoginPage() {
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
          <div className="text-center mb-6">
            <p className="text-sm text-white/60 leading-relaxed">
              Sign in to unlock music drops, build your library, and connect with other listeners.
            </p>
          </div>

          <Button
            data-testid="button-login"
            className="w-full h-14 rounded-2xl text-base font-bold tracking-wide relative overflow-hidden group"
            onClick={() => {
              window.location.href = "/api/login";
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Sign in with Replit
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground opacity-0 group-hover:opacity-10 transition-opacity" />
          </Button>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
              Secure authentication powered by Replit
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
