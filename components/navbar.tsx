"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Description,
  Dropdown,
  Kbd,
  Label,
  ListBox,
  ProgressBar,
  Tabs,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted, useOs } from "@mantine/hooks";
import { useTheme } from "next-themes";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  removeCredentials,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserEmail,
  setLoginOpen,
  setSignUpOpen,
  selectIsLoginOpen,
  selectIsSignUpOpen,
} from "@/lib/features/auth";
import { baseApi } from "@/lib/features/api/base-api";
import { CommandPalette } from "./command-palette";
import { LogIn } from "./auth/log-in";
import { SignUp } from "./auth/sign-up";
import { MoonFillIcon, SearchIcon, SunMaxFillIcon } from "./icons";
import { SmileBallLogo } from "./ui/smile-ball";

type NavigationId = "chronicle" | "daily" | "travelogue" | "more";

// Premium ease-out: starts extremely fast, settles gracefully and intentionally
const enterEase = [0.23, 1, 0.32, 1] as const;

type MegaPanelContentProps = {
  id: NavigationId;
  onNavigate: (href: string) => void;
  reduceMotion: boolean;
};

// Tight, swift stagger entrance for list/group items
const contentEntrance = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.04 + index * 0.025,
      duration: 0.18,
      ease: enterEase,
    },
  }),
};

// Animated Progress Bar that counts up when mounted (highly immersive!)
function AnimatedProgressBar({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const [progress, setProgress] = useState(0);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => setProgress(value), delay * 1000 + 80);
    return () => clearTimeout(timer);
  }, [mounted, value, delay]);

  return (
    <ProgressBar aria-label={label} value={progress} size="sm">
      <Label>{label}</Label>
      <ProgressBar.Output />
      <ProgressBar.Track>
        <ProgressBar.Fill className="transition-all duration-[700ms] ease-out" />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

// Statically mapping Navigation details for dynamic switch-case loop-free lookups
const getNavigationItem = (id: NavigationId | null) => {
  if (!id) return null;
  switch (id) {
    case "chronicle":
      return {
        id: "chronicle" as const,
        label: "Chronicle",
        eyebrow: "Writing & systems",
        title: "Words that survive the build.",
        description:
          "Field notes on design systems, accessible engineering, and structural decisions that resist contact with the real world.",
        href: "/test/blog",
        cta: "Explore the archive",
      };
    case "daily":
      return {
        id: "daily" as const,
        label: "Orbit", // Changed from Rituals to Orbit (representing your daily trajectory)
        eyebrow: "Daily practices",
        title: "How I spend the hours.",
        description:
          "Four pillars of focus, patience, biomechanics, and compiled logic that shape the rhythm of each day.",
        href: "/test/moment",
        cta: "Open day logs",
      };
    case "travelogue":
      return {
        id: "travelogue" as const,
        label: "Travelogue",
        eyebrow: "Places & photography",
        title: "Moments framed in flow.",
        description:
          "Brutalist structures, wild coastlines, and silent weather studies collected across slow journeys in Iceland, Europe, and Asia.",
        href: "/test/file",
        cta: "View Travelogue",
      };
    case "more":
      return {
        id: "more" as const,
        label: "Archive",
        eyebrow: "Projects & objects",
        title: "The rest of the yard.",
        description:
          "A repository of shipping products, open-source utilities, and useful objects curated or built along the journey.",
        href: "/test/portfolio",
        cta: "Explore the archive",
      };
    default:
      return null;
  }
};

function MegaPanelContent({ id, onNavigate, reduceMotion }: MegaPanelContentProps) {
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
            <Card.Footer>
              <Chip size="sm" color="accent" variant="soft">
                Featured essay
              </Chip>
              <Button size="sm" variant="ghost" onPress={() => onNavigate("/test/blog")}>
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
                onAction={() => onNavigate("/test/blog")}
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
                onPress={() => onNavigate("/test/music")}
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
                onPress={() => onNavigate("/test/moment")}
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
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">S</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-muted text-[8px] font-bold uppercase">S</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
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
                onPress={() => onNavigate("/test/moment")}
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
                onPress={() => onNavigate("/test/moment")}
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
      <div className="grid gap-4 md:col-span-8 md:grid-cols-3">
        {/* Project 1: Odyssey Shipyard */}
        <motion.div {...reveal(0)}>
          <Card className="group h-full" variant="tertiary">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:blocks" className="size-5" />
              </div>
              <Card.Title>Odyssey Shipyard</Card.Title>
              <Card.Description>
                Products, layouts, and Next.js widgets in active development.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                In progress
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Open Odyssey Shipyard"
                onPress={() => onNavigate("/test/portfolio")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Project 2: Selected Goods */}
        <motion.div {...reveal(1)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:bookmark" className="size-5" />
              </div>
              <Card.Title>Selected Goods</Card.Title>
              <Card.Description>
                Useful objects, software toolkits, and tactile physical gears.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                Curated
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Open Selected Goods"
                onPress={() => onNavigate("/test/tag")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Project 3: Symbiosis Echo */}
        <motion.div {...reveal(2)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:message-circle" className="size-5" />
              </div>
              <Card.Title>Symbiosis Echo</Card.Title>
              <Card.Description>
                Notes, digital postcards, and feedback gathered from visitors.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                Active
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Open Symbiosis Echo"
                onPress={() => onNavigate("/test/comment")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}

export const Navbar = () => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const os = useOs();
  const reduceMotion = useReducedMotion();
  const dispatch = useAppDispatch();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);
  const isLoginOpen = useAppSelector(selectIsLoginOpen);
  const isSignUpOpen = useAppSelector(selectIsSignUpOpen);

  const [activeNavigation, setActiveNavigation] = useState<NavigationId | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeItem = getNavigationItem(activeNavigation);
  const platformKey = mounted && (os === "macos" || os === "ios") ? "⌘" : "Ctrl";

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const closeNavigation = () => {
    cancelClose();
    setActiveNavigation(null);
    setIsLocked(false);
    setIsMobileMenuOpen(false);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  };

  const scheduleClose = () => {
    cancelClose();
    if (isLocked) return;
    closeTimer.current = setTimeout(() => setActiveNavigation(null), 180);
  };

  const previewNavigation = (id: NavigationId) => {
    cancelClose();
    setActiveNavigation(id);
  };

  const toggleNavigation = (id: NavigationId) => {
    cancelClose();
    if (activeNavigation === id && isLocked) {
      closeNavigation();
      return;
    }
    setActiveNavigation(id);
    setIsLocked(true);
  };

  useEffect(() => {
    if (!activeNavigation && !isMobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setActiveNavigation(null);
        setIsLocked(false);
        setIsMobileMenuOpen(false);
        window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
      }

      if (event.key !== "Tab" || (!isLocked && !isMobileMenuOpen)) return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNavigation, isLocked, isMobileMenuOpen]);

  useEffect(() => {
    if (!isLocked && !isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("button")?.focus()
    );
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked, isMobileMenuOpen]);

  useEffect(() => () => cancelClose(), []);

  const handleLogout = () => {
    dispatch(removeCredentials());
    dispatch(baseApi.util.resetApiState());
  };

  const switchToSignUp = () => {
    dispatch(setLoginOpen(false));
    window.setTimeout(() => dispatch(setSignUpOpen(true)), 220);
  };

  const switchToLogIn = () => {
    dispatch(setSignUpOpen(false));
    window.setTimeout(() => dispatch(setLoginOpen(true)), 220);
  };

  const isNavigationOpen = Boolean(activeItem || isMobileMenuOpen);

  // Micro-stagger orchestrator for left-hand header elements
  const textEntrance = {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: 0.02 + i * 0.03,
        duration: 0.18,
        ease: enterEase,
      },
    }),
  };

  return (
    <>
      <AnimatePresence>
        {isNavigationOpen && (
          <motion.button
            key="navigation-backdrop"
            type="button"
            tabIndex={-1}
            aria-label="Close navigation"
            className="fixed inset-0 z-40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: enterEase }}
            onClick={closeNavigation}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={panelRef}
        layout={!reduceMotion}
        role={isLocked || isMobileMenuOpen ? "dialog" : undefined}
        aria-modal={isLocked || isMobileMenuOpen ? true : undefined}
        aria-label={isLocked || isMobileMenuOpen ? "Odyssey navigation" : undefined}
        className="absolute top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 overflow-hidden rounded-2xl bg-transparent shadow-[0_18px_56px_rgba(0,0,0,0.14)] backdrop-blur-2xl backdrop-saturate-150"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                layout: { type: "spring", stiffness: 350, damping: 35, mass: 0.8 },
                duration: 0.25,
                ease: enterEase,
              }
        }
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <nav
          aria-label="Primary navigation"
          className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-3 py-0.5 sm:px-4"
        >
          <motion.div
            className="justify-self-start"
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          >
            <Link
              href="/"
              onClick={closeNavigation}
              className="outline-focus-ring flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-2 text-sm font-semibold tracking-[-0.02em]"
              aria-label="Odyssey home"
            >
              <SmileBallLogo size={28} />
              <span className="hidden sm:inline">Odyssey</span>
            </Link>
          </motion.div>

          {/* Static unrolled main navigation items */}
          <div className="hidden items-center gap-1 md:flex">
            {/* Item 1: Chronicle */}
            <motion.div
              className="relative"
              onHoverStart={() => previewNavigation("chronicle")}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              {activeNavigation === "chronicle" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={activeNavigation === "chronicle"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                  previewNavigation("chronicle");
                }}
                onPress={() => toggleNavigation("chronicle")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Chronicle
                  {activeNavigation === "chronicle" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </motion.div>

            {/* Item 2: Orbit */}
            <motion.div
              className="relative"
              onHoverStart={() => previewNavigation("daily")}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              {activeNavigation === "daily" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={activeNavigation === "daily"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                  previewNavigation("daily");
                }}
                onPress={() => toggleNavigation("daily")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Orbit
                  {activeNavigation === "daily" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </motion.div>

            {/* Item 3: Travelogue */}
            <motion.div
              className="relative"
              onHoverStart={() => previewNavigation("travelogue")}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              {activeNavigation === "travelogue" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={activeNavigation === "travelogue"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                  previewNavigation("travelogue");
                }}
                onPress={() => toggleNavigation("travelogue")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Travelogue
                  {activeNavigation === "travelogue" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </motion.div>

            {/* Item 4: Archive */}
            <motion.div
              className="relative"
              onHoverStart={() => previewNavigation("more")}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              {activeNavigation === "more" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={activeNavigation === "more"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                  previewNavigation("more");
                }}
                onPress={() => toggleNavigation("more")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Archive
                  {activeNavigation === "more" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </motion.div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 justify-self-end">
            <motion.div whileTap={reduceMotion ? undefined : { scale: 0.95 }}>
              <Button
                isIconOnly
                variant="ghost"
                className="size-10 rounded-xl lg:hidden"
                aria-label="Search"
                onPress={() => setIsSearchOpen(true)}
              >
                <SearchIcon aria-hidden="true" size={16} />
              </Button>
            </motion.div>

            <motion.div
              className="hidden lg:block"
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              <Button
                variant="secondary"
                className="h-9 min-w-0 gap-2 rounded-xl px-3"
                aria-label={`Search, keyboard shortcut ${platformKey} K`}
                onPress={() => setIsSearchOpen(true)}
              >
                <SearchIcon aria-hidden="true" size={14} />
                <span className="text-xs font-medium">Search</span>
                <Kbd variant="light" aria-hidden="true">
                  <Kbd.Abbr keyValue={platformKey === "⌘" ? "command" : "ctrl"} />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </Button>
            </motion.div>

            <motion.div
              className="hidden md:block"
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              <Button
                isIconOnly
                variant="ghost"
                className="size-10 rounded-xl"
                aria-label="Toggle color theme"
                onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                <AnimatePresence mode="wait" initial={false} propagate>
                  {mounted && (
                    <motion.span
                      key={resolvedTheme}
                      initial={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(2px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, filter: "blur(2px)" }
                      }
                      transition={{ duration: 0.14, ease: enterEase }}
                      className="flex"
                    >
                      {resolvedTheme === "dark" ? (
                        <SunMaxFillIcon size={16} />
                      ) : (
                        <MoonFillIcon size={16} />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            {mounted && isAuthenticated ? (
              <Dropdown>
                <Dropdown.Trigger aria-label="Open account menu" className="rounded-xl p-1.5">
                  <Badge.Anchor>
                    <Avatar size="sm" className="size-8">
                      <Avatar.Fallback>{username?.charAt(0).toUpperCase() || "U"}</Avatar.Fallback>
                    </Avatar>
                    <Badge color="success" placement="bottom-right" size="sm" />
                  </Badge.Anchor>
                </Dropdown.Trigger>
                <Dropdown.Popover className="min-w-[250px]">
                  <div className="px-3 pt-3 pb-2">
                    <p className="truncate text-sm font-semibold">{username || "User"}</p>
                    <p className="text-muted truncate text-xs">{email || "Owner account"}</p>
                  </div>
                  <Dropdown.Menu
                    aria-label="Account actions"
                    onAction={(key) => {
                      if (key === "dashboard") router.push("/test/category");
                      if (key === "profile") router.push("/test/profile");
                      if (key === "logout") handleLogout();
                    }}
                  >
                    <Dropdown.Item id="dashboard" textValue="Dashboard">
                      <Label>Dashboard</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="profile" textValue="Profile">
                      <Label>Profile</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="logout" textValue="Log out" variant="danger">
                      <Label>Log out</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="hidden h-9 rounded-xl px-3.5 font-semibold sm:flex"
                onPress={() => dispatch(setLoginOpen(true))}
              >
                Sign in
              </Button>
            )}

            <motion.div className="md:hidden" whileTap={reduceMotion ? undefined : { scale: 0.95 }}>
              <Button
                isIconOnly
                variant="ghost"
                className="size-10 rounded-xl"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onPress={() => {
                  if (isMobileMenuOpen) closeNavigation();
                  else {
                    setActiveNavigation(null);
                    setIsLocked(false);
                    setIsMobileMenuOpen(true);
                  }
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isMobileMenuOpen ? "close" : "menu"}
                    initial={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.9 }
                    }
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.9 }}
                    transition={{ duration: 0.15, ease: enterEase }}
                    className="flex"
                  >
                    <Icon
                      aria-hidden="true"
                      icon={isMobileMenuOpen ? "lucide:x" : "lucide:menu"}
                      className="size-5"
                    />
                  </motion.span>
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {isNavigationOpen && (
            <motion.section
              key="mega-navigation-content"
              id="odyssey-mega-navigation"
              aria-label={activeItem ? `${activeItem.label} overview` : "Navigation sections"}
              className="max-h-[calc(100dvh-5.5rem)]"
              style={{ overflow: "hidden" }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "auto" } }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: enterEase }}
            >
              <div className="px-5 py-7 sm:px-8 md:px-12 md:py-9 xl:px-16 2xl:px-20">
                <div className="md:hidden">
                  {!activeItem ? (
                    <motion.div
                      key="mobile-index"
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="pb-3"
                    >
                      <p className="text-muted mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
                        Explore Odyssey
                      </p>

                      {/* Static unrolled mobile menu index triggers */}
                      <div className="grid gap-1">
                        {/* Mobile 1: Chronicle */}
                        <motion.div
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0 }}
                        >
                          <Button
                            fullWidth
                            variant="ghost"
                            className="h-auto justify-between px-2 py-3 text-left"
                            onPress={() => setActiveNavigation("chronicle")}
                          >
                            <span>
                              <span className="block text-base font-semibold">Chronicle</span>
                              <span className="text-muted mt-0.5 block text-xs font-normal">
                                Writing & systems
                              </span>
                            </span>
                            <Icon aria-hidden="true" icon="lucide:arrow-right" className="size-4" />
                          </Button>
                        </motion.div>

                        {/* Mobile 2: Orbit */}
                        <motion.div
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.045 }}
                        >
                          <Button
                            fullWidth
                            variant="ghost"
                            className="h-auto justify-between px-2 py-3 text-left"
                            onPress={() => setActiveNavigation("daily")}
                          >
                            <span>
                              <span className="block text-base font-semibold">Orbit</span>
                              <span className="text-muted mt-0.5 block text-xs font-normal">
                                Daily practices
                              </span>
                            </span>
                            <Icon aria-hidden="true" icon="lucide:arrow-right" className="size-4" />
                          </Button>
                        </motion.div>

                        {/* Mobile 3: Travelogue */}
                        <motion.div
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.09 }}
                        >
                          <Button
                            fullWidth
                            variant="ghost"
                            className="h-auto justify-between px-2 py-3 text-left"
                            onPress={() => setActiveNavigation("travelogue")}
                          >
                            <span>
                              <span className="block text-base font-semibold">Travelogue</span>
                              <span className="text-muted mt-0.5 block text-xs font-normal">
                                Places & photography
                              </span>
                            </span>
                            <Icon aria-hidden="true" icon="lucide:arrow-right" className="size-4" />
                          </Button>
                        </motion.div>

                        {/* Mobile 4: Archive */}
                        <motion.div
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.135 }}
                        >
                          <Button
                            fullWidth
                            variant="ghost"
                            className="h-auto justify-between px-2 py-3 text-left"
                            onPress={() => setActiveNavigation("more")}
                          >
                            <span>
                              <span className="block text-base font-semibold">Archive</span>
                              <span className="text-muted mt-0.5 block text-xs font-normal">
                                Projects & objects
                              </span>
                            </span>
                            <Icon aria-hidden="true" icon="lucide:arrow-right" className="size-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mb-5 -ml-2"
                      onPress={() => setActiveNavigation(null)}
                    >
                      <Icon aria-hidden="true" icon="lucide:arrow-left" className="size-4" />
                      All sections
                    </Button>
                  )}
                </div>

                {activeItem && (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeItem.id}
                      className="col-span-full grid gap-8 md:grid-cols-12 md:gap-10"
                      initial={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(3px)" }
                      }
                      transition={{
                        delay: reduceMotion ? 0 : 0.02,
                        duration: reduceMotion ? 0 : 0.12,
                        ease: enterEase,
                      }}
                    >
                      {/* Premium Staggered Text Column */}
                      <div className="flex flex-col items-start md:col-span-4">
                        <motion.p
                          custom={0}
                          variants={textEntrance}
                          initial={reduceMotion ? false : "hidden"}
                          animate="visible"
                          className="text-accent text-xs font-semibold tracking-[0.16em] uppercase"
                        >
                          {activeItem.eyebrow}
                        </motion.p>
                        <motion.h2
                          custom={1}
                          variants={textEntrance}
                          initial={reduceMotion ? false : "hidden"}
                          animate="visible"
                          className="mt-4 max-w-[10ch] text-[clamp(2.5rem,4.5vw,5rem)] leading-[0.94] font-semibold tracking-[-0.055em]"
                        >
                          {activeItem.title}
                        </motion.h2>
                        <motion.p
                          custom={2}
                          variants={textEntrance}
                          initial={reduceMotion ? false : "hidden"}
                          animate="visible"
                          className="text-muted mt-5 max-w-md text-sm leading-6 sm:text-base sm:leading-7"
                        >
                          {activeItem.description}
                        </motion.p>
                        <motion.div
                          custom={3}
                          variants={textEntrance}
                          initial={reduceMotion ? false : "hidden"}
                          animate="visible"
                        >
                          <Button
                            className="mt-7"
                            onPress={() => {
                              closeNavigation();
                              router.push(activeItem.href);
                            }}
                          >
                            {activeItem.cta}
                            <Icon
                              aria-hidden="true"
                              icon="lucide:arrow-up-right"
                              className="size-4"
                            />
                          </Button>
                        </motion.div>
                      </div>

                      <MegaPanelContent
                        id={activeItem.id}
                        reduceMotion={Boolean(reduceMotion)}
                        onNavigate={(href) => {
                          closeNavigation();
                          router.push(href);
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>

      <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
      <SignUp
        isOpen={isSignUpOpen}
        onOpenChange={(open) => dispatch(setSignUpOpen(open))}
        onSwitchToLogIn={switchToLogIn}
      />
      <LogIn
        isOpen={isLoginOpen}
        onOpenChange={(open) => dispatch(setLoginOpen(open))}
        onSwitchToSignUp={switchToSignUp}
      />
    </>
  );
};
