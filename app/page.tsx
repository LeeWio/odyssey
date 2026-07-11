"use client";

import Image from "next/image";
import { Button, Card, Chip, Surface, Typography, cn } from "@heroui/react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

const introHeroImage = "/odyssey-hero.png";

const chapters = [
  { id: "odyssey", label: "Odyssey" },
  { id: "chronicle", label: "Chronicle" },
  { id: "ledger", label: "Ledger" },
  { id: "sanctuary", label: "Sanctuary" },
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

function LedgerPanel() {
  return (
    <Surface
      id="ledger"
      aria-labelledby="ledger-title"
      role="region"
      variant="secondary"
      className="relative flex h-full w-screen shrink-0 items-center overflow-hidden pt-16"
    >
      <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-1 content-center gap-8 px-5 py-6 sm:px-8 md:grid-cols-12 md:items-center md:gap-10 md:px-12 md:py-10">
        <div className="md:col-span-7 lg:col-span-8">
          <Typography
            id="ledger-title"
            type="h2"
            weight="semibold"
            className="max-w-[10ch] text-[clamp(3rem,6.2vw,6.75rem)] leading-[0.92] tracking-[-0.065em]"
          >
            A ledger for the <span className="text-accent">long horizon.</span>
          </Typography>
          <Typography color="muted" type="body" className="mt-6 max-w-lg leading-7">
            A private record of conviction, patience, and what each decision taught me over time.
          </Typography>
        </div>

        <Card className="md:col-span-5 lg:col-span-4" variant="default">
          <Card.Header>
            <Card.Title>Investment posture</Card.Title>
            <Card.Description>Process before prediction.</Card.Description>
          </Card.Header>
          <Card.Content className="mt-6 gap-6">
            <div>
              <Typography color="muted" type="body-xs">
                Timeframe
              </Typography>
              <Typography className="mt-1" type="h5" weight="semibold">
                Years, not weeks
              </Typography>
            </div>
            <div>
              <Typography color="muted" type="body-xs">
                Measure
              </Typography>
              <Typography className="mt-1" type="h5" weight="semibold">
                Conviction, not motion
              </Typography>
            </div>
            <div>
              <Typography color="muted" type="body-xs">
                Practice
              </Typography>
              <Typography className="mt-1" type="h5" weight="semibold">
                Write before acting
              </Typography>
            </div>
          </Card.Content>
        </Card>
      </div>
    </Surface>
  );
}

function SanctuaryPanel() {
  return (
    <Surface
      id="sanctuary"
      aria-labelledby="sanctuary-title"
      role="region"
      variant="transparent"
      className="bg-background relative flex h-full w-screen shrink-0 items-center overflow-hidden pt-16"
    >
      <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-1 content-center gap-6 px-5 py-6 sm:px-8 md:grid-cols-12 md:items-center md:gap-12 md:px-12 md:py-10">
        <Card className="relative h-[36dvh] min-h-56 overflow-hidden p-0 md:col-span-7 md:h-[66dvh] md:min-h-[32rem]">
          <Image
            fill
            alt="A musician working in a softly lit recording studio"
            className="object-cover"
            draggable={false}
            sizes="(max-width: 767px) 90vw, 58vw"
            src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=88"
          />
        </Card>

        <div className="flex flex-col items-start md:col-span-5 md:pl-2">
          <Typography
            id="sanctuary-title"
            type="h2"
            weight="semibold"
            className="max-w-[9ch] text-[clamp(2.75rem,5.25vw,5.5rem)] leading-[0.95] tracking-[-0.055em]"
          >
            A room shaped by sound.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-md leading-7">
            Slow soundtracks, ambient rooms, and late-night records kept for the atmosphere they
            leave behind.
          </Typography>
          <Typography type="h5" weight="medium" className="text-accent mt-8 max-w-sm leading-7">
            Music earns its place by changing the room.
          </Typography>
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

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const xTranslation = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);
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
    <Surface variant="transparent" className="relative h-screen w-full">
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
            className={cn(reducedMotion ? "flex w-full flex-col" : "flex h-full w-[500vw]")}
            style={{ x: reducedMotion ? 0 : x }}
          >
            <IntroPanel reducedMotion={reducedMotion} onEnter={() => scrollToPanel(1)} />
            <ChroniclePanel />
            <LedgerPanel />
            <SanctuaryPanel />
            <TraveloguePanel />
          </motion.div>
        </div>
      </div>
    </Surface>
  );
}
