"use client";

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
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted, useOs } from "@mantine/hooks";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserEmail,
  useLogoutMutation,
} from "@/lib/features/auth";
import { NotificationPopover } from "@/features/notification/notification-popover";
import { useGetUnreadNotificationCountQuery } from "@/lib/features/notification";
import {
  selectIsLoginOpen,
  selectIsSignUpOpen,
  setLoginOpen,
  setSignUpOpen,
  toggleDashboard,
} from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { LogIn } from "./auth/log-in";
import { SignUp } from "./auth/sign-up";
import { CommandPalette } from "./command-palette";
import { Logo, MoonFillIcon, SearchIcon, SunMaxFillIcon } from "./icons";

type NavigationId = "chronicle" | "daily" | "travelogue" | "more";

// Premium ease-out: starts extremely fast, settles gracefully and intentionally
const enterEase = [0.23, 1, 0.32, 1] as const;
const exitEase = [0.4, 0, 1, 1] as const;
const navigationSpring = {
  type: "spring" as const,
  stiffness: 360,
  damping: 40,
  mass: 0.8,
};
const activeIndicatorSpring = {
  type: "spring" as const,
  stiffness: 520,
  damping: 42,
  mass: 0.7,
};
const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getVisibleFocusableElements = (container: HTMLElement | null) =>
  Array.from(container?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(
    (element) => element.getClientRects().length > 0
  );

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
      delay: 0.02 + index * 0.02,
      duration: 0.16,
      ease: enterEase,
    },
  }),
};

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
        href: "/chronicle",
        cta: "Explore chronicle",
      };
    case "daily":
      return {
        id: "daily" as const,
        label: "Orbit", // Changed from Rituals to Orbit (representing your daily trajectory)
        eyebrow: "Daily practices",
        title: "How I spend the hours.",
        description:
          "Four pillars of focus, patience, biomechanics, and compiled logic that shape the rhythm of each day.",
        href: "/persona",
        cta: "Open persona",
      };
    case "travelogue":
      return {
        id: "travelogue" as const,
        label: "Travelogue",
        eyebrow: "Places & photography",
        title: "Moments framed in flow.",
        description:
          "Brutalist structures, wild coastlines, and silent weather studies collected across slow journeys in Iceland, Europe, and Asia.",
        href: "/universe",
        cta: "View Universe Space",
      };
    case "more":
      return {
        id: "more" as const,
        label: "Dashboard",
        eyebrow: "Operations & telemetry",
        title: "The personal cockpit.",
        description:
          "A live dashboard showcasing system health, focus telemetry, code commits, and project workspace actions.",
        href: "/dashboard",
        cta: "Launch Workbench",
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
                onAction={(key) => {
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
        {/* Field notes */}
        <motion.div {...reveal(0)}>
          <Card className="group h-full" variant="tertiary">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:notebook-pen" className="size-5" />
              </div>
              <Card.Title>Field Notes</Card.Title>
              <Card.Description>
                Short observations, work-in-progress notes, and things worth keeping close.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft" color="accent">
                Notebook
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Open Field Notes"
                onPress={() => onNavigate("/dashboard")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Project 2: Built projects */}
        <motion.div {...reveal(1)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:blocks" className="size-5" />
              </div>
              <Card.Title>Built Projects</Card.Title>
              <Card.Description>
                Tools, experiments, and open-source work shaped through practical use.
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
                aria-label="Browse projects"
                onPress={() => onNavigate("/dashboard")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
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
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Browse writing by date"
                onPress={() => onNavigate("/chronicle")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* Project 4: Equipment & Setup */}
        <motion.div {...reveal(3)}>
          <Card className="group h-full" variant="default">
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                <Icon aria-hidden="true" icon="lucide:briefcase" className="size-5" />
              </div>
              <Card.Title>Equipment</Card.Title>
              <Card.Description>
                The physical hardware, tools, and visual setup behind my daily workflows.
              </Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                Staples
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Browse equipment"
                onPress={() => onNavigate("/persona")}
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
  const [logout] = useLogoutMutation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const navigationContentRef = useRef<HTMLElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const compactStateRef = useRef(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const navigationItemsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);
  const isLoginOpen = useAppSelector(selectIsLoginOpen);
  const isSignUpOpen = useAppSelector(selectIsSignUpOpen);

  const [activeNavigation, setActiveNavigation] = useState<NavigationId | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [navigationWidths, setNavigationWidths] = useState({
    compact: 0,
    expanded: 0,
    panel: 0,
  });
  const { data: unreadNotificationCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated,
  });
  const activeItem = getNavigationItem(activeNavigation);
  const platformKey = mounted && (os === "macos" || os === "ios") ? "⌘" : "Ctrl";

  const cancelClose = useCallback(() => {
    if (!closeTimer.current) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const cancelPreview = useCallback(() => {
    if (!previewTimer.current) return;
    clearTimeout(previewTimer.current);
    previewTimer.current = null;
  }, []);

  const closeNavigation = () => {
    cancelClose();
    cancelPreview();
    setActiveNavigation(null);
    setIsLocked(false);
    setIsMobileMenuOpen(false);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  };

  const scheduleClose = () => {
    cancelClose();
    cancelPreview();
    if (isLocked) return;
    closeTimer.current = setTimeout(() => setActiveNavigation(null), 180);
  };

  const previewNavigation = (id: NavigationId) => {
    cancelClose();
    cancelPreview();
    if (activeNavigation === id) return;

    previewTimer.current = setTimeout(() => {
      previewTimer.current = null;
      setActiveNavigation(id);
    }, 100);
  };

  const toggleNavigation = (id: NavigationId) => {
    cancelClose();
    cancelPreview();
    if (activeNavigation === id && isLocked) {
      closeNavigation();
      return;
    }
    setActiveNavigation(id);
    setIsLocked(true);
  };

  const openNavigationFromKeyboard = (id: NavigationId, trigger: HTMLElement) => {
    cancelClose();
    cancelPreview();
    lastTriggerRef.current = trigger;
    setActiveNavigation(id);
    setIsLocked(true);
  };

  useEffect(() => {
    if (!activeNavigation && !isMobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelClose();
        cancelPreview();
        setActiveNavigation(null);
        setIsLocked(false);
        setIsMobileMenuOpen(false);
        window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
      }

      if (event.key !== "Tab" || (!isLocked && !isMobileMenuOpen)) return;
      const focusable = getVisibleFocusableElements(panelRef.current);
      if (!focusable.length) return;
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
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [activeNavigation, cancelClose, cancelPreview, isLocked, isMobileMenuOpen]);

  useEffect(() => {
    if (!isLocked && !isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let focusFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(() =>
        getVisibleFocusableElements(navigationContentRef.current)[0]?.focus()
      );
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked, isMobileMenuOpen]);

  useEffect(
    () => () => {
      cancelClose();
      cancelPreview();
    },
    [cancelClose, cancelPreview]
  );

  useEffect(() => {
    const updateCompactState = () => {
      if (document.documentElement.style.overflow === "hidden") return;

      const scrollTop = window.scrollY;
      const nextCompact = compactStateRef.current ? scrollTop > 24 : scrollTop > 64;

      if (nextCompact === compactStateRef.current) return;
      compactStateRef.current = nextCompact;
      setIsCompact(nextCompact);
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });

    return () => window.removeEventListener("scroll", updateCompactState);
  }, []);

  useEffect(() => {
    const measureNavigation = () => {
      if (document.documentElement.style.overflow === "hidden") return;

      const brandWidth = brandRef.current?.offsetWidth ?? 0;
      const navigationItemsWidth = navigationItemsRef.current?.offsetWidth ?? 0;
      const actionsWidth = actionsRef.current?.offsetWidth ?? 0;
      const navigationStyle = navigationRef.current
        ? window.getComputedStyle(navigationRef.current)
        : null;
      const horizontalPadding =
        Number.parseFloat(navigationStyle?.paddingLeft ?? "0") +
        Number.parseFloat(navigationStyle?.paddingRight ?? "0");
      const columnGap = Number.parseFloat(navigationStyle?.columnGap ?? "0");
      const viewportWidth = document.documentElement.clientWidth;
      const panelWidth = Math.min(Math.max(viewportWidth - 32, 0), 1280);
      const compactWidth = Math.min(
        Math.ceil(
          brandWidth + navigationItemsWidth + actionsWidth + horizontalPadding + columnGap * 2
        ),
        panelWidth
      );
      const expandedWidth = Math.min(viewportWidth, 1280);

      setNavigationWidths((current) => {
        if (
          current.compact === compactWidth &&
          current.expanded === expandedWidth &&
          current.panel === panelWidth
        ) {
          return current;
        }

        return {
          compact: compactWidth,
          expanded: expandedWidth,
          panel: panelWidth,
        };
      });
    };

    const resizeObserver = new ResizeObserver(measureNavigation);
    const observedElements = [
      navigationRef.current,
      brandRef.current,
      navigationItemsRef.current,
      actionsRef.current,
    ];

    observedElements.forEach((element) => {
      if (element) resizeObserver.observe(element);
    });

    const animationFrame = window.requestAnimationFrame(measureNavigation);
    window.addEventListener("resize", measureNavigation);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", measureNavigation);
      resizeObserver.disconnect();
    };
  }, []);

  const handleLogout = () => {
    void logout();
  };

  const switchToSignUp = () => {
    dispatch(setLoginOpen(false));
    window.setTimeout(() => dispatch(setSignUpOpen(true)), 220);
  };

  const switchToLogIn = () => {
    dispatch(setSignUpOpen(false));
    window.setTimeout(() => dispatch(setLoginOpen(true)), 220);
  };

  const openAuthFromMobileMenu = (mode: "login" | "signup") => {
    cancelClose();
    cancelPreview();
    setActiveNavigation(null);
    setIsLocked(false);
    setIsMobileMenuOpen(false);

    window.setTimeout(
      () => dispatch(mode === "login" ? setLoginOpen(true) : setSignUpOpen(true)),
      reduceMotion ? 0 : 220
    );
  };

  const isNavigationOpen = Boolean(activeItem || isMobileMenuOpen);
  const hasGlassSurface = isCompact || isNavigationOpen;
  const glassBackground =
    resolvedTheme === "light" ? "rgba(255, 255, 255, 0.34)" : "rgba(12, 10, 18, 0.22)";
  const glassBorder =
    resolvedTheme === "light" ? "rgba(17, 17, 20, 0.08)" : "rgba(255, 255, 255, 0.1)";
  const targetNavigationWidth = isNavigationOpen
    ? navigationWidths.panel
    : isCompact
      ? navigationWidths.compact
      : navigationWidths.expanded;

  // Micro-stagger orchestrator for left-hand header elements
  const textEntrance = {
    hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: 0.01 + i * 0.018,
        duration: 0.15,
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
            exit={{
              opacity: 0,
              transition: { duration: reduceMotion ? 0 : 0.12, ease: exitEase },
            }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: enterEase }}
            onClick={closeNavigation}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={panelRef}
        data-compact={isCompact}
        role={isLocked || isMobileMenuOpen ? "dialog" : undefined}
        aria-modal={isLocked || isMobileMenuOpen ? true : undefined}
        aria-label={isLocked || isMobileMenuOpen ? "Odyssey navigation" : undefined}
        className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{
          opacity: 1,
          width: targetNavigationWidth || "100%",
          y: isNavigationOpen ? 16 : isCompact ? 12 : 0,
          backgroundColor: hasGlassSurface ? glassBackground : "rgba(0, 0, 0, 0)",
          borderColor: hasGlassSurface ? glassBorder : "rgba(0, 0, 0, 0)",
          boxShadow: hasGlassSurface ? "0 14px 40px rgba(0, 0, 0, 0.08)" : "0 0 0 rgba(0, 0, 0, 0)",
          backdropFilter: hasGlassSurface ? "blur(16px) saturate(1.2)" : "blur(0px) saturate(1)",
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                opacity: { duration: 0.2, ease: enterEase },
                width: navigationSpring,
                y: navigationSpring,
                backgroundColor: { duration: 0.18, ease: enterEase },
                borderColor: { duration: 0.18, ease: enterEase },
                boxShadow: { duration: 0.18, ease: enterEase },
                backdropFilter: { duration: 0.18, ease: enterEase },
              }
        }
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <motion.nav
          ref={navigationRef}
          aria-label="Primary navigation"
          className="mx-auto grid w-full max-w-7xl grid-cols-[auto_auto_auto] items-center justify-between gap-3 px-2.5 py-0.5"
        >
          <motion.div
            ref={brandRef}
            className="justify-self-start"
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          >
            <Link href="/" onClick={closeNavigation} aria-label="Odyssey home">
              <Logo size={30} />
            </Link>
          </motion.div>

          {/* Static unrolled main navigation items */}
          <motion.div ref={navigationItemsRef} className="hidden items-center gap-1 md:flex">
            {/* Item 1: Chronicle */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("chronicle")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "chronicle" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "chronicle"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("chronicle", event.currentTarget);
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
            </div>

            {/* Item 2: Orbit */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("daily")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "daily" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "daily"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("daily", event.currentTarget);
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
            </div>

            {/* Item 3: Travelogue */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("travelogue")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "travelogue" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "travelogue"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("travelogue", event.currentTarget);
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
            </div>

            {/* Item 4: Archive */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("more")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "more" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "more"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("more", event.currentTarget);
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
            </div>
          </motion.div>

          <motion.div
            ref={actionsRef}
            className="flex shrink-0 items-center gap-1.5 justify-self-end"
          >
            <Tooltip delay={500} closeDelay={100}>
              <Button
                isIconOnly
                variant="ghost"
                className="size-10 rounded-xl lg:hidden"
                aria-label="Search"
                onPress={() => setIsSearchOpen(true)}
              >
                <SearchIcon aria-hidden="true" size={16} />
              </Button>
              <Tooltip.Content placement="bottom" offset={8}>
                Search
              </Tooltip.Content>
            </Tooltip>

            <div className="hidden lg:block">
              <Button
                variant="ghost"
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
            </div>

            <div className="hidden md:block">
              <Tooltip delay={500} closeDelay={100}>
                <Button
                  isIconOnly
                  variant="ghost"
                  className="size-10 rounded-xl"
                  aria-label={
                    mounted
                      ? resolvedTheme === "dark"
                        ? "Switch to light theme"
                        : "Switch to dark theme"
                      : "Toggle theme"
                  }
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
                        exit={{
                          opacity: 0,
                          ...(reduceMotion ? {} : { y: 4, filter: "blur(2px)" }),
                          transition: { duration: reduceMotion ? 0 : 0.1, ease: exitEase },
                        }}
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
                <Tooltip.Content placement="bottom" offset={8}>
                  {mounted ? (resolvedTheme === "dark" ? "Light theme" : "Dark theme") : "Theme"}
                </Tooltip.Content>
              </Tooltip>
            </div>

            {mounted && isAuthenticated ? <NotificationPopover /> : null}

            {mounted && isAuthenticated ? (
              <Dropdown>
                <Tooltip delay={500} closeDelay={100}>
                  <Dropdown.Trigger aria-label="Open account menu" className="rounded-xl p-1.5">
                    <Badge.Anchor>
                      <Avatar size="sm" className="size-8">
                        <Avatar.Fallback>
                          {username?.charAt(0).toUpperCase() || "U"}
                        </Avatar.Fallback>
                      </Avatar>
                      <Badge color="success" placement="bottom-right" size="sm" />
                    </Badge.Anchor>
                  </Dropdown.Trigger>
                  <Tooltip.Content placement="bottom" offset={8}>
                    Account
                  </Tooltip.Content>
                </Tooltip>
                <Dropdown.Popover className="min-w-[250px]">
                  <div className="px-3 pt-3 pb-2">
                    <p className="truncate text-sm font-semibold">{username || "User"}</p>
                    <p className="text-muted truncate text-xs">{email || "Owner account"}</p>
                  </div>
                  <Dropdown.Menu
                    aria-label="Account actions"
                    onAction={(key) => {
                      if (key === "dashboard") dispatch(toggleDashboard());
                      if (key === "library") router.push("/library");
                      if (key === "notifications") router.push("/notifications");
                      if (key === "logout") handleLogout();
                    }}
                  >
                    <Dropdown.Item id="dashboard" textValue="Dashboard">
                      <Label>Dashboard</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="library" textValue="Reading library">
                      <Label>Reading library</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="notifications" textValue="Notifications">
                      <Label>
                        Notifications
                        {unreadNotificationCount > 0 ? ` (${unreadNotificationCount})` : ""}
                      </Label>
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

            <div className="md:hidden">
              <Tooltip delay={500} closeDelay={100}>
                <Button
                  isIconOnly
                  variant="ghost"
                  className="size-10 rounded-xl"
                  aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-haspopup="dialog"
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
                      exit={{
                        opacity: 0,
                        ...(reduceMotion ? {} : { rotate: 45, scale: 0.9 }),
                        transition: { duration: reduceMotion ? 0 : 0.1, ease: exitEase },
                      }}
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
                <Tooltip.Content placement="bottom" offset={8}>
                  {isMobileMenuOpen ? "Close menu" : "Open menu"}
                </Tooltip.Content>
              </Tooltip>
            </div>
          </motion.div>
        </motion.nav>

        <AnimatePresence initial={false} propagate>
          {isNavigationOpen && (
            <motion.section
              ref={navigationContentRef}
              key="mega-navigation-content"
              id="odyssey-mega-navigation"
              aria-label={activeItem ? `${activeItem.label} overview` : "Navigation sections"}
              className="max-h-[calc(100dvh-5.5rem)]"
              style={{ overflow: "hidden" }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "auto" } }}
              exit={{
                opacity: 0,
                height: 0,
                overflow: "hidden",
                transition: { duration: reduceMotion ? 0 : 0.16, ease: exitEase },
              }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: enterEase }}
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
                          transition={{ delay: 0, duration: 0.16, ease: enterEase }}
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
                          transition={{ delay: 0.04, duration: 0.16, ease: enterEase }}
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
                          transition={{ delay: 0.08, duration: 0.16, ease: enterEase }}
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
                          transition={{ delay: 0.12, duration: 0.16, ease: enterEase }}
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

                      {mounted && !isAuthenticated && (
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <Button
                            fullWidth
                            variant="secondary"
                            onPress={() => openAuthFromMobileMenu("login")}
                          >
                            Sign in
                          </Button>
                          <Button fullWidth onPress={() => openAuthFromMobileMenu("signup")}>
                            Create account
                          </Button>
                        </div>
                      )}
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
                  <AnimatePresence mode="popLayout" initial={false} propagate>
                    <motion.div
                      key={activeItem.id}
                      className="col-span-full grid gap-8 md:grid-cols-12 md:gap-10"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(2px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{
                        opacity: 0,
                        ...(reduceMotion ? {} : { filter: "blur(2px)" }),
                        transition: { duration: reduceMotion ? 0 : 0.1, ease: exitEase },
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.16,
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
