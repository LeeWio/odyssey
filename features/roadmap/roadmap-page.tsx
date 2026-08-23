"use client";

import { motion } from "motion/react";
import { Card, Chip, Typography } from "@heroui/react";
import { Timeline, TrendChip } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

const easeOut = [0.22, 1, 0.36, 1] as const;

const roadmapEvents = [
  {
    time: "Q1 2027",
    title: "Spatial AR/VR Portals",
    status: "muted" as const,
    tag: "Future Vision",
    tagColor: "default" as const,
    icon: "gravity-ui:compass",
    description:
      "Architecting immersive spatial galleries for modular synthesizers and analog photography, projecting our physical equipment into vision-OS style web containers.",
    metrics: { label: "Spatial scale", value: "3D rooms" },
  },
  {
    time: "Q4 2026",
    title: "High-Fidelity AI Copilot & 3D Celestial Universe",
    status: "current" as const,
    tag: "Active Rollout",
    tagColor: "accent" as const,
    icon: "gravity-ui:sparkles",
    trend: { value: "+42%", direction: "up" as const, label: "Engagement" },
    description:
      "Assembled the R3F 3D spatial orbit universe with local space dust, article satellites, and camera directors. Launched the Copilot Assistant page powered by HeroUI Pro AI components.",
    metrics: { label: "R3F Post-processing", value: "Bloom & Vignette" },
  },
  {
    time: "Q3 2026",
    title: "Audio Streaming Resolver",
    status: "success" as const,
    tag: "Shipped",
    tagColor: "success" as const,
    icon: "gravity-ui:music-note",
    description:
      "Constructed the high-performance vae-song-stream URL proxy utilizing secure CDN rewrites and 302 HTTP redirections, linked to the global floating MiniPlayer.",
    metrics: { label: "Redirect latency", value: "<15ms" },
  },
  {
    time: "Q2 2026",
    title: "Administrative Shell Overlay",
    status: "success" as const,
    tag: "Shipped",
    tagColor: "success" as const,
    icon: "gravity-ui:lock",
    trend: { value: "100%", direction: "up" as const, label: "RBAC Controls" },
    description:
      "Integrated the unified sheet-panel dashboard for posts, moments, user profiles, and granular role-based permissions management.",
    metrics: { label: "Data Integrity", value: "Zod Schema Verified" },
  },
  {
    time: "Q1 2026",
    title: "Next.js 16 Refactor & HeroUI v3 Integration",
    status: "success" as const,
    tag: "Shipped",
    tagColor: "success" as const,
    icon: "gravity-ui:thunderbolt",
    trend: { value: "-35%", direction: "down" as const, label: "Lighthouse TTFB" },
    description:
      "Completed the core architectural refactor to Next.js 16 with Turbopack compiling, migrating components to HeroUI React components for AAA accessibility.",
    metrics: { label: "Bundled savings", value: "128 KB" },
  },
] as const;

export function RoadmapPage() {
  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="border-default-200/50 mb-16 flex flex-col items-center border-b pb-10 text-center"
        >
          <Chip color="accent" size="sm" variant="soft">
            Platform Progress
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-5 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Odyssey Roadmap
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            Exploring the chronological evolution, shipped architectures, and future milestones of
            the Odyssey personal product.
          </Typography>
        </motion.header>

        {/* Timeline container */}
        <div className="mt-10">
          <Timeline density="comfortable" size="md">
            {roadmapEvents.map((event) => {
              return (
                <Timeline.Item key={event.title} status={event.status}>
                  <Timeline.Marker aria-hidden="true" className="p-1">
                    <Icon icon={event.icon} className="size-4" />
                  </Timeline.Marker>
                  <Timeline.Content className="gap-4 pb-12">
                    <div className="flex flex-col gap-3">
                      {/* Meta Row: Time & Chip Tags */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <time className="text-foreground text-sm leading-5 font-bold">
                            {event.time}
                          </time>
                          <Chip color={event.tagColor} size="sm" variant="soft">
                            {event.tag}
                          </Chip>
                        </div>

                        {/* Trend Chip for Metrics */}
                        {"trend" in event && event.trend ? (
                          <TrendChip trend={event.trend.direction} size="sm" variant="soft">
                            {event.trend.value}
                            <TrendChip.Suffix className="ml-1 text-[10px]">
                              {event.trend.label}
                            </TrendChip.Suffix>
                          </TrendChip>
                        ) : null}
                      </div>

                      {/* Card Content block */}
                      <Card
                        variant="secondary"
                        className="border-default-200/50 bg-surface-secondary/20 rounded-2xl border p-5 shadow-sm md:p-6"
                      >
                        <Typography type="h4" weight="bold">
                          {event.title}
                        </Typography>
                        <Typography color="muted" type="body-sm" className="mt-3 leading-relaxed">
                          {event.description}
                        </Typography>

                        {/* Sibling telemetry metrics row */}
                        <div className="border-default-100 text-muted/60 mt-5 flex items-center justify-between border-t pt-4 text-xs font-medium">
                          <span>{event.metrics.label}</span>
                          <span className="text-foreground font-semibold">
                            {event.metrics.value}
                          </span>
                        </div>
                      </Card>
                    </div>
                  </Timeline.Content>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </div>
      </div>
    </div>
  );
}
