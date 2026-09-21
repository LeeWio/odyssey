"use client";

import { Button, Card, Chip, Description, Label, ListBox, ProgressBar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Image from "next/image";

import { contentEntrance, enterEase } from "./motion";
import type { MegaPanelContentProps } from "./types";

export function MegaPanelContent({ id, onNavigate, reduceMotion }: MegaPanelContentProps) {
  const reveal = (index: number) => ({
    variants: reduceMotion ? undefined : contentEntrance,
    initial: reduceMotion ? false : "hidden",
    animate: "visible",
    custom: index,
  });

  if (id === "chronicle") {
    return (
      <div className="grid gap-4 md:col-span-8 md:grid-cols-5">
        <motion.div {...reveal(0)} className="md:col-span-3">
          <Card className="group h-full" variant="secondary">
            <div className="relative min-h-52 flex-1 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute inset-0"
                whileHover={reduceMotion ? undefined : { scale: 1.025 }}
                transition={{ duration: 0.2, ease: enterEase }}
              >
                <Image
                  fill
                  alt="Notebook and pencil on a quiet writing desk"
                  className="object-cover"
                  sizes="(max-width: 767px) 90vw, 38vw"
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=86"
                />
              </motion.div>
            </div>
            <Card.Header>
              <Card.Title className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                Symbiosis: The Resilience of Outposts
              </Card.Title>
              <Card.Description>
                A study on design components that withstand edge cases and browser divergence.
              </Card.Description>
            </Card.Header>
            <Card.Content />
            <Card.Footer>
              <Chip size="sm" color="accent" variant="soft">
                Featured essay
              </Chip>
              <Button size="sm" variant="ghost" onPress={() => onNavigate("/chronicle")}>
                Read story
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>
        <motion.div {...reveal(1)} className="md:col-span-2">
          <Card className="h-full" variant="transparent">
            <Card.Header>
              <Card.Title>Latest notes</Card.Title>
              <Card.Description>Recent additions to the writing archive.</Card.Description>
            </Card.Header>
            <Card.Content>
              <ListBox
                aria-label="Latest Chronicle notes"
                selectionMode="none"
                onAction={() => {
                  onNavigate("/chronicle");
                }}
              >
                <ListBox.Item id="systems" textValue="Designing for the second draft">
                  <Label>Designing for the second draft</Label>
                  <Description>Design systems · 6 min read</Description>
                </ListBox.Item>
                <ListBox.Item id="motion" textValue="Motion that explains itself">
                  <Label>Motion that explains itself</Label>
                  <Description>Interaction · 4 min read</Description>
                </ListBox.Item>
                <ListBox.Item id="access" textValue="The quiet work of accessibility">
                  <Label>The quiet work of accessibility</Label>
                  <Description>Engineering · 8 min read</Description>
                </ListBox.Item>
                <ListBox.Item id="columns" textValue="Browse columns">
                  <Label>Browse columns</Label>
                  <Description>Focused reading paths</Description>
                </ListBox.Item>
                <ListBox.Item id="explore" textValue="Explore by topic">
                  <Label>Explore by topic</Label>
                  <Description>Tags and subjects across the archive</Description>
                </ListBox.Item>
              </ListBox>
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Active, energetic "Orbit" 4-quadrant system: Soul Soothe, Patience & Wait, Sweat It Out, Code & Build
  if (id === "daily") {
    return (
      <div className="grid gap-4 md:col-span-8 md:grid-cols-2">
        {/* Pillar 1: Soul Soothe (听歌) */}
        <motion.div {...reveal(0)}>
          <Card
            className="group relative flex h-full flex-col justify-between overflow-hidden"
            variant="default"
          >
            <Card.Header className="flex flex-row items-start justify-between pb-2">
              <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:music" className="size-5" />
              </div>
              <div className="bg-background/50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-muted tracking-wide">Now playing</span>
              </div>
            </Card.Header>
            <Card.Content className="pt-2">
              <Card.Title className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                Soul Soothe
              </Card.Title>
              <Card.Description className="mt-1 text-xs leading-5">
                Ambient works & analog vinyl rooms compiled for focused flow.
              </Card.Description>
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="text-muted flex items-center justify-between text-[10px] font-medium">
                  <span>Track: In Ambient Rooms</span>
                  <span>65% completed</span>
                </div>
                <ProgressBar
                  aria-label="Soul Soothe track duration progress"
                  value={65}
                  size="sm"
                  color="success"
                />
              </div>
            </Card.Content>
            <Card.Footer className="border-default/30 mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-muted flex items-center gap-1.5 text-[11px] font-medium tracking-tight">
                <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
                An Ending (Ascent)
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-7 rounded-lg transition-transform duration-200 group-hover:translate-x-0.5"
                aria-label="Open Soul Soothe"
                onPress={() => onNavigate("/persona")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-3.5" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Pillar 2: Patience & Wait (炒股) */}
        <motion.div {...reveal(1)}>
          <Card
            className="group relative flex h-full flex-col justify-between overflow-hidden"
            variant="default"
          >
            <Card.Header className="flex flex-row items-start justify-between pb-2">
              <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:trending-up" className="size-5" />
              </div>
              <div className="bg-background/50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                </span>
                <span className="text-muted tracking-wide">Market closed</span>
              </div>
            </Card.Header>
            <Card.Content className="pt-2">
              <Card.Title className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                Patience & Wait
              </Card.Title>
              <Card.Description className="mt-1 text-xs leading-5">
                Macro-theses, asset allocations, and financial decision logs.
              </Card.Description>
              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="bg-default/40 border-default/20 flex flex-col rounded-md border px-2 py-1.5">
                  <span className="text-muted text-[8px] font-semibold">NASDAQ</span>
                  <span className="mt-0.5 font-semibold text-emerald-500">18,245.2</span>
                </div>
                <div className="bg-default/40 border-default/20 flex flex-col rounded-md border px-2 py-1.5">
                  <span className="text-muted text-[8px] font-semibold">AAPL</span>
                  <span className="mt-0.5 font-semibold text-emerald-500">$184.22</span>
                </div>
                <div className="bg-default/40 border-default/20 flex flex-col rounded-md border px-2 py-1.5">
                  <span className="text-muted text-[8px] font-semibold">NVDA</span>
                  <span className="mt-0.5 font-semibold text-emerald-500">$128.50</span>
                </div>
              </div>
            </Card.Content>
            <Card.Footer className="border-default/30 mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-muted flex items-center gap-1.5 text-[11px] font-medium tracking-tight">
                <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
                Long posture active
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-7 rounded-lg transition-transform duration-200 group-hover:translate-x-0.5"
                aria-label="Open Patience & Wait"
                onPress={() => onNavigate("/persona")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-3.5" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Pillar 3: Sweat It Out (健身) */}
        <motion.div {...reveal(2)}>
          <Card
            className="group relative flex h-full flex-col justify-between overflow-hidden"
            variant="default"
          >
            <Card.Header className="flex flex-row items-start justify-between pb-2">
              <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:dumbbell" className="size-5" />
              </div>
              <div className="bg-background/50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                </span>
                <span className="text-muted tracking-wide">Calibrating</span>
              </div>
            </Card.Header>
            <Card.Content className="pt-2">
              <Card.Title className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                Sweat It Out
              </Card.Title>
              <Card.Description className="mt-1 text-xs leading-5">
                Biomechanical sets, power tracking, and active recovery logs.
              </Card.Description>
              <div className="bg-default/30 border-default/20 mt-4 flex items-center justify-between gap-1 rounded-xl border px-3.5 py-2">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">M</span>
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <Icon icon="lucide:check" className="size-2.5" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">T</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">W</span>
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <Icon icon="lucide:check" className="size-2.5" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">T</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">F</span>
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <Icon icon="lucide:check" className="size-2.5" />
                  </div>
                </div>
                <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                  <Icon icon="lucide:check" className="size-2.5" />
                </div>
                <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                  <span className="text-[10px] font-bold">·</span>
                </div>
              </div>
            </Card.Content>
            <Card.Footer className="border-default/30 mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-muted flex items-center gap-1.5 text-[11px] font-medium tracking-tight">
                <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
                Cold plunge recovery
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-7 rounded-lg transition-transform duration-200 group-hover:translate-x-0.5"
                aria-label="Open Sweat It Out"
                onPress={() => onNavigate("/persona")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-3.5" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Pillar 4: Code & Build (编程) */}
        <motion.div {...reveal(3)}>
          <Card
            className="group relative flex h-full flex-col justify-between overflow-hidden"
            variant="default"
          >
            <Card.Header className="flex flex-row items-start justify-between pb-2">
              <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:terminal" className="size-5" />
              </div>
              <div className="bg-background/50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                </span>
                <span className="text-muted tracking-wide">Compiling</span>
              </div>
            </Card.Header>
            <Card.Content className="pt-2">
              <Card.Title className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                Code & Build
              </Card.Title>
              <Card.Description className="mt-1 text-xs leading-5">
                Translating abstract logic into functional, accessible systems.
              </Card.Description>
              <div className="border-default/20 mt-4 rounded-xl border bg-zinc-950/90 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-400 shadow-inner dark:bg-black/40">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-500">✓</span>
                  <span className="font-semibold text-zinc-200">compile successful</span>
                </div>
                <div className="mt-0.5 text-[9px] text-zinc-500">
                  Compiled in 42ms · 165 modules
                </div>
              </div>
            </Card.Content>
            <Card.Footer className="border-default/30 mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-muted flex items-center gap-1.5 text-[11px] font-medium tracking-tight">
                <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
                Next.js hydration audits
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-7 rounded-lg transition-transform duration-200 group-hover:translate-x-0.5"
                aria-label="Open Code & Build"
                onPress={() => onNavigate("/persona")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-3.5" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (id === "travelogue") {
    return (
      <div className="grid gap-4 md:col-span-8 md:grid-cols-3">
        {/* Place 1: Iceland */}
        <motion.div {...reveal(0)}>
          <Card className="group h-full p-0" role="article">
            <div className="relative min-h-48 flex-1 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute inset-0"
                whileHover={reduceMotion ? undefined : { scale: 1.025 }}
                transition={{ duration: 0.2, ease: enterEase }}
              >
                <Image
                  fill
                  alt="Iceland travel study"
                  className="object-cover"
                  sizes="(max-width: 767px) 90vw, 25vw"
                  src="https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=800&q=86"
                />
              </motion.div>
            </div>
            <Card.Header className="p-4 pt-3">
              <Card.Title className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                North Atlantic Studies
              </Card.Title>
              <Card.Description>Iceland · 64°08′N</Card.Description>
            </Card.Header>
          </Card>
        </motion.div>

        {/* Place 2: Copenhagen */}
        <motion.div {...reveal(1)}>
          <Card className="group h-full p-0" role="article">
            <div className="relative min-h-48 flex-1 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute inset-0"
                whileHover={reduceMotion ? undefined : { scale: 1.025 }}
                transition={{ duration: 0.2, ease: enterEase }}
              >
                <Image
                  fill
                  alt="Copenhagen travel study"
                  className="object-cover"
                  sizes="(max-width: 767px) 90vw, 25vw"
                  src="https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=86"
                />
              </motion.div>
            </div>
            <Card.Header className="p-4 pt-3">
              <Card.Title className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                Nordic Geometry
              </Card.Title>
              <Card.Description>Copenhagen · 55°40′N</Card.Description>
            </Card.Header>
          </Card>
        </motion.div>

        {/* Place 3: Kyoto */}
        <motion.div {...reveal(2)}>
          <Card className="group h-full p-0" role="article">
            <div className="relative min-h-48 flex-1 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute inset-0"
                whileHover={reduceMotion ? undefined : { scale: 1.025 }}
                transition={{ duration: 0.2, ease: enterEase }}
              >
                <Image
                  fill
                  alt="Kyoto travel study"
                  className="object-cover"
                  sizes="(max-width: 767px) 90vw, 25vw"
                  src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=86"
                />
              </motion.div>
            </div>
            <Card.Header className="p-4 pt-3">
              <Card.Title className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                Silent Afternoons
              </Card.Title>
              <Card.Description>Kyoto · 35°01′N</Card.Description>
            </Card.Header>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (id === "more") {
    return (
      <div className="grid gap-4 md:col-span-8 md:grid-cols-4">
        {/* Moments */}
        <motion.div {...reveal(0)}>
          <Card className="group h-full" variant="tertiary">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:notebook-pen" className="size-5" />
              </div>
              <Card.Title>Moments</Card.Title>
              <Card.Description>
                Short observations, work-in-progress notes, and things worth keeping close.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft" color="accent">
                Notes
              </Chip>
              <Button size="sm" variant="ghost" onPress={() => onNavigate("/moments")}>
                Browse notes
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Columns */}
        <motion.div {...reveal(1)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:blocks" className="size-5" />
              </div>
              <Card.Title>Columns</Card.Title>
              <Card.Description>
                Longer-running threads that follow one idea beyond a single essay.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                Series
              </Chip>
              <Button size="sm" variant="ghost" onPress={() => onNavigate("/columns")}>
                Browse columns
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Project 3: Date archive */}
        <motion.div {...reveal(2)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:calendar-range" className="size-5" />
              </div>
              <Card.Title>Read by Date</Card.Title>
              <Card.Description>
                Return to the work published in a particular month or year.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft" color="accent">
                Timeline
              </Chip>
              <Button size="sm" variant="ghost" onPress={() => onNavigate("/archive")}>
                Browse archive
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Tools */}
        <motion.div {...reveal(3)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:briefcase" className="size-5" />
              </div>
              <Card.Title>Uses</Card.Title>
              <Card.Description>
                The physical hardware, tools, and visual setup behind my daily workflows.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                Tools
              </Chip>
              <Button size="sm" variant="ghost" onPress={() => onNavigate("/uses")}>
                Browse tools
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}
