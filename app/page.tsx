"use client";

import { Chip, Typography, Button } from "@heroui/react";
import { useMounted } from "@/hooks/use-mounted";
import { useRealTime } from "@/hooks/use-real-time";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function Home() {
  const mounted = useMounted();
  const { formattedDate, hours, minutes } = useRealTime();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!mounted) return;

      gsap.to(".music-disk", {
        rotation: 360,
        duration: 15,
        repeat: -1,
        ease: "none",
      });

      gsap.fromTo(
        ".hero-text",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }
      );

      gsap.fromTo(
        ".hero-panel",
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2 }
      );
    },
    { scope: containerRef, dependencies: [mounted] }
  );

  if (!mounted) return null;

  return (
    <main
      ref={containerRef}
      className="bg-background relative flex min-h-[calc(100vh-64px)] w-full flex-col overflow-x-hidden"
    >
      {/* Subtle global background glow */}
      <div className="from-foreground/5 pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

      {/* Top Section: Typography and CTAs */}
      <section className="z-10 flex w-full flex-1 flex-col items-center justify-center px-6 pt-20 pb-12 text-center lg:pt-32 lg:pb-16">
        <div className="hero-text mb-8 opacity-0">
          <Chip
            color="default"
            variant="soft"
            size="lg"
            className="border-border/40 bg-surface/50 gap-2 border px-3 backdrop-blur-md"
          >
            <div className="bg-foreground size-2 animate-pulse rounded-full" />
            <Chip.Label className="text-xs font-medium tracking-widest uppercase sm:text-sm">
              Design Philosophy
            </Chip.Label>
          </Chip>
        </div>

        <div className="hero-text w-full px-4 opacity-0">
          <Typography
            type="h1"
            className="text-6xl leading-[1.05] font-black tracking-tighter sm:text-7xl lg:text-8xl xl:text-[8.5rem]"
          >
            Don't just do it, <br />
            <span className="text-muted/70">do it well.</span>
          </Typography>
        </div>

        <div className="hero-text mt-8 w-full max-w-3xl px-4 opacity-0">
          <Typography
            type="body"
            color="muted"
            className="text-lg leading-relaxed font-medium text-balance sm:text-xl lg:text-2xl"
          >
            A commitment to excellence over speed. We build interfaces that are not only functional,
            but inherently beautiful, accessible, and responsive.
          </Typography>
        </div>

        <div className="hero-text mt-12 flex flex-wrap items-center justify-center gap-4 opacity-0">
          <Button
            size="lg"
            className="shadow-foreground/10 h-14 rounded-full px-10 text-base font-semibold shadow-lg"
          >
            Start Building
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="border-border/50 bg-surface/50 hover:bg-surface h-14 rounded-full border px-10 text-base font-semibold shadow-sm backdrop-blur-sm"
          >
            Read the Manifesto
          </Button>
        </div>
      </section>

      {/* Bottom Section: Panoramic Showcase Panel */}
      <section className="z-10 w-full shrink-0 px-4 pb-4 md:px-8 md:pb-8">
        <div className="hero-panel bg-surface-secondary/20 border-border/50 relative flex w-full flex-col items-center justify-between gap-12 overflow-hidden rounded-[2.5rem] border p-8 opacity-0 shadow-2xl backdrop-blur-2xl sm:rounded-[3rem] md:p-12 lg:p-16 xl:flex-row">
          {/* Subtle inner gradient for the panel */}
          <div className="from-background/20 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent" />

          {/* Left: The Art of Polish */}
          <div className="z-10 flex w-full flex-1 flex-col items-center gap-4 text-center xl:items-start xl:text-left">
            <Typography type="h3" className="text-3xl font-bold tracking-tight sm:text-4xl">
              The Art of Polish
            </Typography>
            <Typography
              type="body"
              color="muted"
              className="max-w-md text-base leading-relaxed text-balance sm:text-lg"
            >
              Details matter. It's the small, barely noticeable interactions that turn a good
              product into a great one.
            </Typography>
          </div>

          {/* Center: Spinning Disk */}
          <div className="z-10 shrink-0">
            <div className="music-disk ring-border/50 bg-muted relative size-48 overflow-hidden rounded-full shadow-[0_0_40px_rgba(0,0,0,0.1)] ring-1 sm:size-56 lg:size-64">
              <img
                alt="Vinyl Record Art"
                className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover select-none"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/cherries.jpeg"
              />
              <div className="bg-background/95 border-border/30 absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full border shadow-inner backdrop-blur-md sm:size-16">
                <div className="bg-foreground/30 size-3 rounded-full sm:size-4" />
              </div>
            </div>
          </div>

          {/* Right: Local Time */}
          <div className="z-10 flex w-full flex-1 flex-col items-center gap-2 text-center xl:items-end xl:text-right">
            <span className="text-muted text-xs font-bold tracking-[0.2em] uppercase sm:text-sm">
              Local Time
            </span>
            <div className="text-6xl leading-none font-black tracking-tighter tabular-nums sm:text-7xl lg:text-8xl">
              {hours}:{minutes}
            </div>
            <span className="text-muted-foreground mt-2 text-lg font-medium sm:text-xl">
              {formattedDate}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
