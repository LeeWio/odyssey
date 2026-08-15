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
import { ItemCard, KPI, TrendChip } from "@heroui-pro/react";
import { Card, Chip, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted } from "@mantine/hooks";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

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
            className="relative min-h-72 overflow-hidden lg:col-span-12 lg:grid lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-16 lg:p-12"
            {...revealInView(0.18, 24)}
          >
            <span
              aria-hidden="true"
              className="bg-accent/8 absolute -top-20 -right-16 size-72 rounded-full blur-3xl"
            />
            <Card.Header className="relative">
              <Typography
                type="body-xs"
                color="muted"
                className="font-mono tracking-[0.14em] uppercase"
              >
                Building & training
              </Typography>
              <Card.Title className="mt-4 text-2xl tracking-[-0.03em]">
                Practice is part of the archive.
              </Card.Title>
            </Card.Header>
            <Card.Content className="relative lg:p-0">
              <Typography
                type="h3"
                weight="normal"
                className="max-w-2xl text-[clamp(1.45rem,2.8vw,2.35rem)] leading-[1.2] tracking-[-0.035em]"
              >
                “The unfinished work matters: systems shipped, miles logged, and questions carried
                forward.”
              </Typography>
            </Card.Content>
          </MotionCard>
        </div>
      </section>

      <section
        aria-labelledby="guestbook-intro-title"
        className="border-separator w-full border-t"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.65fr)] lg:items-end lg:gap-20">
          <MotionTypography
            id="guestbook-intro-title"
            type="h2"
            weight="bold"
            className="max-w-3xl text-4xl leading-[1.02] text-balance sm:text-5xl lg:text-6xl"
            {...revealInView(0, 18)}
          >
            Since you’re here, leave a few words behind.
          </MotionTypography>

          <motion.div
            className="border-separator border-l pl-6 sm:pl-8 lg:pb-2"
            {...revealInView(0.1, 16)}
          >
            <Typography color="muted" type="body" className="max-w-md leading-7 text-pretty">
              Maybe we’ve never met. But for a moment, our paths crossed here. Leave something
              behind.
            </Typography>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
