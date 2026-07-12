"use client";

import Image from "next/image";
import { Button, Card, Chip, Surface, Typography, cn, ProgressBar } from "@heroui/react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { MusicDashboard } from "@/components/music/music-dashboard";

const introHeroImage = "/odyssey-hero.png";

// Premium ease-out easing curve and motion-enhanced Typography component
const enterEase = [0.23, 1, 0.32, 1] as const;
const MotionTypography = motion.create(Typography);

const chapters = [
  { id: "odyssey", label: "Odyssey" },
  { id: "chronicle", label: "Chronicle" },
  { id: "daily", label: "Orbit" }, // Aligned with navbar state ID and Orbit label
  { id: "travelogue", label: "Travelogue" },
] as const;

type PanelProps = {
  reducedMotion: boolean;
};

const worldSignals = [
  { place: "Reykjavík", detail: "64°08′N", time: "19:42" },
  { place: "Shanghai", detail: "Market close", time: "23:42" },
  { place: "Kyoto", detail: "Light rain", time: "00:42" },
  { place: "London", detail: "Field note", time: "16:42" },
] as const;

const archiveSignals = [
  { label: "Now playing", value: "An Ending (Ascent)" },
  { label: "Reading", value: "The Poetics of Space" },
  { label: "Watching", value: "A long horizon" },
  { label: "Remembering", value: "North Atlantic light" },
] as const;

function WorldTicker({ reducedMotion }: { reducedMotion: boolean }) {
  const items = [
    ...worldSignals.map((item) => ({ label: item.place, value: `${item.detail} · ${item.time}` })),
    ...archiveSignals,
  ];
  return (
    <motion.div
      aria-hidden="true"
      className="flex w-max gap-3 pr-3"
      animate={reducedMotion ? undefined : { x: [0, "-50%"] }}
      transition={
        reducedMotion
          ? undefined
          : { duration: 32, ease: "linear", repeat: Infinity, repeatType: "loop" }
      }
    >
      {[...items, ...items].map((item, index) => (
        <Card
          key={`${item.label}-${index}`}
          variant="transparent"
          className="bg-background/58 w-60 shrink-0 rounded-2xl px-4 py-3 shadow-none backdrop-blur-xl"
        >
          <Card.Content className="gap-1 p-0">
            <Typography color="muted" type="body-xs">
              {item.label}
            </Typography>
            <Typography type="body-sm" weight="semibold" className="truncate">
              {item.value}
            </Typography>
          </Card.Content>
        </Card>
      ))}
    </motion.div>
  );
}

function IntroPanel({ onEnter, reducedMotion }: PanelProps & { onEnter: () => void }) {
  return (
    <Surface
      id="odyssey"
      aria-labelledby="odyssey-title"
      role="region"
      variant="transparent"
      className="bg-background relative flex h-full w-screen shrink-0 items-center overflow-hidden pt-16"
    >
      <div
        aria-hidden="true"
        className="bg-accent/8 pointer-events-none absolute top-1/3 left-1/3 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 px-5 pb-28 sm:px-8 md:grid-cols-12 md:gap-12 lg:px-12">
        <motion.div
          className="flex flex-col items-start md:col-span-5"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Chip size="sm" variant="tertiary">
            Odyssey · 31°14′N
          </Chip>

          <Typography
            id="odyssey-title"
            type="h1"
            weight="semibold"
            className="text-foreground mt-6 max-w-[9ch] text-[clamp(3.5rem,6.4vw,6.75rem)] leading-[0.9] tracking-[-0.07em]"
          >
            The world moves. <span className="text-accent">I stay.</span>
          </Typography>

          <Typography
            color="muted"
            type="body"
            className="mt-6 max-w-md text-base leading-7 sm:text-lg"
          >
            A fixed point for the places, ideas, markets, music, and moments that keep passing by.
          </Typography>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button className="whitespace-nowrap" size="lg" onPress={onEnter}>
              Enter archive
            </Button>
            <Typography color="muted" type="body-xs">
              Scroll to move through the archive
            </Typography>
          </div>
        </motion.div>

        <motion.div
          className="hidden md:col-span-7 md:block"
          initial={reducedMotion ? false : { opacity: 0, x: 30 }}
          animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="relative h-[68dvh] min-h-[34rem] overflow-hidden rounded-[32px] p-0">
            <Image
              fill
              priority
              alt="A quiet desk with a notebook, headphones, and a rain-lit night window"
              className="object-cover object-center"
              draggable={false}
              sizes="(max-width: 767px) 0vw, 58vw"
              src={introHeroImage}
            />
            <div
              aria-hidden="true"
              className="from-background/65 pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
            />
            <Card
              className="bg-background/66 absolute right-5 bottom-5 left-5 shadow-none backdrop-blur-xl"
              variant="transparent"
            >
              <Card.Content className="flex-row items-center justify-between gap-6 p-0">
                <div>
                  <Typography color="muted" type="body-xs">
                    Current coordinate
                  </Typography>
                  <Typography type="body-sm" weight="semibold" className="mt-1">
                    Here, for a little while
                  </Typography>
                </div>
                <Chip color="accent" variant="soft">
                  Staying
                </Chip>
              </Card.Content>
            </Card>
          </Card>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-5 overflow-hidden px-5 sm:px-8 lg:px-12">
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent sm:w-40" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent sm:w-40" />
        <WorldTicker reducedMotion={reducedMotion} />
      </div>
    </Surface>
  );
}

function ChroniclePanel() {
  return (
    <Surface
      id="chronicle"
      aria-labelledby="chronicle-title"
      role="region"
      variant="transparent"
      className="bg-background relative flex h-full w-screen shrink-0 items-center overflow-hidden pt-16"
    >
      <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-1 content-center gap-6 px-5 py-6 sm:px-8 md:grid-cols-12 md:items-center md:gap-10 md:px-12 md:py-10">
        <div className="flex flex-col items-start md:col-span-5 md:pr-6">
          <Typography color="muted" type="body-sm" weight="medium">
            Chronicle
          </Typography>
          <Typography
            id="chronicle-title"
            type="h2"
            weight="semibold"
            className="mt-3 max-w-[9ch] text-[clamp(2.75rem,5.4vw,5.75rem)] leading-[0.95] tracking-[-0.055em]"
          >
            Words worth keeping.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-md leading-7">
            Notes on design systems, accessible engineering, and the decisions that survive a
            finished build.
          </Typography>

          <article className="mt-8 max-w-md">
            <Typography type="h5" weight="semibold">
              Symbiosis: The Resilience of Outposts
            </Typography>
            <div className="text-muted mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span>Design systems</span>
              <span>5 min read</span>
            </div>
          </article>
        </div>

        <Card
          aria-label="Featured Chronicle essay image"
          role="img"
          className="relative h-[34dvh] min-h-52 overflow-hidden p-0 md:col-span-7 md:h-[66dvh] md:min-h-[32rem]"
        >
          <Image
            fill
            alt="A dark forest opening onto a sky filled with stars"
            className="object-cover"
            draggable={false}
            sizes="(max-width: 767px) 90vw, 58vw"
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=88"
          />
        </Card>
      </div>
    </Surface>
  );
}

// Unified "OrbitPanel" merging the user's active life pillars (Music, Stocks, Fitness, Code)
function OrbitPanel() {
  const router = useRouter();

  return (
    <Surface
      id="daily"
      aria-labelledby="orbit-title"
      role="region"
      variant="secondary"
      className="relative flex h-full w-screen shrink-0 items-center overflow-hidden pt-16"
    >
      <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-1 content-center gap-8 px-5 py-6 sm:px-8 md:grid-cols-12 md:items-center md:gap-10 md:px-12 md:py-10">
        <div className="flex flex-col items-start md:col-span-5 md:pr-6">
          <Typography color="muted" type="body-sm" weight="medium">
            Orbit
          </Typography>
          <Typography
            id="orbit-title"
            type="h2"
            weight="semibold"
            className="mt-3 max-w-[10ch] text-[clamp(2.75rem,5.4vw,5.75rem)] leading-[0.95] tracking-[-0.055em]"
          >
            How I spend the hours.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-md leading-7">
            A continuous loop of quiet listening, market calculations, physical repetitions, and
            abstract code construction that calibrate each day.
          </Typography>

          <Button
            className="bg-accent text-accent-foreground mt-8 rounded-xl whitespace-nowrap"
            size="lg"
            onPress={() => router.push("/test/oracle")}
          >
            Open Orbit Oracle
            <Icon icon="lucide:sparkles" className="ml-1.5 size-4" />
          </Button>
        </div>

        {/* 2x2 Interactive Command Cockpit Dashboard */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-7 lg:gap-6">
          {/* Pillar 1: Soul Soothe */}
          <Card
            className="group bg-background/50 border-default/20 hover:border-default/30 relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-950/20"
            variant="default"
          >
            <div>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                  <Icon aria-hidden="true" icon="lucide:music" className="size-5" />
                </div>
                <div className="bg-background/60 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-muted tracking-wide">Now playing</span>
                </div>
              </div>
              <div className="pt-3">
                <h3 className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                  Soul Soothe
                </h3>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  Ambient works & analog vinyl rooms compiled for focused flow.
                </p>
              </div>
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
            </div>
            <div className="border-default/30 text-muted mt-5 flex items-center justify-between border-t pt-3 text-[11px] font-medium tracking-tight">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
                An Ending (Ascent)
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-7 rounded-lg transition-transform duration-200 group-hover:translate-x-0.5"
                aria-label="Open Soul Soothe"
                onPress={() => router.push("/test/music")}
              >
                <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-3.5" />
              </Button>
            </div>
          </Card>

          {/* Pillar 2: Patience & Wait */}
          <Card
            className="group bg-background/50 border-default/20 hover:border-default/30 relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-950/20"
            variant="default"
          >
            <div>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                  <Icon aria-hidden="true" icon="lucide:trending-up" className="size-5" />
                </div>
                <div className="bg-background/60 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                  </span>
                  <span className="text-muted tracking-wide">Market closed</span>
                </div>
              </div>
              <div className="pt-3">
                <h3 className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                  Patience & Wait
                </h3>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  Macro-theses, asset allocations, and financial decision logs.
                </p>
              </div>
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
            </div>
            <div className="border-default/30 text-muted mt-5 flex items-center gap-1.5 border-t pt-3 text-[11px] font-medium tracking-tight">
              <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
              Long posture active
            </div>
          </Card>

          {/* Pillar 3: Sweat It Out */}
          <Card
            className="group bg-background/50 border-default/20 hover:border-default/30 relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-950/20"
            variant="default"
          >
            <div>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                  <Icon aria-hidden="true" icon="lucide:dumbbell" className="size-5" />
                </div>
                <div className="bg-background/60 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  </span>
                  <span className="text-muted tracking-wide">Calibrating</span>
                </div>
              </div>
              <div className="pt-3">
                <h3 className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                  Sweat It Out
                </h3>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  Biomechanical sets, power tracking, and active recovery logs.
                </p>
              </div>
              <div className="bg-default/30 border-default/20 mt-4 flex items-center justify-between gap-1 rounded-xl border px-3.5 py-1.5">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">M</span>
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <Icon icon="lucide:check" className="size-2" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">T</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">W</span>
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <Icon icon="lucide:check" className="size-2" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">T</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">F</span>
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/25">
                    <Icon icon="lucide:check" className="size-2" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">S</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted text-[8px] font-bold uppercase">S</span>
                  <div className="bg-default/50 text-muted flex size-5 items-center justify-center rounded-full">
                    <span className="text-[10px] font-bold">·</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-default/30 text-muted mt-5 flex items-center gap-1.5 border-t pt-3 text-[11px] font-medium tracking-tight">
              <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
              Cold plunge recovery
            </div>
          </Card>

          {/* Pillar 4: Code & Build */}
          <Card
            className="group bg-background/50 border-default/20 hover:border-default/30 relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-950/20"
            variant="default"
          >
            <div>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="bg-default flex size-10 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                  <Icon aria-hidden="true" icon="lucide:terminal" className="size-5" />
                </div>
                <div className="bg-background/60 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  </span>
                  <span className="text-muted tracking-wide">Compiling</span>
                </div>
              </div>
              <div className="pt-3">
                <h3 className="group-hover:text-accent text-sm font-semibold transition-colors duration-200">
                  Code & Build
                </h3>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  Translating abstract logic into functional, accessible systems.
                </p>
              </div>
              <div className="border-default/20 mt-4 rounded-xl border bg-zinc-950/90 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-400 shadow-inner dark:bg-black/40">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-500">✓</span>
                  <span className="font-semibold text-zinc-200">compile successful</span>
                </div>
                <div className="mt-0.5 text-[9px] text-zinc-500">
                  Compiled in 42ms · 165 modules
                </div>
              </div>
            </div>
            <div className="border-default/30 text-muted mt-5 flex items-center gap-1.5 border-t pt-3 text-[11px] font-medium tracking-tight">
              <Icon icon="lucide:arrow-right" className="size-3 opacity-60" />
              Next.js hydration audits
            </div>
          </Card>
        </div>
      </div>
    </Surface>
  );
}

function TraveloguePanel() {
  return (
    <Surface
      id="travelogue"
      aria-labelledby="travelogue-title"
      role="region"
      variant="transparent"
      className="bg-background relative flex h-full w-screen shrink-0 items-end overflow-hidden pt-16"
    >
      <Image
        fill
        alt="A remote Icelandic landscape beneath a night sky"
        className="object-cover"
        draggable={false}
        sizes="100vw"
        src="https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=2000&q=88"
      />
      <div
        aria-hidden="true"
        className="from-background via-background/55 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-background via-background/15 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t"
      />

      <div className="relative mx-auto flex w-full max-w-[1400px] px-5 py-10 sm:px-8 md:px-12 md:py-16">
        <div className="max-w-3xl">
          <Typography color="muted" type="body-sm" weight="medium">
            Travelogue
          </Typography>
          <Typography
            id="travelogue-title"
            type="h2"
            weight="semibold"
            className="mt-3 max-w-[11ch] text-[clamp(3rem,6vw,6.5rem)] leading-[0.92] tracking-[-0.06em]"
          >
            Places that changed the pace.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-lg leading-7">
            Architecture, weather, and small moments collected from journeys across Iceland, Europe,
            and Asia.
          </Typography>
        </div>
      </div>
    </Surface>
  );
}

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const reducedMotion = Boolean(shouldReduceMotion);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const xTranslation = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
  const x = useSpring(xTranslation, {
    stiffness: 80,
    damping: 26,
    restDelta: 0.001,
  });

  const scrollToPanel = (index: number) => {
    if (reducedMotion) {
      document.getElementById(chapters[index].id)?.scrollIntoView({ block: "start" });
      return;
    }

    const target = targetRef.current;
    if (!target) return;

    const horizontalRange = target.offsetHeight - window.innerHeight;
    const panelProgress = index / (chapters.length - 1);

    window.scrollTo({
      top: target.offsetTop + horizontalRange * panelProgress,
      behavior: "smooth",
    });
  };

  return (
    <Surface variant="transparent" className="relative h-auto w-full">
      {/* 1. Horizontal Scroll Section */}
      <div
        ref={targetRef}
        className={cn("relative w-full", reducedMotion ? "h-auto" : "h-[400vh]")}
      >
        <div
          className={cn(
            "top-0 w-full overflow-hidden",
            reducedMotion ? "relative h-auto" : "sticky h-dvh"
          )}
        >
          {!reducedMotion && (
            <motion.div
              aria-hidden="true"
              className="bg-accent fixed inset-x-0 top-0 z-50 h-px origin-left"
              style={{ scaleX: scrollYProgress }}
            />
          )}

          <motion.div
            className={cn(reducedMotion ? "flex w-full flex-col" : "flex h-full w-[400vw]")}
            style={{ x: reducedMotion ? 0 : x }}
          >
            <IntroPanel reducedMotion={reducedMotion} onEnter={() => scrollToPanel(1)} />
            <ChroniclePanel />
            <OrbitPanel />
            <TraveloguePanel />
          </motion.div>
        </div>
      </div>

      {/* 2. Post-Scroll Vertical Content Section (MusicDashboard) */}
      <div className="bg-background relative w-full border-t border-default/15 px-5 py-20 sm:px-8 md:px-12 xl:px-16 2xl:px-24">
        <div className="mx-auto w-full max-w-[1400px] flex flex-col gap-8">
          <div className="flex flex-col items-start mb-4">
            <Chip size="sm" variant="soft" color="accent" className="font-semibold uppercase tracking-wider">
              Acoustic Jukebox
            </Chip>
            <MotionTypography
              type="h2"
              weight="semibold"
              align="start"
              className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              initial={reducedMotion ? false : { opacity: 0, y: 16, filter: "blur(4px)" }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: enterEase }}
            >
              Space Between the Notes
            </MotionTypography>
            <MotionTypography
              type="body"
              color="muted"
              align="start"
              className="mt-2 max-w-xl text-sm"
              initial={reducedMotion ? false : { opacity: 0, y: 12, filter: "blur(2px)" }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: enterEase }}
            >
              Clear the mind. Press play.
            </MotionTypography>
          </div>
          
          {/* Mount our beautiful MusicDashboard layout! */}
          <div className="w-full">
            <MusicDashboard />
          </div>
        </div>
      </div>
    </Surface>
  );
}
