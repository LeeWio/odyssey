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
      <main className="z-10 flex w-full max-w-6xl flex-col items-center justify-center">
        
        {/* Core Typography Stack */}
        <div className="flex flex-col items-start pointer-events-none w-full max-w-fit">
          <div className="relative">
            <Typography
              type="h1"
              className="reveal-text font-sans text-[4rem] font-black uppercase tracking-tight text-foreground sm:text-[7rem] md:text-[9rem] lg:text-[10rem] xl:text-[12rem] leading-[0.9] text-left"
            >
              {t("title")}
            </Typography>
          </div>

          <div className="relative self-end mt-4 sm:mt-6 mr-4 sm:mr-12">
            <Typography
              type="h2"
              className="reveal-text font-serif text-3xl italic tracking-normal text-muted-foreground sm:text-5xl md:text-6xl lg:text-7xl xl:text-[6rem] leading-none"
            >
              {t("subtitle")}
            </Typography>
          </div>
        </div>

        {/* Minimal Quote */}
        <div className="reveal-fade mt-24 sm:mt-32 max-w-3xl pointer-events-none text-center">
          <Typography 
            type="body" 
            className="text-base sm:text-lg md:text-xl font-light leading-relaxed tracking-wide text-muted-foreground/60"
          >
            &ldquo;{t("quote")}&rdquo;
          </Typography>
        </div>

      </main>
    </div>
  );
}
