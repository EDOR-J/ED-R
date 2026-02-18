import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLibrary, type ApiLibraryItem } from "@/lib/api";
import { Music, Play, ArrowLeft, Clock, MapPin } from "lucide-react";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";

export default function LibraryPage() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useLibrary();

  const libraryItems: ApiLibraryItem[] = data || [];

  if (isLoading) {
    return (
      <Shell
        title="Library"
        right={
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full text-white/60">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-white/40 text-sm">Loading library…</div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Library"
      right={
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full text-white/60">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      }
    >
      <div className="px-6 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white font-serif">Unlocked Content</h2>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {libraryItems.length} Items
          </span>
        </div>

        {libraryItems.length > 0 ? (
          <div className="grid gap-3">
            {libraryItems.map((item: ApiLibraryItem) => (
              <Card 
                key={item.id} 
                className="edor-noise glass border-white/10 rounded-3xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-transform"
                onClick={() => setLocation(`/content/${item.contentId}?loc=${item.nodeId}`)}
              >
                <div className="h-16 w-16 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0 overflow-hidden relative">
                  <Music className="h-6 w-6 text-white/20" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                  <p className="text-xs text-white/60 truncate">{item.artist}</p>
                  
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.locationName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.unlockedAt), 'MMM d')}
                    </span>
                    {item.unlockCount > 1 && (
                      <span className="text-primary/60">
                        x{item.unlockCount}
                      </span>
                    )}
                  </div>
                </div>

                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="rounded-full h-10 w-10 bg-white/5 border border-white/10 text-primary hover:bg-primary hover:text-black transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Music className="h-6 w-6 text-white/20" />
            </div>
            <div>
              <p className="text-sm text-white/60">Your library is empty.</p>
              <p className="text-xs text-white/40 mt-1">Start exploring the city to unlock content.</p>
            </div>
            <Link href="/pulse">
              <Button className="mt-2 rounded-2xl px-8">Find Pulse</Button>
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
