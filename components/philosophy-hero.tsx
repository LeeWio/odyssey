"use client";

import { Resizable } from "@heroui-pro/react";
import { Typography, Chip } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMounted } from "@/hooks/use-mounted";
import { Sparkles } from "@gravity-ui/icons";

export function PhilosophyHero() {
  const mounted = useMounted();
  const [sizes, setSizes] = useState([30, 70]);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.5 } });

      tl.fromTo(
        [leftTextRef.current, rightTextRef.current],
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  if (!mounted) return null;

  const qualityRatio = sizes[1] / 100; // 0 to 1

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-64px)] w-full overflow-hidden border-t border-border/40"
    >
      <Resizable orientation="horizontal" onLayout={(newSizes) => setSizes(newSizes)}>
        {/* Left Panel: "don't just do it" */}
        <Resizable.Panel defaultSize={30} minSize={10} maxSize={50}>
          <div
            className="flex h-full flex-col items-center justify-center p-8 bg-background relative transition-colors duration-500"
            style={{
              opacity: 0.4 + (1 - qualityRatio) * 0.6,
              filter: `grayscale(${qualityRatio * 100}%)`,
            }}
          >
            <div className="absolute top-8 left-8">
              <Typography type="body-xs" className="uppercase tracking-[0.2em] opacity-50">
                Perspective I
              </Typography>
            </div>

            <div ref={leftTextRef} className="text-center">
              <Typography
                type="h1"
                weight="bold"
                className="text-4xl sm:text-6xl lg:text-7xl tracking-tighter"
              >
                don&apos;t just
                <br />
                do it
              </Typography>
              <Typography type="body-sm" color="muted" className="mt-4 max-w-[200px] mx-auto">
                Execution without intent is just noise.
              </Typography>
            </div>
          </div>
        </Resizable.Panel>

        <Resizable.Handle withIndicator type="pill" variant="primary" />

        {/* Right Panel: "do it well" */}
        <Resizable.Panel defaultSize={70}>
          <div
            className="flex h-full flex-col items-center justify-center p-8 bg-surface relative overflow-hidden transition-all duration-700"
            style={{
              backgroundColor: `oklch(from var(--color-surface) l c h / ${0.5 + qualityRatio * 0.5})`,
            }}
          >
            {/* Dynamic Background Glow */}
            <div
              className="absolute inset-0 -z-10 opacity-30 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(circle at center, var(--color-accent-soft) 0%, transparent 70%)`,
                transform: `scale(${0.5 + qualityRatio})`,
                opacity: qualityRatio * 0.4,
              }}
            />

            <div className="absolute top-8 right-8">
              <Chip variant="soft" color="accent" size="sm">
                <Sparkles className="size-3" />
                The Core Belief
              </Chip>
            </div>

            <div ref={rightTextRef} className="text-center">
              <Typography
                type="h1"
                weight="bold"
                className="text-5xl sm:text-7xl lg:text-9xl tracking-tighter italic font-serif text-accent"
                style={{
                  textShadow:
                    qualityRatio > 0.6
                      ? `0 0 ${qualityRatio * 20}px var(--color-accent-soft)`
                      : "none",
                }}
              >
                do it well
              </Typography>
              <Typography
                type="h1"
                render={(props) => (
                  <span
                    {...props}
                    className="block mt-4 text-lg sm:text-xl text-foreground/80 font-medium"
                  />
                )}
              >
                Excellence is not an act, but a habit.
              </Typography>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              <Typography type="body-xs" className="uppercase tracking-[0.3em]">
                Quality Focus
              </Typography>
              <div className="h-12 w-px bg-foreground/20" />
            </div>
          </div>
        </Resizable.Panel>
      </Resizable>
    </div>
  );
}
