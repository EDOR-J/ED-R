import { Link, useLocation } from "wouter";
import { Home, Radio, Library, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/pulse", icon: Radio, label: "Pulse" },
  { href: "/social", icon: Users, label: "Social" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  const hiddenRoutes = ["/login", "/signup", "/forgot-password", "/circle"];
  if (hiddenRoutes.some(r => location.startsWith(r))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-black/90 backdrop-blur-xl safe-area-bottom"
      data-testid="nav-bottom"
    >
      <div className="mx-auto max-w-md flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/"
            ? location === "/"
            : location.startsWith(href) || (href === "/social" && location.startsWith("/listen-chat"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all min-w-[48px]",
                isActive
                  ? "text-primary"
                  : "text-white/35 hover:text-white/60 active:text-white/80"
              )}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider",
                isActive ? "text-primary" : "text-white/35"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
