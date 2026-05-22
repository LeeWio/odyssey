"use client";

import { Typography } from "@heroui/react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useMounted } from "@/hooks/use-mounted";
import { useTranslations } from "next-intl";

export function CinematicHero() {
  const t = useTranslations("Index");
  const mounted = useMounted();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      // Elegant, smooth entrance animation
      gsap.fromTo(
        ".reveal-text",
        { y: 60, opacity: 0, filter: "blur(8px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", stagger: 0.15, duration: 1.4, ease: "power3.out" }
      );
      
      gsap.fromTo(
        ".reveal-fade",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.5, delay: 0.6, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[calc(100vh-64px)] w-full flex-col items-center justify-center overflow-hidden bg-background px-6 selection:bg-foreground selection:text-background"
    >
      <main className="z-10 flex w-full max-w-6xl flex-col items-center justify-center text-center">
        
        {/* Core Typography Stack */}
        <div className="flex flex-col items-center gap-2 sm:gap-4 pointer-events-none">
          <div className="relative">
            <Typography
              type="h1"
              className="reveal-text font-sans text-5xl font-black uppercase tracking-tighter text-foreground sm:text-8xl lg:text-[9rem] xl:text-[11rem] leading-[0.85]"
            >
              {t("title")}
            </Typography>
          </div>

          <div className="relative mt-2 sm:mt-0">
            <Typography
              type="h2"
              className="reveal-text font-serif text-3xl italic tracking-tight text-muted-foreground sm:text-6xl lg:text-7xl xl:text-8xl leading-none"
            >
              {t("subtitle")}
            </Typography>
          </div>
        </div>

        {/* Minimal Quote */}
        <div className="reveal-fade mt-16 sm:mt-24 max-w-2xl pointer-events-none">
          <Typography 
            type="body" 
            className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed tracking-wide text-muted-foreground/60"
          >
            &ldquo;{t("quote")}&rdquo;
          </Typography>
        </div>

      </main>
    </div>
  );
}
