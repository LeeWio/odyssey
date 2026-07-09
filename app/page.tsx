"use client";

import Image from "next/image";
import { Card, Button, cn, Chip } from "@heroui/react";
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from "motion/react";
import BlurText from "@/components/text/blur-text";
import { useRef } from "react";
import { Icon } from "@iconify/react";

const introHeroImage = "/odyssey-hero.png";

const slidesConfig = [
  {
    chapter: "Odyssey",
    bgClass: "bg-background",
    textClass: "text-foreground",
    description:
      "Amid feed noise, this space keeps notes, ledgers, songs, and places worth returning to.",
    heading: "The world scrolls.",
    widgetType: "intro",
  },
  {
    chapter: "Chronicle",
    bgClass: "bg-surface-secondary",
    textClass: "text-foreground/90",
    description:
      "A logbook of design systems, Next.js setups, and accessible engineering. Exploring the intersection of form, function, and performance.",
    heading: "Words capture what time sweeps away.",
    widgetType: "blog",
  },
  {
    chapter: "Ledger",
    bgClass: "bg-success/10",
    textClass: "text-success",
    description:
      "A compounding ledger tracking long-term assets and market indices. Quiet capital growth in a world of daily market fluctuations.",
    heading: "Slow-moving numbers build the fortress.",
    widgetType: "ledger",
  },
  {
    chapter: "Sanctuary",
    bgClass: "bg-danger/10",
    textClass: "text-danger",
    description:
      "A hand-picked collection of slow-moving soundtracks, ambient rooms, and late-night listening sanctuaries that set the mood.",
    heading: "Soundtracks that still change the weather.",
    widgetType: "music",
  },
  {
    chapter: "Travelogue",
    bgClass: "bg-accent/10",
    textClass: "text-accent",
    description:
      "Framing spatial explorations, brutalist architectures, and visual journals from slow journeys across Iceland, Europe, and Asia.",
    heading: "Moments framed in the flowing tide.",
    widgetType: "travel",
  },
];

function IntroHeroSlide({
  shouldReduceMotion,
  onEnter,
}: {
  shouldReduceMotion: boolean;
  onEnter: () => void;
}) {
  return (
    <section className="bg-background relative h-full w-full overflow-hidden">
      <Image
        alt="A quiet desk with notebooks, headphones, and a night window"
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src={introHeroImage}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,rgba(8,8,10,0.88)_32%,rgba(8,8,10,0.36)_67%,rgba(8,8,10,0.18)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_55%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(0deg,rgba(8,8,10,0.84)_0%,transparent_34%)]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-5 py-10 sm:px-8 md:px-12">
        <motion.div
          className="flex max-w-2xl flex-col items-start"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Chip color="accent" size="sm" variant="soft" className="mb-7 w-fit font-mono">
            Odyssey
          </Chip>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl text-left"
          >
            <span className="font-display text-foreground block pb-1 text-5xl leading-[1.08] font-normal tracking-tight italic sm:text-6xl">
              The world scrolls.
            </span>
            <span className="text-accent mt-1 block font-sans text-6xl leading-none font-black select-none sm:text-7xl">
              I stay.
            </span>
          </motion.h1>

          <p className="text-foreground/[0.62] mt-6 max-w-md text-sm leading-6 sm:text-base">
            A slower archive for writing, markets, music, and places that deserve a second look.
          </p>

          <Button
            size="lg"
            variant="primary"
            className="mt-8 min-w-28 font-sans font-medium"
            onPress={onEnter}
          >
            Enter
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const xTranslation = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);

  const x = useSpring(xTranslation, {
    stiffness: 80,
    damping: 26,
    restDelta: 0.001,
  });

  const scrollToNextPanel = () => {
    const start = targetRef.current?.offsetTop ?? 0;
    window.scrollTo({
      top: start + window.innerHeight * 0.92,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <main className="relative h-full w-full">
      <div ref={targetRef} className="relative h-[400vh] w-full">
        <div className="sticky top-0 flex h-[100dvh] w-full flex-col justify-between overflow-hidden">
          <motion.div
            style={{ x: shouldReduceMotion ? xTranslation : x }}
            className="z-10 flex h-full w-[500vw]"
          >
            {slidesConfig.map((slide, i) => (
              <div
                key={i}
                className={cn(
                  "relative flex h-full w-screen items-center justify-center transition-colors duration-500 select-none",
                  slide.bgClass
                )}
              >
                {slide.widgetType === "intro" ? (
                  <IntroHeroSlide
                    shouldReduceMotion={Boolean(shouldReduceMotion)}
                    onEnter={scrollToNextPanel}
                  />
                ) : (
                  <div className="relative mx-auto grid h-full w-full max-w-7xl grid-cols-1 items-center px-6 md:grid-cols-12 md:px-12">
                    <div className="col-span-1 flex flex-col justify-center text-left md:col-span-5">
                      <span className="text-foreground/45 mb-3 font-mono text-[11px]">
                        {slide.chapter}
                      </span>
                      <BlurText
                        text={slide.heading}
                        delay={100}
                        animateBy="words"
                        direction="top"
                        className={cn(
                          "font-display mb-4 text-5xl leading-[1.08] font-normal italic transition-colors duration-500 md:text-7xl",
                          slide.textClass
                        )}
                      />
                      <p className="text-foreground/50 mt-2 max-w-xs font-sans text-xs leading-relaxed md:text-sm">
                        {slide.description}
                      </p>
                    </div>

                    <div className="hidden md:col-span-2 md:block" />

                    <div className="col-span-1 mt-8 flex items-center justify-center md:col-span-5 md:mt-0 md:justify-end">
                      {slide.widgetType === "blog" && (
                        <Card className="border-foreground/5 bg-background/50 w-80 rounded-lg border p-4 shadow-sm transition-transform duration-300 hover:translate-y-[-2px]">
                          <div className="relative mb-3.5 aspect-[16/10] w-full overflow-hidden rounded-md bg-zinc-800/10 dark:bg-white/5">
                            <Image
                              alt="Featured article cover"
                              className="object-cover opacity-60 grayscale dark:opacity-45"
                              fill
                              sizes="320px"
                              src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=640&q=80"
                            />
                          </div>
                          <div className="mb-2 flex items-center gap-2">
                            <Chip
                              size="sm"
                              variant="soft"
                              color="default"
                              className="font-mono text-[9px] font-bold"
                            >
                              Design
                            </Chip>
                            <span className="text-foreground/45 font-mono text-[9px]">
                              5 MIN READ
                            </span>
                          </div>
                          <h4 className="text-foreground/80 truncate text-sm leading-snug font-semibold">
                            Symbiosis: The Resilience of Outposts
                          </h4>
                        </Card>
                      )}

                      {slide.widgetType === "ledger" && (
                        <Card className="border-foreground/5 bg-background/50 flex w-80 flex-col gap-4 rounded-lg border p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground/45 font-mono text-[9px]">
                              Compounding Assets
                            </span>
                            <Chip
                              size="sm"
                              variant="soft"
                              color="success"
                              className="font-mono text-[9px] font-bold tracking-wider"
                            >
                              +2.32%
                            </Chip>
                          </div>
                          <div className="text-success font-sans text-3xl leading-none font-bold tracking-tight tabular-nums">
                            $142,850.40
                          </div>
                          <div className="border-foreground/5 text-foreground/50 flex items-center justify-between border-t pt-3 text-[11px]">
                            <span>Active Positions</span>
                            <span className="text-success font-mono font-bold">12 HOLDINGS</span>
                          </div>
                        </Card>
                      )}

                      {slide.widgetType === "music" && (
                        <Card className="border-foreground/5 bg-background/50 flex w-80 flex-col gap-3.5 rounded-lg border p-4 shadow-sm">
                          <div className="flex items-center gap-3.5">
                            <div className="relative size-12 overflow-hidden rounded-md bg-zinc-800/10 dark:bg-white/5">
                              <Image
                                alt="Song cover"
                                className="object-cover opacity-60 grayscale dark:opacity-45"
                                fill
                                sizes="48px"
                                src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=160&q=80"
                              />
                            </div>
                            <div className="flex min-w-0 grow flex-col">
                              <span className="text-foreground/80 truncate text-sm font-semibold">
                                Dark Signal
                              </span>
                              <span className="text-foreground/45 truncate text-[11px]">
                                Transformer
                              </span>
                            </div>
                            <Button
                              aria-label="Play Dark Signal"
                              size="sm"
                              variant="ghost"
                              isIconOnly
                              className="h-8 min-w-8 rounded-full"
                            >
                              <Icon icon="gravity-ui:play-fill" className="text-danger size-3.5" />
                            </Button>
                          </div>
                          <div className="bg-foreground/5 relative h-1 w-full overflow-hidden rounded-full">
                            <div className="bg-danger h-full w-[35%] rounded-full" />
                          </div>
                        </Card>
                      )}

                      {slide.widgetType === "travel" && (
                        <Card className="border-foreground/5 bg-background/50 flex w-80 flex-col gap-3 rounded-lg border p-4 shadow-sm">
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-zinc-800/10 dark:bg-white/5">
                            <Image
                              alt="Iceland travelologue moment"
                              className="object-cover opacity-60 grayscale dark:opacity-45"
                              fill
                              sizes="320px"
                              src="https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=640&q=80"
                            />
                          </div>
                          <div className="text-foreground/45 flex items-center justify-between font-mono text-[9px]">
                            <span>Iceland Landscapes</span>
                            <span>July 2026</span>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 
        Scroll-Through Unlock: Once the user scrolls past the 400vh container,
        the remaining contents naturally scroll up from the bottom!
      */}
      {/* <ContinueWatchingListBox />

      <Surface
        id="scene-moments"
        aria-label="Moments"
        variant="transparent"
        className="w-full border-none py-10 sm:py-16"
      >
        <OrbitalCarousel />
      </Surface>

      <Surface
        id="scene-ledger"
        aria-label="The Compounding Ledger"
        variant="transparent"
        className="mx-auto flex w-full max-w-7xl flex-col border-none px-5 py-14 sm:px-8 lg:px-12"
      >
        <StockLedger />
      </Surface>

      <Surface
        id="scene-jukebox"
        aria-label="Music Sanctuary"
        variant="transparent"
        className="mx-auto flex w-full max-w-7xl flex-col border-none px-5 pt-10 pb-24 sm:px-8 lg:px-12"
      >
        <Jukebox />
      </Surface> */}
    </main>
  );
}
