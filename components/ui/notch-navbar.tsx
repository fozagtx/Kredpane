"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotchNavbar({
  className,
  logo,
  showNav = true,
  ...props
}: React.HTMLAttributes<HTMLElement> & { logo?: React.ReactNode; showNav?: boolean }) {
  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0", className)} {...props}>
      <div className="canvas flex-1 h-10 z-20 relative min-w-0">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
        </svg>
      </div>

      <div className="flex h-16 relative z-10 shrink-0 -ml-px">
        <div className="w-[50px] h-full relative shrink-0">
          <div className="canvas absolute inset-0" style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
            <path d="M0 39.5 C25 39.5 25 63.5 50 63.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
            <path d="M0 36.5 C25 36.5 25 60.5 50 60.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          </svg>
        </div>

        <div className="flex-1 h-full relative min-w-0 -ml-px">
          <div className="canvas absolute inset-0">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line x1="0" y1="63.5" x2="100%" y2="63.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
              <line x1="0" y1="60.5" x2="100%" y2="60.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
            </svg>
          </div>

          <div className="relative w-full h-full flex items-center gap-8 px-5 md:px-7">
            <div className="flex items-center gap-2.5 shrink-0">
              {logo || (
                <Link href="/" className="flex items-center justify-center">
                  <span className="w-7 h-7 bg-[#d6ff34] rounded-[7px]" />
                </Link>
              )}
              <span className="text-[13px] font-bold uppercase tracking-[0.22em] text-[color:var(--fg)] whitespace-nowrap">
                Kredpane
              </span>
            </div>

            {showNav ? (
              <>
                <a
                  href="#how"
                  className="hidden md:block text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors whitespace-nowrap"
                >
                  How it works
                </a>

                <a
                  href="/scan"
                  className="ml-auto inline-flex items-center px-5 py-2 rounded-full bg-[#d6ff34] text-black text-[12px] font-bold uppercase tracking-[0.12em] shadow-[0_2px_10px_rgba(0,0,0,0.10)] hover:bg-[#c9f22b] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  Scan now
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div className="w-[50px] h-full relative shrink-0 -ml-px">
          <div className="canvas absolute inset-0" style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
            <path d="M0 63.5 C25 63.5 25 39.5 50 39.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
            <path d="M0 60.5 C25 60.5 25 36.5 50 36.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          </svg>
        </div>
      </div>

      <div className="canvas flex-1 h-10 z-20 relative min-w-0 -ml-px">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
        </svg>
      </div>
    </header>
  );
}
