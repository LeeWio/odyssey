"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { HelloApple } from "@/components/home/hello-apple";
import {
  MotionCard,
  MotionChip,
  MotionItemCard,
  MotionKPI,
  MotionSurface,
  MotionTypography,
} from "@/components/ui";
import { MediaPlayButton } from "@/features/media/components/media-play-button";
import type { MediaItem } from "@/features/media/types";
import { useGetMarketIndexBySymbolQuery } from "@/lib/features/market";
import { useState, useEffect } from "react";
import { ItemCard, KPI, TrendChip, EmojiReactionButton, Rating } from "@heroui-pro/react";
import {
  Card,
  Chip,
  Skeleton,
  Typography,
  Button,
  Popover,
  TextArea,
  Description,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted } from "@mantine/hooks";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import GuestbookBoard from "@/components/corners/guestbook-board";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { usePostGuestbookEntryMutation } from "@/lib/features/comment";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { PencilToSquare } from "@gravity-ui/icons";
import GradientText from "@/components/ui/gradient-text";

const easeOut = [0.22, 1, 0.36, 1] as const;

const mapSparkline = (data?: number[]) => {
  if (!data || data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  return data.map((value) => ({
    value: range === 0 ? 50 : ((value - min) / range) * 100,
  }));
};

const mockSong: MediaItem = {
  id: "1",
  title: "老歌",
  description: "安泊猜想",
  cover: "/IMG_5332.JPG",
  type: "track",
  tracks: [
    {
      id: "track-1",
      title: "老歌",
      artist: "安泊猜想",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
  ],
};

const fieldNotes = [
  {
    index: "01",
    time: "07:18",
    title: "The room wakes slowly.",
    body: "Before the notifications arrive, there is coffee, a familiar record, and a few quiet minutes to decide what deserves attention.",
    accent: "from-amber-400/20 via-orange-300/5 to-transparent",
  },
  {
    index: "02",
    time: "11:42",
    title: "A system begins to hold.",
    body: "The best part of building is often invisible: one less exception, one clearer boundary, one small decision that makes tomorrow easier.",
    accent: "from-sky-400/18 via-indigo-300/5 to-transparent",
  },
  {
    index: "03",
    time: "16:07",
    title: "The numbers keep breathing.",
    body: "Markets move, but observation can stay still. A chart becomes more useful when it is allowed to be context instead of instruction.",
    accent: "from-emerald-400/18 via-teal-300/5 to-transparent",
  },
  {
    index: "04",
    time: "23:26",
    title: "Leave something unfinished.",
    body: "A question in the margin is not a loose end. Sometimes it is simply where the next day knows to begin.",
    accent: "from-violet-400/18 via-fuchsia-300/5 to-transparent",
  },
] as const;

export default function Home() {
  const mounted = useMounted();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { data: nasdaqData, isLoading: isNasdaqLoading } = useGetMarketIndexBySymbolQuery(
    { symbol: ".ixic", period: "1D" },
    { pollingInterval: 300000, refetchOnFocus: true }
  );
  const isPositive = nasdaqData ? nasdaqData.changePct >= 0 : false;

  const [isMessageInputOpen, setIsMessageInputOpen] = useState(false);
  const [isGuestbookPopoverOpen, setIsGuestbookPopoverOpen] = useState(false);

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // local states for rating and reactions
  const [rating, setRating] = useState<number>(0);
  const [reactions, setReactions] = useState<Record<string, { count: number; selected: boolean }>>({
    "❤️": { count: 42, selected: false },
    "🎉": { count: 18, selected: false },
    "👍": { count: 24, selected: false },
    "🤯": { count: 15, selected: false },
    "🔥": { count: 31, selected: false },
  });

  // Hydrate states from localStorage safely
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedRating = localStorage.getItem("odyssey-rating");
    const savedReactions = localStorage.getItem("odyssey-reactions");

    if (savedRating || savedReactions) {
      setTimeout(() => {
        if (savedRating) {
          setRating(Number(savedRating));
        }

        if (savedReactions) {
          try {
            const parsed = JSON.parse(savedReactions) as Record<string, boolean>;
            setReactions((current) => {
              const updated = { ...current };
              Object.keys(parsed).forEach((emoji) => {
                if (updated[emoji]) {
                  updated[emoji] = {
                    count: parsed[emoji] ? updated[emoji].count + 1 : updated[emoji].count,
                    selected: parsed[emoji],
                  };
                }
              });
              return updated;
            });
          } catch (err) {
            console.error("Failed to parse reactions from localStorage", err);
          }
        }
      }, 0);
    }
  }, []);

  const handleRatingChange = (newValue: number) => {
    setRating(newValue);
    localStorage.setItem("odyssey-rating", String(newValue));
  };

  const toggleReaction = (emoji: string) => {
    setReactions((current) => {
      const entry = current[emoji];
      if (!entry) return current;

      const selected = !entry.selected;
      const count = selected ? entry.count + 1 : entry.count - 1;

      const updated = {
        ...current,
        [emoji]: { count, selected },
      };

      // persist selected keys to localStorage
      const selectionMap: Record<string, boolean> = {};
      Object.entries(updated).forEach(([key, value]) => {
        if (value.selected) selectionMap[key] = true;
      });
      localStorage.setItem("odyssey-reactions", JSON.stringify(selectionMap));

      return updated;
    });
  };

  const reveal = (delay = 0, distance = 18) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: shouldReduceMotion ? 0 : 0.7, delay, ease: easeOut },
  });

  const revealInView = (delay = 0, distance = 20) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: shouldReduceMotion ? 0 : 0.65, delay, ease: easeOut },
  });

  return (
    <div className="bg-background w-full overflow-x-clip">
      <section
        aria-labelledby="home-hero-title"
        className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col items-center justify-center px-6 pt-24 pb-16 text-center sm:px-10"
      >
        <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
          A personal field journal
        </MotionChip>

        <div className="mt-1 w-full max-w-3xl" aria-hidden="true">
          <HelloApple />
        </div>

        <MotionTypography
          id="home-hero-title"
          type="h1"
          weight="bold"
          className="max-w-3xl text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.055em]"
          {...reveal(0.18)}
        >
          A living notebook, kept in motion.
        </MotionTypography>

        <MotionTypography color="muted" type="body" className="mt-4 max-w-xl" {...reveal(0.26, 14)}>
          Software, markets, music, and the habits that shape the work.
        </MotionTypography>

        <MotionSurface
          variant="transparent"
          className="mt-9 flex max-w-lg flex-col items-center"
          {...reveal(0.34, 12)}
        >
          <Typography
            aria-hidden="true"
            className="font-mono tracking-[0.18em] uppercase"
            color="muted"
            type="body-xs"
          >
            Prologue · 01
          </Typography>
          <span className="bg-separator my-4 h-12 w-px" aria-hidden="true" />
          <Typography align="center" color="muted" type="body-sm" className="max-w-md italic">
            Begin with what is close at hand. A song still playing, a market moving, a thought not
            yet finished.
          </Typography>
          <motion.span
            aria-hidden="true"
            className="bg-foreground/55 mt-6 block size-1.5 rounded-full"
            animate={shouldReduceMotion ? undefined : { opacity: [0.28, 0.9, 0.28], y: [0, 5, 0] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        </MotionSurface>
      </section>

      <section
        aria-labelledby="field-notes-title"
        className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-20"
      >
        <div className="lg:sticky lg:top-28 lg:self-start">
          <MotionTypography
            color="muted"
            type="body-xs"
            className="font-mono tracking-[0.18em] uppercase"
            {...revealInView(0, 8)}
          >
            Field notes · one ordinary day
          </MotionTypography>
          <MotionTypography
            id="field-notes-title"
            type="h2"
            weight="bold"
            className="mt-4 max-w-sm text-[clamp(2rem,4vw,3.6rem)] leading-[1.02] tracking-[-0.045em]"
            {...revealInView(0.06, 14)}
          >
            Small moments make the larger story.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body-sm"
            className="mt-5 max-w-sm leading-7"
            {...revealInView(0.12, 12)}
          >
            No grand itinerary. Just a day passing through sound, systems, numbers, and the thoughts
            left on the desk after dark.
          </MotionTypography>
        </div>

        <div className="relative flex flex-col">
          <span
            aria-hidden="true"
            className="bg-separator absolute top-4 bottom-4 left-[1.2rem] w-px sm:left-[1.45rem]"
          />
          {fieldNotes.map((note, index) => (
            <motion.article
              key={note.index}
              className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 pb-12 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6 sm:pb-16"
              {...revealInView(index * 0.04, 24)}
            >
              <div className="relative z-10 flex size-10 items-center justify-center sm:size-12">
                <span className="bg-background border-separator text-muted flex size-8 items-center justify-center rounded-full border font-mono text-[0.65rem] sm:size-9">
                  {note.index}
                </span>
              </div>
              <MotionSurface
                variant="secondary"
                className="group relative min-h-52 overflow-hidden rounded-[2rem] p-7 sm:min-h-60 sm:p-9"
              >
                <motion.span
                  aria-hidden="true"
                  className={`absolute inset-0 bg-linear-to-br ${note.accent}`}
                  initial={false}
                  whileInView={shouldReduceMotion ? undefined : { opacity: [0.45, 0.8] }}
                  viewport={{ once: true, amount: 0.55 }}
                  transition={{ duration: 1.4, ease: easeOut }}
                />
                <div className="relative flex h-full flex-col">
                  <Typography color="muted" type="body-xs" className="font-mono tracking-[0.14em]">
                    {note.time}
                  </Typography>
                  <Typography
                    type="h3"
                    weight="semibold"
                    className="mt-auto max-w-md tracking-[-0.025em]"
                  >
                    {note.title}
                  </Typography>
                  <Typography color="muted" type="body-sm" className="mt-3 max-w-lg leading-6">
                    {note.body}
                  </Typography>
                </div>
              </MotionSurface>
            </motion.article>
          ))}
        </div>
      </section>

      <section
        id="lately"
        aria-labelledby="lately-title"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 sm:px-10 sm:py-32"
      >
        <header className="flex flex-col items-center text-center">
          <MotionChip size="sm" color="default" variant="secondary" {...revealInView(0, 10)}>
            Lately
          </MotionChip>
          <MotionTypography
            id="lately-title"
            align="center"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
            {...revealInView(0.06)}
          >
            What I&apos;ve been up to
          </MotionTypography>
          <MotionTypography
            align="center"
            type="body"
            color="muted"
            className="mt-3"
            {...revealInView(0.12, 14)}
          >
            Listening, investing, building, and training.
          </MotionTypography>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <MotionCard
            variant="secondary"
            className="group relative min-h-[34rem] overflow-hidden lg:col-span-7"
            {...revealInView(0.08, 28)}
          >
            <div className="absolute inset-0">
              <Image
                alt=""
                aria-hidden="true"
                className="scale-105 object-cover opacity-35 blur-2xl saturate-75"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                src="/IMG_5332.JPG"
              />
              <div className="from-background/10 via-surface-secondary/75 to-surface-secondary absolute inset-0 bg-linear-to-b" />
            </div>

            <Card.Header className="relative flex-row items-start justify-between">
              <Chip size="sm" variant="soft">
                Listening
              </Chip>
              <Typography
                aria-hidden="true"
                color="muted"
                type="body-xs"
                className="font-mono tracking-[0.14em]"
              >
                SIDE A · 01
              </Typography>
            </Card.Header>

            <Card.Content className="relative mt-auto gap-7">
              <motion.div
                className="relative aspect-square w-full max-w-64 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-black/30 sm:max-w-72"
                whileInView={shouldReduceMotion ? undefined : { rotate: [-1.5, 0] }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.2, ease: easeOut }}
              >
                <Image
                  alt="Album cover for 老歌 by 安泊猜想"
                  className="object-cover"
                  fill
                  sizes="288px"
                  src="/IMG_5332.JPG"
                />
              </motion.div>

              <div className="max-w-lg">
                <Typography type="h3" weight="semibold" className="tracking-[-0.03em]">
                  One song, kept close.
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-2 leading-6">
                  Music that stayed after the rest of the queue moved on.
                </Typography>
              </div>
            </Card.Content>

            <Card.Footer className="relative mt-2">
              <MotionItemCard className="w-full" variant="transparent">
                <ItemCard.Content>
                  <ItemCard.Title>老歌</ItemCard.Title>
                  <ItemCard.Description>安泊猜想</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <MediaPlayButton media={mockSong} shuffle size="sm" variant="tertiary" />
                </ItemCard.Action>
              </MotionItemCard>
            </Card.Footer>
          </MotionCard>

          <MotionCard
            variant="transparent"
            className="border-separator relative min-h-[34rem] border px-7 py-8 lg:col-span-5 lg:px-8"
            {...revealInView(0.14, 28)}
          >
            <Card.Header className="p-0">
              <Typography color="muted" type="body-xs" className="font-mono tracking-[0.14em]">
                FIELD SIGNAL · LIVE
              </Typography>
              <Card.Title className="mt-6 text-2xl tracking-[-0.03em]">
                Watching without rushing.
              </Card.Title>
              <Card.Description className="mt-2 max-w-sm leading-6">
                A small market signal, observed in context rather than isolation.
              </Card.Description>
            </Card.Header>

            <Card.Content className="mt-auto p-0 pt-12">
              {!mounted || (isNasdaqLoading && !nasdaqData) ? (
                <div
                  aria-label="Loading NASDAQ market data"
                  aria-live="polite"
                  className="grid min-h-28 grid-cols-2 items-end gap-6"
                >
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : nasdaqData ? (
                <MotionKPI variant="transparent">
                  <KPI.Header>
                    <Icon aria-hidden="true" icon="gravity-ui:target-dart" />
                    <KPI.Title>NASDAQ</KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                    <div className="flex flex-col gap-2">
                      <KPI.Value maximumFractionDigits={2} value={nasdaqData.current} />
                      <TrendChip trend={isPositive ? "up" : "down"} variant="tertiary">
                        <TrendChip.Indicator>
                          {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        </TrendChip.Indicator>
                        {Math.abs(nasdaqData.changePct).toFixed(2)}%
                        <TrendChip.Suffix>today</TrendChip.Suffix>
                      </TrendChip>
                    </div>
                    <KPI.Chart
                      color="var(--color-accent)"
                      data={mapSparkline(nasdaqData.sparkline)}
                      height={60}
                      strokeWidth={1.5}
                    />
                  </KPI.Content>
                </MotionKPI>
              ) : (
                <div className="flex min-h-28 items-center gap-3" role="status">
                  <span className="bg-default-100 text-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                    <Icon aria-hidden="true" icon="gravity-ui:chart-line" />
                  </span>
                  <div>
                    <Typography type="body-sm" weight="semibold">
                      Market signal unavailable
                    </Typography>
                    <Typography color="muted" type="body-xs">
                      The latest NASDAQ reading could not be loaded.
                    </Typography>
                  </div>
                </div>
              )}
            </Card.Content>
          </MotionCard>

          <MotionCard
            variant="tertiary"
            className="relative min-h-[30rem] overflow-hidden lg:col-span-12 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12 lg:p-12"
            {...revealInView(0.18, 24)}
          >
            <span
              aria-hidden="true"
              className="bg-accent/8 absolute -top-20 -right-16 size-72 rounded-full blur-3xl"
            />

            {/* Left side: Editorial introduction */}
            <div className="relative flex flex-col gap-5 p-6 lg:p-0">
              <div>
                <Typography
                  type="body-xs"
                  color="muted"
                  className="font-mono tracking-[0.14em] uppercase"
                >
                  Building & training
                </Typography>
                <Card.Title className="mt-4 text-3xl font-bold tracking-[-0.03em]">
                  Practice is part of the archive.
                </Card.Title>
                <Card.Description className="mt-2 max-w-sm text-sm leading-relaxed">
                  Real-time indicators documenting personal progress, deep focus blocks, and active
                  code commitments.
                </Card.Description>
              </div>
              <span className="bg-default-100/50 my-1 h-px w-24" />
              <Typography
                type="body-sm"
                color="muted"
                className="max-w-md text-sm leading-relaxed italic"
              >
                “The unfinished work matters: systems shipped, miles logged, and questions carried
                forward.”
              </Typography>
            </div>

            {/* Right side: Live Telemetry KPIs */}
            <div className="relative grid gap-4 p-6 sm:grid-cols-3 lg:p-0">
              {/* KPI 1: Deep Work focus */}
              <KPI className="bg-background/40 border-default-100/50 rounded-2xl border p-5 shadow-sm">
                <KPI.Header>
                  <KPI.Title className="text-muted/60 font-mono text-[10px] font-bold tracking-wider uppercase">
                    Today&apos;s Focus
                  </KPI.Title>
                </KPI.Header>
                <KPI.Content className="mt-2.5 items-end gap-1">
                  <KPI.Value
                    className="text-foreground font-mono text-2xl leading-none font-black tabular-nums"
                    value={4.8}
                    style="decimal"
                    maximumFractionDigits={1}
                  />
                  <div className="text-muted/60 mt-1 font-mono text-[10px] font-medium">hours</div>
                </KPI.Content>
                <KPI.Progress className="mt-4" value={90} status="success" />
              </KPI>

              {/* KPI 2: Written Chronicles size */}
              <KPI className="bg-background/40 border-default-100/50 rounded-2xl border p-5 shadow-sm">
                <KPI.Header>
                  <KPI.Title className="text-muted/60 font-mono text-[10px] font-bold tracking-wider uppercase">
                    Written Essays
                  </KPI.Title>
                </KPI.Header>
                <KPI.Content className="mt-2.5 items-end gap-1">
                  <KPI.Value
                    className="text-foreground font-mono text-2xl leading-none font-black tabular-nums"
                    value={18.4}
                    style="decimal"
                    maximumFractionDigits={1}
                  />
                  <div className="text-muted/60 mt-1 font-mono text-[10px] font-medium">
                    k words
                  </div>
                </KPI.Content>
                <KPI.Progress className="mt-4" value={85} status="success" />
              </KPI>

              {/* KPI 3: Repository Commits */}
              <KPI className="bg-background/40 border-default-100/50 rounded-2xl border p-5 shadow-sm">
                <KPI.Header>
                  <KPI.Title className="text-muted/60 font-mono text-[10px] font-bold tracking-wider uppercase">
                    Active Commits
                  </KPI.Title>
                </KPI.Header>
                <KPI.Content className="mt-2.5 items-end">
                  <div className="flex w-full flex-col gap-1">
                    <KPI.Value
                      className="text-foreground font-mono text-2xl leading-none font-black tabular-nums"
                      value={452}
                      style="decimal"
                      maximumFractionDigits={0}
                    />
                    <div className="mt-1 flex items-center gap-1">
                      <TrendChip trend="up" variant="tertiary" className="px-1 py-0.5 text-[10px]">
                        12%
                        <TrendChip.Suffix className="ml-0.5 text-[8px]">MoM</TrendChip.Suffix>
                      </TrendChip>
                    </div>
                  </div>
                </KPI.Content>
                <KPI.Progress className="mt-4.5" value={95} status="success" />
              </KPI>
            </div>
          </MotionCard>
        </div>
      </section>

      <section
        id="guestbook"
        aria-labelledby="guestbook-title"
        className="mx-auto w-full scroll-mt-24 py-24 sm:py-32"
      >
        <header className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center sm:px-10">
          <Popover isOpen={isGuestbookPopoverOpen} onOpenChange={setIsGuestbookPopoverOpen}>
            <Popover.Trigger className="absolute -top-8 -right-20">
              <Image
                alt="Guestbook decorative animation"
                aria-hidden="true"
                height={112}
                src="/Animation.svg"
                unoptimized
                width={112}
              />
            </Popover.Trigger>
            <Popover.Content
              className="border-default-200/50 bg-surface/90 w-80 border shadow-xl backdrop-blur-md"
              placement="bottom end"
            >
              <Popover.Dialog className="p-4 outline-none">
                <Popover.Arrow />
                <GuestbookQuickForm onClose={() => setIsGuestbookPopoverOpen(false)} />
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          <MotionChip size="sm" color="accent" variant="soft" {...revealInView(0, 10)}>
            Guestbook
          </MotionChip>

          <MotionTypography
            id="guestbook-title"
            align="center"
            type="h2"
            weight="bold"
            className="mt-4 text-center text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.08] tracking-[-0.04em] text-balance"
            {...revealInView(0.06)}
          >
            <GradientText className="pointer-events-none cursor-default !rounded-none bg-transparent !p-0 shadow-none backdrop-blur-none ![font:inherit]">
              Since you’re here,
            </GradientText>
          </MotionTypography>

          <MotionTypography
            align="center"
            type="h3"
            className="text-center text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.08] tracking-[-0.04em] text-balance"
            {...revealInView(0.06)}
          >
            <GradientText className="pointer-events-none cursor-default !rounded-none bg-transparent !p-0 shadow-none backdrop-blur-none ![font:inherit]">
              tell me what’s on your mind.
            </GradientText>
          </MotionTypography>
        </header>

        {/* Beautiful Guestbook Testimonials Board */}
        <motion.div className="mt-6 w-full overflow-hidden" {...revealInView(0.12, 20)}>
          <GuestbookBoard />
        </motion.div>

        {/* Constrained Comments & Feedback Content */}
        <div className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-10">
          {/* Playful Emotional Feedback Panel: Rating & Reactions */}
          <motion.div className="w-full" {...revealInView(0.16, 16)}>
            <Card
              variant="secondary"
              className="border-default-100/50 bg-surface-secondary/15 rounded-3xl border p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                {/* Star Rating section */}
                <div className="flex flex-col items-center gap-2 sm:items-start">
                  <Typography
                    type="body-xs"
                    weight="bold"
                    className="text-muted/60 font-mono text-[10px] tracking-wider uppercase"
                  >
                    Rate your Odyssey experience
                  </Typography>
                  <div className="flex items-center gap-3">
                    <Rating
                      aria-label="Platform Rating"
                      value={rating}
                      onValueChange={handleRatingChange}
                      size="md"
                      style={
                        { "--rating-active-color": "var(--color-accent)" } as React.CSSProperties
                      }
                    >
                      <Rating.Item value={1} />
                      <Rating.Item value={2} />
                      <Rating.Item value={3} />
                      <Rating.Item value={4} />
                      <Rating.Item value={5} />
                    </Rating>
                    {rating > 0 && (
                      <span className="text-accent font-mono text-xs font-semibold">
                        {rating} / 5
                      </span>
                    )}
                  </div>
                </div>

                {/* Emoji Reaction button group */}
                <div className="flex flex-col items-center gap-2 sm:items-end">
                  <Typography
                    type="body-xs"
                    weight="bold"
                    className="text-muted/60 font-mono text-[10px] tracking-wider uppercase"
                  >
                    React to the workspace
                  </Typography>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                    {Object.entries(reactions).map(([emoji, { count, selected }]) => (
                      <EmojiReactionButton
                        key={emoji}
                        isSelected={selected}
                        onChange={() => toggleReaction(emoji)}
                        size="sm"
                      >
                        <EmojiReactionButton.Emoji>{emoji}</EmojiReactionButton.Emoji>
                        {count > 0 && (
                          <EmojiReactionButton.Count>{count}</EmojiReactionButton.Count>
                        )}
                      </EmojiReactionButton>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {mounted && !isAuthenticated ? (
            <motion.div className="w-full" {...revealInView(0.2, 16)}>
              <div className="border-default-100 bg-surface-secondary/20 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <Typography type="body-sm" weight="semibold">
                    Sign in to add an entry
                  </Typography>
                  <Typography color="muted" type="body-xs" className="mt-1">
                    Reading is open to everyone. Sign in to leave a note or reply.
                  </Typography>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0 font-medium"
                  onPress={() => dispatch(setLoginOpen(true))}
                >
                  <PencilToSquare aria-hidden="true" className="size-4" />
                  Sign in to write
                </Button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      <section
        id="faq"
        aria-labelledby="faq-title"
        className="mx-auto w-full max-w-4xl scroll-mt-24 px-6 py-24 text-center sm:px-10 sm:py-32"
      >
        <header className="flex flex-col items-center text-center">
          <MotionChip size="sm" color="default" variant="secondary" {...revealInView(0, 10)}>
            FAQ
          </MotionChip>
          <MotionTypography
            id="faq-title"
            align="center"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
            {...revealInView(0.06)}
          >
            Questions, answered.
          </MotionTypography>
          <MotionTypography
            align="center"
            type="body"
            color="muted"
            className="mt-3 max-w-xl text-balance"
            {...revealInView(0.12, 14)}
          >
            Some answers to questions that tend to come up.
          </MotionTypography>
        </header>
      </section>
    </div>
  );
}

interface GuestbookQuickFormProps {
  onClose: () => void;
}

function GuestbookQuickForm({ onClose }: GuestbookQuickFormProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [content, setContent] = useState("");
  const [postEntry, { isLoading }] = usePostGuestbookEntryMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    try {
      await postEntry({ content: content.trim() }).unwrap();
      setContent("");
      onClose();
    } catch (err) {
      console.error("Failed to post entry:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3 text-start">
        <div className="flex items-center gap-2">
          <span className="text-accent text-base">✨</span>
          <Popover.Heading className="text-foreground text-sm font-semibold tracking-tight">
            Sign the Guestbook
          </Popover.Heading>
        </div>
        <p className="text-muted/80 text-[11px] leading-relaxed">
          Leave a message on our wall to mark your visit. Reading is open to everyone, but writing
          requires a quick sign-in.
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="primary"
            className="bg-accent h-8 px-4 text-xs font-semibold text-white hover:brightness-105"
            onPress={() => {
              onClose();
              dispatch(setLoginOpen(true));
            }}
          >
            <Icon icon="lucide:pencil-line" className="size-3.5" />
            Sign in to write
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted/80 h-8 px-3 text-xs font-medium"
            onPress={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-start">
      <div className="flex items-center gap-2">
        <span className="text-accent text-base">✨</span>
        <Popover.Heading className="text-foreground text-sm font-semibold tracking-tight">
          Before You Go
        </Popover.Heading>
      </div>

      <div className="flex w-full flex-col gap-2">
        <TextArea
          aria-label="Guestbook message"
          placeholder="Write something for the next explorer..."
          rows={3}
          maxLength={280}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        <Description id="textarea-controlled-description">
          Characters: {content.length} / 280
        </Description>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button size="sm" fullWidth variant="ghost" onPress={onClose} isDisabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          fullWidth
          size="sm"
          variant="primary"
          isDisabled={!content.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Icon icon="lucide:loader-2" className="size-3.5 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Icon icon="lucide:send" className="size-3.5" />
              Submit
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
