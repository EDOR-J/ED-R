import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { MiniPlayer } from "./mini-player";
import { BottomNav } from "./bottom-nav";

export default function Shell(
  props: PropsWithChildren<{ title?: string; right?: React.ReactNode }>,
) {
  return (
    <div className="min-h-dvh edor-grid">
      <MiniPlayer />
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-5">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full px-3 py-2",
              "text-xs font-medium tracking-wide text-white/80 hover:text-white",
              "hover:bg-white/5 active:bg-white/10 transition",
            )}
            data-testid="link-home"
          >
            <span className="font-serif italic text-white/90">EDØR</span>
            <span className="text-white/35">/</span>
            <span className="text-white/70">Pulse</span>
          </Link>
          {props.right ? <div>{props.right}</div> : null}
        </header>

        {props.title ? (
          <div className="mt-6">
            <h1
              className={cn(
                "text-[28px] leading-[1.05] tracking-tight",
                "font-serif font-bold",
              )}
              data-testid="text-page-title"
            >
              {props.title}
            </h1>
          </div>
        ) : null}

        <main className={cn("mt-6")}>{props.children}</main>

        <footer className="mt-10 text-center text-xs text-white/45">
          <p data-testid="text-footer"></p>
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
