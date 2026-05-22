"use client";

import { Typography, Chip, Kbd } from "@heroui/react";
import { PressableFeedback } from "@heroui-pro/react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useMounted } from "@/hooks/use-mounted";
import { Sparkles } from "@gravity-ui/icons";
import { useTranslations } from "next-intl";

export function CinematicHero() {
  const t = useTranslations("Index");
  const mounted = useMounted();

  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      // Entrance animation for content
      gsap.fromTo(
        ".reveal-up",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: "power3.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[calc(100vh-64px)] w-full flex-col items-center justify-center overflow-hidden bg-background selection:bg-accent selection:text-accent-foreground"
    >
      <main className="container mx-auto flex h-full items-center justify-center px-6">
        <div
          ref={mainContentRef}
          className="relative z-10 flex w-full max-w-5xl flex-col items-center"
        >
          {/* Top Label */}
          <div className="reveal-up mb-10 flex items-center gap-3">
            <Chip
              variant="soft"
              color="accent"
              size="sm"
              className="font-mono uppercase tracking-widest"
            >
              <Sparkles className="size-3" />
              <Chip.Label>Est. 2026</Chip.Label>
            </Chip>
            <div className="h-px w-12 bg-border/60" />
            <Typography type="body-xs" className="font-mono uppercase text-muted-foreground">
              Whobee.v1
            </Typography>
          </div>

          {/* Master Typography Stack */}
          <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
            <div className="reveal-up relative">
              <Typography
                type="h1"
                className="font-mono text-4xl font-bold uppercase tracking-widest text-muted-foreground/40 sm:text-6xl lg:text-7xl"
              >
                {t("title")}
              </Typography>
            </div>

            <div className="reveal-up group relative pointer-events-auto">
              <PressableFeedback className="inline-block border-none bg-transparent p-0">
                <PressableFeedback.Highlight className="rounded-full bg-accent/10" />
                <Typography
                  type="h1"
                  weight="bold"
                  className="text-foreground text-6xl leading-none tracking-tight sm:text-8xl lg:text-9xl"
                >
                  <span className="font-serif italic">{t("subtitle")}</span>
                </Typography>
              </PressableFeedback>

              <div className="absolute -right-12 -top-4 hidden duration-500 hover:rotate-6 sm:-right-24 sm:-top-8 sm:block sm:rotate-12 transition-transform">
                <Kbd className="bg-accent text-accent-foreground border-none px-4 py-1 text-sm font-black uppercase italic shadow-2xl">
                  Mastery
                </Kbd>
              </div>
            </div>
          </div>

          {/* Description & Quote */}
          <div className="reveal-up pointer-events-none mt-16 max-w-lg text-center">
            <Typography type="body" className="text-muted-foreground text-lg leading-relaxed">
              &ldquo;{t("quote")}&rdquo;
            </Typography>
          </div>

        </div>
      </main>

      {/* Decorative Technical Edge Indicators - Kept very subtle */}
      <div className="pointer-events-none absolute left-10 top-1/2 hidden -translate-y-1/2 flex-col gap-2 opacity-10 lg:flex">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-foreground h-0.5 w-4" />
        ))}
      </div>
      <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2 opacity-10 lg:flex">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-accent h-0.5 w-8" />
        ))}
      </div>
    </div>
  );
}