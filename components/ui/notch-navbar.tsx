"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function ThemeButton() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("kredpane-theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("kredpane-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full border border-[color:var(--line-strong)] text-[color:var(--fg)] hover:bg-[color:var(--s2)] transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        )}
      </svg>
    </button>
  );
}

export function NotchNavbar({
  className,
  logo,
  ...props
}: React.HTMLAttributes<HTMLElement> & { logo?: React.ReactNode }) {
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

          <div className="relative w-full h-full flex items-center justify-center pl-8 pr-12">
            <div className="flex items-center justify-center mt-1">
              {logo || (
                <Link href="/" className="flex items-center justify-center">
                  <span className="w-7 h-7 bg-[#d6ff34] rounded-[7px]" />
                </Link>
              )}
            </div>
            <ThemeButton />
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
