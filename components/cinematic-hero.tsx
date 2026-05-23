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
      <main className="z-10 flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Core Typography Stack */}
        <div className="flex flex-col items-center pointer-events-none w-full">
          <Typography
            type="h1"
            className="reveal-text font-sans text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] xl:text-[9.5rem] font-black uppercase tracking-tighter text-foreground leading-[0.85] w-full text-center"
          >
            {t("title")}
          </Typography>

          <Typography
            type="h2"
            className="reveal-text mt-6 sm:mt-10 font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] italic tracking-tight text-muted-foreground leading-none text-center"
          >
            {t("subtitle")}
          </Typography>
        </div>

        {/* Minimal Quote */}
        <div className="reveal-fade mt-20 sm:mt-28 max-w-2xl pointer-events-none">
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
