"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Card,
  Button,
  Avatar,
  Chip,
  ProgressBar,
  Dropdown,
  Label,
  Separator,
  Surface,
  Typography,
  ListBox,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted } from "@mantine/hooks";
import {
  Carousel,
  InlineSelect,
  ItemCard,
  ItemCardGroup,
  PressableFeedback,
} from "@heroui-pro/react";
import {
  ArrowUpRightFromSquare,
  ChevronDown,
  ChevronRight,
  Cloud,
  Globe,
  LogoGithub,
  LogoGitlab,
  LogoSlack,
  Plus,
  Receipt,
} from "@gravity-ui/icons";
import { motion } from "motion/react";

// Premium ease-out curve
const enterEase = [0.23, 1, 0.32, 1] as const;

export function MusicDashboard() {
  const mounted = useMounted();
  const [billing, setBilling] = useState("view");

  if (!mounted) return null;

  return (
    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-12 lg:gap-6">
      
      {/* 1. Left Content Area (Column Span 8) */}
      <div className="col-span-12 flex flex-col gap-5 md:col-span-8 lg:gap-6">
        
        {/* A. Hero Trending Song Banner */}
        <Card className="min-h-[180px] sm:min-h-[220px] flex flex-row items-center justify-between" variant="secondary">
          <div className="flex flex-col items-start max-w-[65%] gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">MUSKINAJA</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
              Listen to trending songs all the time
            </h2>
            <p className="text-xs text-muted leading-relaxed hidden sm:block max-w-sm">
              With Muskinaja, you can get premium music for free anywhere and at any time.
            </p>
            <Button className="mt-2 text-xs" size="sm" variant="primary">
              Explore Now
            </Button>
          </div>

          {/* Banner Hero Image Placeholder (representing the girl with headphones) */}
          <div className="relative size-32 sm:size-40 md:size-44 shrink-0 select-none mr-2 hidden sm:block">
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <Icon icon="solar:headphones-round-bold-duotone" className="size-20 md:size-24 text-accent animate-pulse" />
            </div>
          </div>
        </Card>

        {/* B. Playlists Horizontal Carousel (Fully Unrolled & Loop-free!) */}
        <Surface className="flex flex-col gap-3" variant="transparent">
          <div className="flex items-center justify-between px-1.5">
            <Typography type="h5" align="start" className="tracking-wider" weight="bold">
              Playlists
            </Typography>
            <Button variant="ghost" size="sm">
              See More
            </Button>
          </div>
          <Carousel opts={{ align: "start" }}>
            <Carousel.Content>
              
              {/* Carousel Item 1: Musik Pagi */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    {/* Background Album Art with Hover Zoom */}
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Musik Pagi album art" className="object-cover" src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    {/* Absolute Glass Top-Right Action Button */}
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:music-note-bold" className="size-3.5" />
                    </Button>
                    {/* Floating Glass Capsule Footer */}
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Musik Pagi
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          12 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 2: Lofi Beats */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Lofi Beats album art" className="object-cover" src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:heart-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Lofi Beats
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          24 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 3: Late Night */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Late Night album art" className="object-cover" src="https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:star-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Late Night
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          18 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 4: Deep Focus */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Deep Focus album art" className="object-cover" src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:bookmark-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Deep Focus
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          32 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 5: Active Sweat */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Active Sweat album art" className="object-cover" src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:dumbbell-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Active Sweat
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          15 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 6: Compiling Loop */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Compiling Loop album art" className="object-cover" src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:terminal-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Compiling Loop
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          28 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 7: Silent Zen */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Silent Zen album art" className="object-cover" src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:globus-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Silent Zen
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          20 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

              {/* Carousel Item 8: Acoustic Waves */}
              <Carousel.Item className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="aspect-square relative overflow-hidden select-none cursor-pointer group" variant="default">
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.24, ease: enterEase }}>
                        <Image fill unoptimized alt="Acoustic Waves album art" className="object-cover" src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80" sizes="220px" />
                      </motion.div>
                    </div>
                    <Button isIconOnly size="sm" className="absolute top-2.5 right-2.5 z-10" variant="secondary" aria-label="Playlist options">
                      <Icon icon="solar:soundwave-bold" className="size-3.5" />
                    </Button>
                    <Card.Footer className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <Typography type="body-sm" align="start" className="tracking-wide text-foreground leading-tight truncate" weight="bold">
                          Acoustic Waves
                        </Typography>
                        <Typography type="body-xs" align="start" weight="normal" color="muted" className="mt-0.5 truncate">
                          22 Tracks
                        </Typography>
                      </div>
                      <Button variant="primary" isIconOnly size="sm">
                        <Icon icon="solar:play-bold" className="size-2.5" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              </Carousel.Item>

            </Carousel.Content>
            <Carousel.Previous />
            <Carousel.Next />
          </Carousel>
        </Surface>

        <ItemCardGroup variant="transparent">
          <ItemCardGroup.Header className="mb-1 flex flex-row items-start justify-between px-1.5 pt-0">
            <ItemCardGroup.Title>Trending</ItemCardGroup.Title>
            <Button variant="ghost" size="sm">
              See More
            </Button>
          </ItemCardGroup.Header>
          <ItemCard>
            <ItemCard.Icon>
              <Receipt />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Billing</ItemCard.Title>
              <ItemCard.Description>Payment and invoices</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Tooltip delay={0}>
                <Tooltip.Trigger>
                  <Button isIconOnly aria-label={`Link`} size="sm" variant="secondary">
                    <Icon icon="solar:play-bold" className="size-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>111</Tooltip.Content>
              </Tooltip>
            </ItemCard.Action>
          </ItemCard>
        </ItemCardGroup>
      </div>

      {/* 2. Right Sidebar Area (Column Span 4) */}
      <div className="col-span-12 flex flex-col gap-5 md:col-span-4 lg:gap-6">
        <ItemCardGroup className="overflow-hidden" variant="transparent">
          <ItemCardGroup.Header className="mb-1 flex flex-row items-start justify-start px-1.5 pt-0">
            <ItemCardGroup.Title>Top Artist</ItemCardGroup.Title>
          </ItemCardGroup.Header>
          <ItemCardGroup className="overflow-hidden">
            <ItemCard>
              <ItemCard.Icon>
                <LogoGithub />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>GitHub</ItemCard.Title>
                <ItemCard.Description className="max-w-xs">
                  Connected as @jrgarciadev to repositori
                </ItemCard.Description>
              </ItemCard.Content>
            </ItemCard>
            <Separator />
            <ItemCard>
              <ItemCard.Icon>
                <LogoGitlab />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>GitLab</ItemCard.Title>
                <ItemCard.Description className="max-w-xs">
                  Connect GitLab for Cloud Agents,
                </ItemCard.Description>
              </ItemCard.Content>
            </ItemCard>
          </ItemCardGroup>
        </ItemCardGroup>

        <Card className="flex flex-col gap-4 text-white" variant="secondary">
          {/* Mock Track Cover Image with absolute overlay gradient */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner">
            <Icon
              icon="solar:music-note-bold-duotone"
              className="size-16 animate-pulse text-white/20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Title & Artist info */}
          <div className="flex flex-col items-center px-1 text-center">
            <h4 className="text-sm leading-tight font-bold text-white">Balonku Ada 5 Meter</h4>
            <span className="mt-1 text-[10px] text-white/70">Mamank</span>
          </div>

          {/* Active Soundwave Equalizer Placeholder */}
          <div className="pointer-events-none my-1 flex h-8 items-end justify-center gap-1 px-4 select-none">
            {/* 12 small bounding bars that bounce */}
            <div className="h-4 w-1 animate-pulse rounded-full bg-white/70" />
            <div className="h-6 w-1 animate-pulse rounded-full bg-white/40" />
            <div className="h-2 w-1 animate-pulse rounded-full bg-white/80" />
            <div className="h-5 w-1 animate-pulse rounded-full bg-white/50" />
            <div className="h-3 w-1 animate-pulse rounded-full bg-white/90" />
            <div className="h-7 w-1 animate-pulse rounded-full bg-white/30" />
            <div className="h-4 w-1 animate-pulse rounded-full bg-white/60" />
            <div className="h-6 w-1 animate-pulse rounded-full bg-white/80" />
            <div className="h-2 w-1 animate-pulse rounded-full bg-white/45" />
            <div className="h-5 w-1 animate-pulse rounded-full bg-white/70" />
            <div className="h-3 w-1 animate-pulse rounded-full bg-white/30" />
            <div className="h-4 w-1 animate-pulse rounded-full bg-white/50" />
          </div>

          {/* Timeline slider and times */}
          <div className="flex w-full flex-col gap-1.5">
            <ProgressBar
              aria-label="Mock player play progress"
              value={36}
              size="sm"
              color="success"
              className="w-full rounded-full"
            />
            <div className="mt-0.5 flex items-center justify-between font-mono text-[9px] text-white/60">
              <span>1:20</span>
              <span>3:30</span>
            </div>
          </div>

          {/* Audio Console Control buttons (Loop, Prev, Play, Next, Shuffle) */}
          <div className="mt-1 flex items-center justify-between px-2">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-8 rounded-full border-none text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Icon icon="solar:repeat-bold" className="size-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-8 rounded-full border-none text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Icon icon="solar:skip-backward-bold" className="size-4" />
            </Button>
            {/* Play Button - White solid circle */}
            <Button
              isIconOnly
              size="md"
              className="size-9 rounded-full bg-white text-indigo-950 shadow-sm transition-transform hover:scale-105"
            >
              <Icon icon="solar:pause-bold" className="size-4 text-indigo-950" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-8 rounded-full border-none text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Icon icon="solar:skip-forward-bold" className="size-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-8 rounded-full border-none text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Icon icon="solar:shuffle-bold" className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
