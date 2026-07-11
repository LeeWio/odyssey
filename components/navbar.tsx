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
} from "@/lib/features/auth";
import { baseApi } from "@/lib/features/api/base-api";
import { CommandPalette } from "./command-palette";
import { LogIn } from "./auth/log-in";
import { SignUp } from "./auth/sign-up";
import { MoonFillIcon, SearchIcon, SunMaxFillIcon } from "./icons";
import { SmileBallLogo } from "./ui/smile-ball";

const navigationItems = [
  {
    id: "chronicle",
    label: "Chronicle",
    eyebrow: "Writing & ideas",
    title: "Words worth keeping.",
    description:
      "Essays on design systems, accessible engineering, and the decisions that survive a finished build.",
    href: "/test/blog",
    cta: "Explore Chronicle",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=86",
    feature: "Symbiosis: The Resilience of Outposts",
    meta: "Design systems · 5 min read",
    groups: [
      { label: "Design systems", detail: "Interfaces that remain coherent" },
      { label: "Engineering", detail: "Accessible, resilient software" },
      { label: "Field notes", detail: "Small observations from the work" },
    ],
  },
  {
    id: "ledger",
    label: "Ledger",
    eyebrow: "Markets & decisions",
    title: "A record for the long horizon.",
    description:
      "A private practice of writing before acting—tracking conviction, patience, and what each decision taught over time.",
    href: "/test/moment",
    cta: "Open the Ledger",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=86",
    feature: "Process before prediction",
    meta: "Years, not weeks",
    groups: [
      { label: "Market notes", detail: "Signals without the noise" },
      { label: "Decision journal", detail: "Thesis, action, reflection" },
      { label: "Reading room", detail: "Research worth returning to" },
    ],
  },
  {
    id: "sanctuary",
    label: "Sanctuary",
    eyebrow: "Sound & daily rituals",
    title: "A room shaped by sound.",
    description:
      "Slow soundtracks, ambient rooms, movement, and the quiet rituals that change the atmosphere of a day.",
    href: "/test/moment",
    cta: "Enter Sanctuary",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=86",
    feature: "Music earns its place by changing the room",
    meta: "Now collecting · Ambient works",
    groups: [
      { label: "Soundtrack", detail: "Albums and listening notes" },
      { label: "Movement", detail: "Training, recovery, repetition" },
      { label: "Daily practice", detail: "Systems for a quieter life" },
    ],
  },
  {
    id: "travelogue",
    label: "Travelogue",
    eyebrow: "Places & photographs",
    title: "Places that changed the pace.",
    description:
      "Architecture, weather, and small moments collected from journeys across Iceland, Europe, and Asia.",
    href: "/test/file",
    cta: "View Travelogue",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=86",
    feature: "North Atlantic studies",
    meta: "Iceland · 64°08′N",
    groups: [
      { label: "Field journal", detail: "Routes, weather, observations" },
      { label: "Exhibitions", detail: "Photographic stories" },
      { label: "Atlas", detail: "Places worth returning to" },
    ],
  },
  {
    id: "more",
    label: "More",
    eyebrow: "Projects & collections",
    title: "The rest of the archive.",
    description:
      "Products in progress, useful objects, public experiments, and conversations gathered along the way.",
    href: "/test/portfolio",
    cta: "View all projects",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=86",
    feature: "Odyssey Shipyard",
    meta: "Selected builds · 2026",
    groups: [
      { label: "Builds", detail: "Products and open-source work", href: "/test/portfolio" },
      { label: "Curations", detail: "Tools, objects, and references", href: "/test/tag" },
      { label: "Echo", detail: "Notes from visitors", href: "/test/comment" },
    ],
  },
] as const;

type NavigationId = (typeof navigationItems)[number]["id"];

const enterEase = [0.16, 1, 0.3, 1] as const;

type MegaPanelContentProps = {
  id: NavigationId;
  onNavigate: (href: string) => void;
  reduceMotion: boolean;
};

const contentEntrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.06 + index * 0.035, duration: 0.22, ease: enterEase },
  }),
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
          <Card className="h-full" variant="secondary">
            <div className="relative min-h-52 flex-1 overflow-hidden rounded-2xl">
              <Image
                fill
                alt="Notebook and pencil on a quiet writing desk"
                className="object-cover"
                sizes="(max-width: 767px) 90vw, 38vw"
                src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=86"
              />
            </div>
            <Card.Header>
              <Card.Title>Symbiosis: The Resilience of Outposts</Card.Title>
              <Card.Description>
                A field note on systems that survive contact with reality.
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
                  <Description>Design systems · 6 min</Description>
                </ListBox.Item>
                <ListBox.Item id="motion" textValue="Motion that explains itself">
                  <Label>Motion that explains itself</Label>
                  <Description>Interaction · 4 min</Description>
                </ListBox.Item>
                <ListBox.Item id="access" textValue="The quiet work of accessibility">
                  <Label>The quiet work of accessibility</Label>
                  <Description>Engineering · 8 min</Description>
                </ListBox.Item>
              </ListBox>
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (id === "ledger") {
    const metrics = [
      { label: "Thesis confidence", value: 74, detail: "Evidence reviewed" },
      { label: "Time horizon", value: 88, detail: "Long-term posture" },
      { label: "Decision clarity", value: 62, detail: "Notes completed" },
    ];
    return (
      <div className="grid gap-4 md:col-span-8 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div key={metric.label} {...reveal(index)}>
            <Card className="h-full" variant={index === 0 ? "secondary" : "default"}>
              <Card.Header>
                <Card.Description>{metric.detail}</Card.Description>
                <Card.Title className="text-2xl tabular-nums">{metric.value}%</Card.Title>
              </Card.Header>
              <Card.Content className="mt-auto">
                <ProgressBar aria-label={metric.label} value={metric.value} size="sm">
                  <Label>{metric.label}</Label>
                  <ProgressBar.Output />
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </Card.Content>
            </Card>
          </motion.div>
        ))}
        <motion.div {...reveal(3)} className="md:col-span-3">
          <Card className="items-center justify-between gap-4 md:flex-row" variant="transparent">
            <div>
              <Card.Title>Process before prediction.</Card.Title>
              <Card.Description>Write the thesis, define the risk, then decide.</Card.Description>
            </div>
            <Button onPress={() => onNavigate("/test/moment")}>Open decision journal</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (id === "sanctuary") {
    return (
      <motion.div {...reveal(0)} className="md:col-span-8">
        <Card className="h-full" variant="secondary">
          <Tabs className="w-full" variant="secondary">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Sanctuary collections">
                <Tabs.Tab id="sound">
                  Sound
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="movement">
                  Movement
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="rituals">
                  Rituals
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel className="pt-5" id="sound">
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-2xl">
                  <Image
                    fill
                    alt="Vinyl record player"
                    className="object-cover"
                    sizes="180px"
                    src="https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=600&q=86"
                  />
                </div>
                <div className="flex flex-col items-start justify-center">
                  <Chip color="accent" variant="soft">
                    Now playing
                  </Chip>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    A room shaped by sound
                  </h3>
                  <p className="text-muted mt-2 max-w-lg text-sm leading-6">
                    Ambient works, late-night records, and playlists kept for the atmosphere they
                    leave behind.
                  </p>
                  <Button className="mt-5" size="sm" onPress={() => onNavigate("/test/moment")}>
                    Browse soundtrack
                  </Button>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel className="pt-5" id="movement">
              <Card variant="transparent">
                <Card.Title>Training as repetition</Card.Title>
                <Card.Description>
                  Sessions, recovery notes, and slow improvements recorded over time.
                </Card.Description>
              </Card>
            </Tabs.Panel>
            <Tabs.Panel className="pt-5" id="rituals">
              <Card variant="transparent">
                <Card.Title>Small systems for quieter days</Card.Title>
                <Card.Description>
                  Reading, walking, listening, and the daily practices that make space.
                </Card.Description>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </motion.div>
    );
  }

  if (id === "travelogue") {
    const places = [
      {
        title: "North Atlantic",
        place: "Iceland",
        image:
          "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=800&q=86",
      },
      {
        title: "Soft Geometry",
        place: "Copenhagen",
        image:
          "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=86",
      },
      {
        title: "After the Rain",
        place: "Kyoto",
        image:
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=86",
      },
    ];
    return (
      <div className="grid gap-4 md:col-span-8 md:grid-cols-3">
        {places.map((place, index) => (
          <motion.div key={place.title} {...reveal(index)}>
            <Card className="group h-full p-0" role="article">
              <div className="relative min-h-48 flex-1 overflow-hidden rounded-2xl">
                <motion.div
                  className="absolute inset-0"
                  whileHover={reduceMotion ? undefined : { scale: 1.035 }}
                  transition={{ duration: 0.24, ease: enterEase }}
                >
                  <Image
                    fill
                    alt={`${place.place} travel study`}
                    className="object-cover"
                    sizes="(max-width: 767px) 90vw, 25vw"
                    src={place.image}
                  />
                </motion.div>
              </div>
              <Card.Header className="p-4 pt-3">
                <Card.Title>{place.title}</Card.Title>
                <Card.Description>{place.place}</Card.Description>
              </Card.Header>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  const projects = [
    {
      label: "Builds",
      description: "Products and open-source work",
      href: "/test/portfolio",
      icon: "lucide:blocks",
      status: "In progress",
    },
    {
      label: "Curations",
      description: "Tools, objects, and references",
      href: "/test/tag",
      icon: "lucide:bookmark",
      status: "Updated",
    },
    {
      label: "Echo",
      description: "Notes and conversations from visitors",
      href: "/test/comment",
      icon: "lucide:message-circle",
      status: "Open",
    },
  ];
  return (
    <div className="grid gap-4 md:col-span-8 md:grid-cols-3">
      {projects.map((project, index) => (
        <motion.div key={project.label} {...reveal(index)}>
          <Card className="h-full" variant={index === 0 ? "tertiary" : "default"}>
            <Card.Header>
              <div className="bg-default mb-4 flex size-10 items-center justify-center rounded-xl">
                <Icon aria-hidden="true" icon={project.icon} className="size-5" />
              </div>
              <Card.Title>{project.label}</Card.Title>
              <Card.Description>{project.description}</Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto justify-between">
              <Chip size="sm" variant="soft">
                {project.status}
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Open ${project.label}`}
                onPress={() => onNavigate(project.href)}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>
      ))}
    </div>
  );
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

  const [activeNavigation, setActiveNavigation] = useState<NavigationId | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const activeItem = navigationItems.find((item) => item.id === activeNavigation);
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
    setIsLoginOpen(false);
    window.setTimeout(() => setIsSignUpOpen(true), 220);
  };

  const switchToLogIn = () => {
    setIsSignUpOpen(false);
    window.setTimeout(() => setIsLoginOpen(true), 220);
  };

  const isNavigationOpen = Boolean(activeItem || isMobileMenuOpen);

  return (
    <>
      <AnimatePresence>
        {isNavigationOpen && (
          <motion.button
            key="navigation-backdrop"
            type="button"
            tabIndex={-1}
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(14px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: enterEase }}
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
        className="bg-background/88 absolute top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 overflow-hidden rounded-2xl shadow-[0_18px_56px_rgba(0,0,0,0.14)] backdrop-blur-2xl backdrop-saturate-150"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                layout: { type: "spring", stiffness: 260, damping: 32, mass: 0.85 },
                duration: 0.3,
                ease: enterEase,
              }
        }
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <nav
          aria-label="Primary navigation"
          className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-4"
        >
          <motion.div
            className="justify-self-start"
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
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
          <div className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => {
              const isActive = activeNavigation === item.id;
              const isCurrentLocked = isActive && isLocked;
              return (
                <motion.div
                  key={item.id}
                  className="relative"
                  onHoverStart={() => previewNavigation(item.id)}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navigation-active"
                      className="bg-default absolute inset-0 rounded-xl"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 38 }
                      }
                    />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-expanded={isActive}
                    aria-controls="odyssey-mega-navigation"
                    className="text-muted data-[hovered=true]:text-foreground relative h-10 min-w-0 rounded-xl bg-transparent px-3.5 text-sm font-medium data-[hovered=true]:bg-transparent"
                    onFocus={(event) => {
                      lastTriggerRef.current = event.currentTarget as HTMLElement;
                      previewNavigation(item.id);
                    }}
                    onPress={() => toggleNavigation(item.id)}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {item.label}
                      {isCurrentLocked && (
                        <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                      )}
                    </span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 justify-self-end">
            <motion.div whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
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
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
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
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
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
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
                      transition={{ duration: 0.12, ease: enterEase }}
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
                onPress={() => setIsLoginOpen(true)}
              >
                Sign in
              </Button>
            )}

            <motion.div className="md:hidden" whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
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
                      reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }
                    }
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.8 }}
                    transition={{ duration: 0.12, ease: enterEase }}
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
              className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto"
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }
              }
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: reduceMotion ? 0 : 0.42, ease: enterEase }}
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
                      <div className="grid gap-1">
                        {navigationItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: reduceMotion ? 0 : index * 0.045 }}
                          >
                            <Button
                              fullWidth
                              variant="ghost"
                              className="h-auto justify-between px-2 py-3 text-left"
                              onPress={() => setActiveNavigation(item.id)}
                            >
                              <span>
                                <span className="block text-base font-semibold">{item.label}</span>
                                <span className="text-muted mt-0.5 block text-xs font-normal">
                                  {item.eyebrow}
                                </span>
                              </span>
                              <Icon
                                aria-hidden="true"
                                icon="lucide:arrow-right"
                                className="size-4"
                              />
                            </Button>
                          </motion.div>
                        ))}
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
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(8px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(5px)" }
                      }
                      transition={{
                        delay: reduceMotion ? 0 : 0.06,
                        duration: reduceMotion ? 0 : 0.15,
                        ease: enterEase,
                      }}
                    >
                      <motion.div
                        className="flex flex-col items-start md:col-span-4"
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: reduceMotion ? 0 : 0.04,
                          duration: 0.22,
                          ease: enterEase,
                        }}
                      >
                        <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
                          {activeItem.eyebrow}
                        </p>
                        <h2 className="mt-4 max-w-[10ch] text-[clamp(2.5rem,4.5vw,5rem)] leading-[0.94] font-semibold tracking-[-0.055em]">
                          {activeItem.title}
                        </h2>
                        <p className="text-muted mt-5 max-w-md text-sm leading-6 sm:text-base sm:leading-7">
                          {activeItem.description}
                        </p>
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
        onOpenChange={setIsSignUpOpen}
        onSwitchToLogIn={switchToLogIn}
      />
      <LogIn isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} onSwitchToSignUp={switchToSignUp} />
    </>
  );
};
