"use client";

import { Typography, Chip, Kbd } from "@heroui/react";
import { FloatingToc, PressableFeedback, NumberValue } from "@heroui-pro/react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMounted } from "@/hooks/use-mounted";
import { Sparkles, CircleCheck, Thunderbolt, Heart, Target } from "@gravity-ui/icons";
import { useTranslations } from "next-intl";
import { InteractiveRobotSpline } from "./ui/interactive-3d-robot";

export function CinematicHero() {
  const t = useTranslations("Index");
  const mounted = useMounted();
  const [activeId, setActiveId] = useState("intent");

  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  const philosophyItems = [
    { id: "intent", icon: <Target />, value: 100, unit: "%" },
    { id: "precision", icon: <Thunderbolt />, value: 1540, unit: "cycles" },
    { id: "integrity", icon: <CircleCheck />, value: 365, unit: "days" },
    { id: "legacy", icon: <Heart />, value: 10, unit: "years" },
  ];

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
      className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-background selection:bg-accent selection:text-accent-foreground"
    >
      {/* 1. Interactive 3D Robot Background */}
      <div className="absolute inset-0 z-0">
        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="h-full w-full opacity-60 transition-opacity duration-1000 group-hover:opacity-100"
        />
        {/* Overlay gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-80" />
      </div>

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
              className="font-mono tracking-widest uppercase"
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
          <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
            <div className="reveal-up relative">
              <Typography
                type="h1"
                className="text-4xl font-bold tracking-widest text-muted-foreground/40 sm:text-6xl lg:text-7xl font-mono uppercase"
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
                  className="text-6xl tracking-tight sm:text-8xl lg:text-9xl leading-none text-foreground"
                >
                  <span className="italic font-serif">{t("subtitle")}</span>
                </Typography>
              </PressableFeedback>

              <div className="absolute -right-12 -top-4 sm:-right-24 sm:-top-8 hidden sm:block rotate-12 transition-transform group-hover:rotate-6 duration-500">
                <Kbd className="bg-accent text-accent-foreground border-none shadow-2xl px-4 py-1 font-black text-sm uppercase italic">
                  Mastery
                </Kbd>
              </div>
            </div>
          </div>

          {/* Description & Quote */}
          <div className="reveal-up mt-16 max-w-lg text-center pointer-events-none">
            <Typography type="body" className="text-lg text-muted-foreground leading-relaxed">
              &ldquo;{t("quote")}&rdquo;
            </Typography>
          </div>

          {/* Interactive TOC Controls */}
          <div className="reveal-up mt-16 flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-4">
              <FloatingToc placement="right">
                <FloatingToc.Trigger aria-label="Philosophy Console">
                  {philosophyItems.map((item) => (
                    <FloatingToc.Bar key={item.id} active={item.id === activeId} />
                  ))}
                </FloatingToc.Trigger>
                <FloatingToc.Content className="w-72 border-border/50 bg-surface/90 backdrop-blur-xl">
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-center justify-between">
                      <Typography type="body-xs" className="uppercase font-bold text-accent">
                        {t(`philosophy.${activeId}.metric`)}
                      </Typography>
                      <NumberValue
                        value={philosophyItems.find((i) => i.id === activeId)?.value || 0}
                        className="font-mono text-lg"
                      />
                    </div>
                    <div className="h-px bg-border/40" />
                    {philosophyItems.map((item) => (
                      <FloatingToc.Item
                        key={item.id}
                        active={item.id === activeId}
                        onClick={() => setActiveId(item.id)}
                        className="flex items-center gap-3 py-1"
                      >
                        <span
                          className={item.id === activeId ? "text-accent" : "text-muted-foreground"}
                        >
                          {item.icon}
                        </span>
                        <span className="text-sm font-semibold">
                          {t(`philosophy.${item.id}.title`)}
                        </span>
                      </FloatingToc.Item>
                    ))}
                  </div>
                </FloatingToc.Content>
              </FloatingToc>
              <Typography
                type="body-xs"
                className="font-mono uppercase tracking-widest text-muted-foreground"
              >
                Adjust Vision
              </Typography>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Technical Edge Indicators */}
      <div className="absolute left-10 top-1/2 hidden -translate-y-1/2 flex-col gap-2 opacity-20 lg:flex pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-0.5 w-4 bg-foreground" />
        ))}
      </div>
      <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col gap-2 opacity-20 lg:flex items-end pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-0.5 w-8 bg-accent" />
        ))}
      </div>
    </div>
  );
}
