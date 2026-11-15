"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotchNavbar({
  className,
  logo,
  ...props
}: React.HTMLAttributes<HTMLElement> & { logo?: React.ReactNode }) {
  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0", className)} {...props}>
      <div className="flex-1 h-10 bg-white z-20 relative min-w-0">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
        </svg>
      </div>

      <div className="flex h-16 relative z-10 shrink-0 -ml-px">
        <div className="w-[50px] h-full relative shrink-0">
          <div className="absolute inset-0 bg-white" style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
            <path d="M0 39.5 C25 39.5 25 63.5 50 63.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
            <path d="M0 36.5 C25 36.5 25 60.5 50 60.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          </svg>
        </div>

        <div className="flex-1 h-full relative min-w-0 -ml-px">
          <div className="absolute inset-0 bg-white">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line x1="0" y1="63.5" x2="100%" y2="63.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
              <line x1="0" y1="60.5" x2="100%" y2="60.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
            </svg>
          </div>

          <div className="relative w-full h-full flex items-center justify-center px-6">
            <div className="flex items-center justify-center mt-1">
              {logo || (
                <Link href="/" className="flex items-center justify-center">
                  <span className="w-7 h-7 bg-[#d6ff34] rounded-[7px]" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="w-[50px] h-full relative shrink-0 -ml-px">
          <div className="absolute inset-0 bg-white" style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
            <path d="M0 63.5 C25 63.5 25 39.5 50 39.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
            <path d="M0 60.5 C25 60.5 25 36.5 50 36.5" fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          </svg>
        </div>
      </div>

      <div className="flex-1 h-10 bg-white z-20 relative min-w-0 -ml-px">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
          <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} className="text-foreground" />
        </svg>
      </div>
    </header>
  );
}
