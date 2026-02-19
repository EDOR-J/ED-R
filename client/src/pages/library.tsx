import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { useLibrary, useDeleteLibraryItem, type ApiLibraryItem } from "@/lib/api";
import { Music, Play, ArrowLeft, Clock, MapPin, MoreHorizontal, Trash2, Share2, Link2, ListPlus, MessageCircle, Copy } from "lucide-react";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function LibraryPage() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useLibrary();
  const deleteItem = useDeleteLibraryItem();
  const { toast } = useToast();

  const libraryItems: ApiLibraryItem[] = data || [];

  const handleDelete = (item: ApiLibraryItem) => {
    deleteItem.mutate(item.id, {
      onSuccess: () => {
        toast({ title: "Removed", description: `${item.title} removed from library` });
      },
    });
  };

  const handleCopyLink = (item: ApiLibraryItem) => {
    const url = `${window.location.origin}/content/${item.contentId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied", description: "Track link copied to clipboard" });
    });
  };

  const handleShareText = (item: ApiLibraryItem) => {
    const text = `Check out "${item.title}" by ${item.artist} on EDØR`;
    const url = `${window.location.origin}/content/${item.contentId}`;
    if (navigator.share) {
      navigator.share({ title: item.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        toast({ title: "Copied", description: "Share text copied to clipboard" });
      });
    }
  };

  const handleShareSocial = (item: ApiLibraryItem, platform: string) => {
    const url = `${window.location.origin}/content/${item.contentId}`;
    const text = encodeURIComponent(`Check out "${item.title}" by ${item.artist} on EDØR`);
    const encodedUrl = encodeURIComponent(url);
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${encodedUrl}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleAddToQueue = (item: ApiLibraryItem) => {
    toast({ title: "Added to queue", description: `${item.title} added to your queue` });
  };

  if (isLoading) {
    return (
      <Shell
        title="Library"
        right={
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full text-white/60" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        }
      >
        <div className="px-4 py-4">
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
          <Button variant="ghost" size="icon" className="rounded-full text-white/60" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      }
    >
      <div className="px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-lg font-bold text-white font-serif" data-testid="text-library-title">Unlocked Content</h2>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest" data-testid="text-library-count">
            {libraryItems.length} Items
          </span>
        </div>

        {libraryItems.length > 0 ? (
          <div className="flex flex-col divide-y divide-white/5">
            {libraryItems.map((item: ApiLibraryItem) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2.5 px-1 group"
                data-testid={`library-track-${item.id}`}
              >
                <div
                  className="h-11 w-11 rounded-xl border border-white/8 bg-gradient-to-br from-white/8 to-white/3 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => setLocation(`/content/${item.contentId}?loc=${item.nodeId}`)}
                  data-testid={`button-play-${item.id}`}
                >
                  <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setLocation(`/content/${item.contentId}?loc=${item.nodeId}`)}
                >
                  <h3 className="text-[13px] font-semibold text-white truncate leading-tight" data-testid={`text-track-title-${item.id}`}>
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-white/45 truncate leading-tight mt-0.5" data-testid={`text-track-artist-${item.id}`}>
                    {item.artist}
                  </p>
                  <div className="flex items-center gap-2.5 mt-1 text-[9px] text-white/30 font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-0.5" data-testid={`text-track-location-${item.id}`}>
                      <MapPin className="h-2.5 w-2.5" />
                      {item.locationName}
                    </span>
                    <span className="flex items-center gap-0.5" data-testid={`text-track-date-${item.id}`}>
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(item.unlockedAt), 'MMM d')}
                    </span>
                    {item.unlockCount > 1 && (
                      <span className="text-primary/50" data-testid={`text-track-count-${item.id}`}>
                        x{item.unlockCount}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 shrink-0"
                      data-testid={`button-track-menu-${item.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl text-white"
                  >
                    <DropdownMenuItem
                      className="text-xs gap-2.5 py-2.5 cursor-pointer focus:bg-white/5 focus:text-white"
                      onClick={() => handleAddToQueue(item)}
                      data-testid={`menu-queue-${item.id}`}
                    >
                      <ListPlus className="h-3.5 w-3.5 text-white/50" />
                      Add to Queue
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/5" />

                    <DropdownMenuItem
                      className="text-xs gap-2.5 py-2.5 cursor-pointer focus:bg-white/5 focus:text-white"
                      onClick={() => handleShareText(item)}
                      data-testid={`menu-share-text-${item.id}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-white/50" />
                      Share via Text
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-xs gap-2.5 py-2.5 cursor-pointer focus:bg-white/5 focus:text-white data-[state=open]:bg-white/5" data-testid={`menu-share-social-${item.id}`}>
                        <Share2 className="h-3.5 w-3.5 text-white/50" />
                        Share to Socials
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl text-white">
                        <DropdownMenuItem
                          className="text-xs gap-2.5 py-2 cursor-pointer focus:bg-white/5 focus:text-white"
                          onClick={() => handleShareSocial(item, "twitter")}
                          data-testid={`menu-share-twitter-${item.id}`}
                        >
                          X / Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs gap-2.5 py-2 cursor-pointer focus:bg-white/5 focus:text-white"
                          onClick={() => handleShareSocial(item, "facebook")}
                          data-testid={`menu-share-facebook-${item.id}`}
                        >
                          Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs gap-2.5 py-2 cursor-pointer focus:bg-white/5 focus:text-white"
                          onClick={() => handleShareSocial(item, "whatsapp")}
                          data-testid={`menu-share-whatsapp-${item.id}`}
                        >
                          WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem
                      className="text-xs gap-2.5 py-2.5 cursor-pointer focus:bg-white/5 focus:text-white"
                      onClick={() => handleCopyLink(item)}
                      data-testid={`menu-copy-link-${item.id}`}
                    >
                      <Link2 className="h-3.5 w-3.5 text-white/50" />
                      Copy Link
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/5" />

                    <DropdownMenuItem
                      className="text-xs gap-2.5 py-2.5 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      onClick={() => handleDelete(item)}
                      data-testid={`menu-delete-${item.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove from Library
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Music className="h-5 w-5 text-white/20" />
            </div>
            <div>
              <p className="text-sm text-white/60">Your library is empty.</p>
              <p className="text-xs text-white/40 mt-1">Start exploring the city to unlock content.</p>
            </div>
            <Link href="/pulse">
              <Button className="mt-2 rounded-2xl px-8" data-testid="button-find-pulse">Find Pulse</Button>
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
