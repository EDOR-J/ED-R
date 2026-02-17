import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { User, Mail, LogOut, ChevronRight, Shield, Bell } from "lucide-react";

export default function ProfilePage() {
  const [, setLocation] = useLocation();

  const handleSignOut = () => {
    toast.success("Signed out successfully");
    setLocation("/login");
  };

  return (
    <Shell title="Profile">
      <div className="px-6 py-6 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <User className="h-10 w-10 text-white/20" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-serif">Pulse User</h2>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Mail className="h-3 w-3" /> user@edor.fm
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] ml-1">Settings</p>
          {[
            { icon: Bell, label: "Pulse Notifications" },
            { icon: Shield, label: "Privacy & Visibility" },
          ].map((item, i) => (
            <Card key={i} className="edor-noise glass border-white/10 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-transform cursor-pointer">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-white/40" />
                <span className="text-sm font-bold text-white/80">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20" />
            </Card>
          ))}
        </div>

        <Button 
          variant="outline" 
          className="w-full h-14 rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500/5 hover:text-red-400 mt-4 font-bold tracking-widest uppercase text-xs gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Terminate Session
        </Button>

        <p className="text-center text-[10px] text-white/20 uppercase font-bold tracking-[0.5em] mt-8">
          EDØR v1.0.4
        </p>
      </div>
    </Shell>
  );
}
