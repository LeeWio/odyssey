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
import { buttonVariants, Card, Chip, Link, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";

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

export default function Home() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { data: nasdaqData } = useGetMarketIndexBySymbolQuery(
    { symbol: ".ixic", period: "1D" },
    { pollingInterval: 300000, refetchOnFocus: true }
  );
  const isPositive = (nasdaqData?.changePct || 0) >= 0;

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
    <div className="bg-background w-full overflow-hidden">
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
          className="mt-6 flex flex-col items-center gap-4 sm:flex-row"
          {...reveal(0.34, 12)}
        >
          <Link className={buttonVariants({ size: "lg", variant: "primary" })} href="/blog">
            Read the journal
            <Icon aria-hidden="true" icon="gravity-ui:arrow-up-right-from-square" />
          </Link>
          <Link href="#lately">
            See what&apos;s lately
            <Link.Icon />
          </Link>
        </MotionSurface>
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

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <MotionCard variant="secondary" className="min-h-60" {...revealInView(0.08, 24)}>
            <Card.Header>
              <Chip size="sm" variant="soft">
                Listening
              </Chip>
              <Card.Title>One song, kept close.</Card.Title>
              <Card.Description>
                Music that stayed after the rest of the queue moved on.
              </Card.Description>
            </Card.Header>
            <Card.Content className="mt-auto">
              <MotionItemCard variant="secondary">
                <ItemCard.Icon role="img" aria-label="Album cover for 老歌 by 安泊猜想">
                  <div className="relative size-10 overflow-hidden rounded-lg">
                    <Image alt="" className="object-cover" fill sizes="40px" src="/IMG_5332.JPG" />
                  </div>
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>老歌</ItemCard.Title>
                  <ItemCard.Description>安泊猜想</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <MediaPlayButton media={mockSong} shuffle size="sm" variant="tertiary" />
                </ItemCard.Action>
              </MotionItemCard>
            </Card.Content>
          </MotionCard>

          <MotionCard variant="secondary" className="min-h-60" {...revealInView(0.14, 24)}>
            <Card.Header>
              <Chip size="sm" variant="soft">
                Investing
              </Chip>
              <Card.Title>Watching without rushing.</Card.Title>
              <Card.Description>
                A small market signal, observed in context rather than isolation.
              </Card.Description>
            </Card.Header>
            <Card.Content className="mt-auto">
              <MotionKPI variant="secondary">
                <KPI.Header>
                  <Icon aria-hidden="true" icon="gravity-ui:target-dart" />
                  <KPI.Title>NASDAQ</KPI.Title>
                </KPI.Header>
                <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                  <div className="flex flex-col gap-2">
                    <KPI.Value maximumFractionDigits={2} value={nasdaqData?.current || 0} />
                    <TrendChip trend={isPositive ? "up" : "down"} variant="tertiary">
                      <TrendChip.Indicator>
                        {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </TrendChip.Indicator>
                      {Math.abs(nasdaqData?.changePct || 0).toFixed(2)}%
                      <TrendChip.Suffix>today</TrendChip.Suffix>
                    </TrendChip>
                  </div>
                  <KPI.Chart
                    color="var(--color-accent)"
                    data={mapSparkline(nasdaqData?.sparkline)}
                    height={60}
                    strokeWidth={1.5}
                  />
                </KPI.Content>
              </MotionKPI>
            </Card.Content>
          </MotionCard>
        </div>

        <MotionCard
          variant="tertiary"
          className="mt-5 flex-col items-start gap-5 sm:flex-row sm:items-center"
          {...revealInView(0.18, 20)}
        >
          <Card.Header className="flex-1">
            <Typography type="body-xs" color="muted">
              Building & training
            </Typography>
            <Card.Title>Practice is part of the archive.</Card.Title>
            <Card.Description>
              The unfinished work matters: systems shipped, miles logged, and questions carried
              forward.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Link href="/blog">
              Open the archive
              <Link.Icon />
            </Link>
          </Card.Footer>
        </MotionCard>
      </section>
    </div>
  );
}
