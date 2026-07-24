"use client";

import { Button, Card, Chip, cn, ProgressBar, Surface, Tooltip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FluidBackdrop } from "@/components/background/fluid-backdrop";
import { MusicDashboard } from "@/components/music/music-dashboard";
import { MotionButton } from "@/components/ui";
import { MotionTypography } from "@/components/ui/motion-typography";

const enterEase = [0.23, 1, 0.32, 1] as const;

const chapters = [
  { id: "odyssey", label: "Odyssey" },
  { id: "chronicle", label: "Chronicle" },
  { id: "daily", label: "Orbit" },
  { id: "travelogue", label: "Travelogue" },
] as const;

const telemetrySignals = [
  { label: "Recently Listened", value: "Brian Eno — An Ending (Ascent)" },
  { label: "Recently Acquired", value: "NASDAQ: AAPL & NVDA (Long)" },
  { label: "Currently Reading", value: "The Poetics of Space" },
  { label: "Currently Coding", value: "Next.js + Fluid CSS Gradients" },
  { label: "Physical Calisthenics", value: "Active sets & Cold plunge recovery" },
  { label: "Current Geography", value: "Shanghai · 31°14′N" },
  { label: "Travelog Memory", value: "Iceland · North Atlantic Light" },
  { label: "System Latency", value: "120fps · Secure Connection" },
] as const;

function WorldTicker() {
  const items = telemetrySignals;
  return (
    <div className="relative w-full overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          gap: 12px;
          padding-right: 12px;
          animation: marquee-scroll 32s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="marquee-track">
        {[...items, ...items].map((item, index) => (
          <motion.div
            key={`${item.label}-${index}`}
            whileHover={{ y: -4, scale: 1.025 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="shrink-0"
          >
            <Card
              variant="transparent"
              className="bg-background/58 border-default-100/5 hover:border-default-200/50 w-60 rounded-2xl border px-4 py-3 shadow-none backdrop-blur-xl transition-colors duration-300"
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function IntroPanel({ onEnter }: { onEnter: () => void }) {
  const { scrollYProgress } = useScroll();

  const gridX = useTransform(scrollYProgress, [0, 0.33], ["0vw", "20vw"]);

  const dotMatrixStyle = {
    backgroundImage: "radial-gradient(currentColor 0.8px, transparent 0.8px)",
    backgroundSize: "48px 44px",
    backgroundPosition: "center center",
    WebkitMaskImage:
      "radial-gradient(circle at center, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 0) 55%)",
    maskImage: "radial-gradient(circle at center, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 0) 55%)",
  } as const;

  return (
    <Surface
      id="odyssey"
      aria-labelledby="odyssey-title"
      role="region"
      variant="transparent"
      className="relative flex h-full w-screen shrink-0 items-center overflow-hidden bg-transparent pt-16"
    >
      <style>{`
        @keyframes text-scroll-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .scrolling-text-gradient {
          background-size: 200% auto;
          animation: text-scroll-gradient 12s ease-in-out infinite;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
        style={{ ...dotMatrixStyle, x: gridX }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative z-20 mx-auto flex w-full flex-col items-center justify-center px-5 text-center sm:px-8 lg:px-12">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Chip size="sm" variant="soft" color="warning">
            <Icon icon="gravity-ui:sparkles" className="mr-1 inline-block size-3.5 animate-pulse" />
            Odyssey · 31°14
          </Chip>

          <div id="odyssey-title" className="mt-4 flex max-w-275 flex-col items-center text-center">
            <MotionTypography
              initial={{
                opacity: 0,
                y: 18,
                filter: "blur(12px)",
                letterSpacing: "0.02em",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                letterSpacing: "-0.04em",
              }}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15,
              }}
              weight="bold"
              align="center"
              className="from-accent via-success to-accent scrolling-text-gradient bg-linear-to-r bg-clip-text text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.045em] text-transparent select-none"
            >
              The world scrolls.
            </MotionTypography>

            <MotionTypography
              initial="hidden"
              animate="visible"
              weight="semibold"
              align="center"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.045,
                    delayChildren: 0.35,
                  },
                },
              }}
              className="relative mt-1 text-[clamp(4rem,9vw,9rem)] leading-[0.82] tracking-[-0.075em] italic select-none"
            >
              {Array.from("I stay.").map((char, index) => {
                const isDot = char === ".";
                const isAccentChar = index > 1;

                return (
                  <motion.span
                    key={index}
                    className={cn(
                      "inline-block origin-center will-change-transform",
                      isAccentChar ? "text-accent" : "text-foreground",
                      isDot && "cursor-pointer px-1.5"
                    )}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 35,
                        rotateX: 45,
                        filter: "blur(10px)",
                      },

                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        filter: "blur(0px)",
                        transition: {
                          duration: 1.1,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      },
                    }}
                    whileHover={
                      isDot
                        ? {
                            scale: 1.25,
                            rotate: 90,
                            transition: {
                              type: "spring",
                              stiffness: 200,
                              damping: 25,
                            },
                          }
                        : {
                            y: -3,
                            transition: {
                              type: "spring",
                              stiffness: 250,
                              damping: 20,
                            },
                          }
                    }
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                );
              })}
            </MotionTypography>
          </div>

          <motion.p
            className="text-muted-foreground/60 mt-10 max-w-md text-[11px] leading-loose font-light tracking-[0.22em] uppercase select-none md:text-xs"
            initial={{
              opacity: 0,
              filter: "blur(6px)",
              y: 12,
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
            }}
            transition={{
              duration: 1,
              ease: [0.23, 1, 0.32, 1],
              delay: 1,
            }}
          >
            A quiet coordinate in the infinite feed — anchoring what survives the drift.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1.2,
            ease: [0.23, 1, 0.32, 1],
            delay: 1.1,
          }}
          className="pointer-events-auto relative mt-14 w-screen overflow-hidden mask-[linear-gradient(to_right,transparent,white_15%,white_85%,transparent)] select-none md:mt-16"
        >
          <WorldTicker />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-30 flex items-center justify-center">
        <Tooltip delay={200}>
          <MotionButton
            onPress={onEnter}
            variant="ghost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            aria-label="Scroll or Click to Explore"
            className="hover:bg-default-100/5 before:bg-default-300/30 relative flex h-14 w-6 min-w-0 items-center justify-center overflow-hidden rounded-full p-0 transition-colors before:absolute before:inset-y-0 before:w-px before:content-['']"
          >
            <motion.div
              className="bg-accent absolute left-1/2 h-3 w-[1.5px] -translate-x-1/2 rounded-full"
              animate={{
                y: [-12, 56],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                ease: [0.25, 0, 0.35, 1], // cinematic gravity curve
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </MotionButton>
          <Tooltip.Content
            showArrow
            placement="top"
            className="bg-background/80 border-default-100/55 text-foreground rounded-lg border px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] uppercase shadow-lg backdrop-blur-md select-none"
          >
            <Tooltip.Arrow />
            Scroll or Click
          </Tooltip.Content>
        </Tooltip>
      </div>
    </Surface>
  );
}

function ChroniclePanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const { scrollYProgress } = useScroll();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.12;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const isActive = latest >= 0.15 && latest <= 0.45;
      if (isActive) {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <Surface
      id="chronicle"
      aria-labelledby="chronicle-title"
      role="region"
      variant="transparent"
      className="relative flex h-full w-screen shrink-0 items-center overflow-hidden bg-transparent pt-16"
    >
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        loop
        preload="auto"
      />

      <style>{`
        @keyframes sound-ripple {
          0% {
            transform: scale(0.55);
            opacity: 0;
            filter: blur(4px);
          }
          20% {
            opacity: 0.3;
            filter: blur(0px);
          }
          60% {
            opacity: 0.15;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
            filter: blur(8px);
          }
        }
        .ripple-wave {
          position: absolute;
          border-radius: 9999px;
          border: 1.5px solid var(--accent);
          background: radial-gradient(circle, color-mix(in oklab, var(--accent) 15%, transparent) 0%, transparent 70%);
          width: 80%;
          height: 80%;
          transform-origin: center;
          opacity: 0;
        }
        .ripple-active-1 { animation: sound-ripple 6s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
        .ripple-active-2 { animation: sound-ripple 6s cubic-bezier(0.25, 1, 0.5, 1) infinite 2s; }
        .ripple-active-3 { animation: sound-ripple 6s cubic-bezier(0.25, 1, 0.5, 1) infinite 4s; }
      `}</style>

      <div className="z-20 mx-auto grid h-full w-full max-w-350 grid-cols-1 content-center gap-6 px-5 py-6 sm:px-8 md:grid-cols-12 md:items-center md:gap-10 md:px-12 md:py-10">
        <div className="flex flex-col items-start md:col-span-5 md:pr-6">
          <Chip
            size="sm"
            variant="soft"
            className="border-default-100/30 bg-default-100/5 mb-6 flex items-center gap-1.5 border py-0.5 uppercase select-none"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span
                className={cn(
                  "bg-accent absolute inline-flex h-full w-full rounded-full opacity-75",
                  isPlaying && "animate-ping"
                )}
              ></span>
              <span className="bg-accent relative inline-flex h-1.5 w-1.5 rounded-full"></span>
            </span>
            <Chip.Label className="text-muted-foreground font-mono text-[9px] tracking-[0.2em]">
              Acoustic Outpost · Ambient Feed
            </Chip.Label>
          </Chip>

          <div id="chronicle-title" className="flex flex-col items-start text-left">
            <MotionTypography
              initial={{
                opacity: 0,
                y: 18,
                filter: "blur(12px)",
                letterSpacing: "0.02em",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                letterSpacing: "-0.04em",
              }}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15,
              }}
              weight="bold"
              align="start"
              className="text-default-500 font-display text-left text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.045em] select-none"
            >
              The music floats.
            </MotionTypography>

            <MotionTypography
              initial="hidden"
              animate="visible"
              weight="semibold"
              align="start"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.045,
                    delayChildren: 0.35,
                  },
                },
              }}
              className="text-foreground relative mt-1 text-left text-[clamp(4rem,9vw,9rem)] leading-[0.82] tracking-[-0.075em] italic select-none"
            >
              {Array.from("I listen.").map((char, index) => {
                const isDot = char === ".";
                const isAccentChar = index > 1;

                return (
                  <motion.span
                    key={index}
                    className={cn(
                      "inline-block origin-center will-change-transform",
                      isAccentChar ? "text-accent" : "text-foreground",
                      isDot && "cursor-pointer px-1.5"
                    )}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 35,
                        rotateX: 45,
                        filter: "blur(10px)",
                      },

                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        filter: "blur(0px)",
                        transition: {
                          duration: 1.1,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      },
                    }}
                    whileHover={
                      isDot
                        ? {
                            scale: 1.25,
                            rotate: 90,
                            transition: {
                              type: "spring",
                              stiffness: 200,
                              damping: 25,
                            },
                          }
                        : {
                            y: -3,
                            transition: {
                              type: "spring",
                              stiffness: 250,
                              damping: 20,
                            },
                          }
                    }
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                );
              })}
            </MotionTypography>
          </div>

          <Typography
            color="muted"
            type="body"
            className="mt-8 max-w-md text-sm leading-relaxed font-light italic select-none"
          >
            &quot;Close your eyes. Let the ambient loops settle the drift. You&apos;ve been
            scrolling for a long time — rest here a while.&quot;
          </Typography>
        </div>

        <div className="relative flex h-[40dvh] min-h-72 w-full items-center justify-center md:col-span-7 md:h-[66dvh] md:min-h-120">
          <Card className="bg-background/10 hover:bg-background/20 border-default-100/10 relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border p-0 shadow-xl backdrop-blur-xl transition-all duration-500 select-none">
            <div
              style={{
                backgroundImage: "radial-gradient(currentColor 0.8px, transparent 0.8px)",
                backgroundSize: "28px 28px",
                WebkitMaskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,0.6) 10%, rgba(0,0,0,0) 75%)",
                maskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,0.6) 10%, rgba(0,0,0,0) 75%)",
              }}
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            />

            <div className="bg-accent/10 pointer-events-none absolute z-0 size-60 animate-pulse rounded-full blur-[80px]" />

            <div className="relative z-10 flex size-full items-center justify-center">
              <div
                className={cn(
                  "ripple-wave",
                  isPlaying ? "ripple-active-1" : "scale-[0.6] opacity-10"
                )}
              />
              <div
                className={cn(
                  "ripple-wave",
                  isPlaying ? "ripple-active-2" : "scale-[0.8] opacity-5"
                )}
              />
              <div className={cn("ripple-wave", isPlaying ? "ripple-active-3" : "opacity-0")} />

              <motion.div
                className="bg-accent/15 border-accent/25 shadow-accent/5 pointer-events-none z-20 flex size-16 items-center justify-center rounded-full border shadow-inner backdrop-blur-md"
                animate={
                  isPlaying
                    ? { scale: [1, 1.06, 0.98, 1], rotate: [0, 5, -5, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              >
                <Icon icon="solar:music-note-bold" className="text-accent size-6 animate-pulse" />
              </motion.div>
            </div>
          </Card>
        </div>
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
      variant="transparent"
      className="relative flex h-full w-screen shrink-0 items-center overflow-hidden bg-transparent pt-16"
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
      className="relative flex h-full w-screen shrink-0 items-end overflow-hidden pt-16"
    >
      <div
        aria-hidden="true"
        className="from-background via-background/55 pointer-events-none absolute inset-0 bg-linear-to-r to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-background via-background/15 to-background/20 pointer-events-none absolute inset-0 bg-linear-to-t"
      />

      <div className="relative mx-auto flex w-full max-w-350 px-5 py-10 sm:px-8 md:px-12 md:py-16">
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
      <FluidBackdrop scrollYProgress={scrollYProgress} />

      <div ref={targetRef} className="relative h-[400vh] w-full">
        <div className="sticky top-0 h-dvh w-full overflow-hidden">
          <motion.div
            aria-hidden="true"
            className="bg-accent fixed inset-x-0 top-0 z-50 h-px origin-left"
            style={{ scaleX: scrollYProgress }}
          />

          <motion.div className="flex h-full w-[400vw]" style={{ x }}>
            <IntroPanel onEnter={() => scrollToPanel(1)} />
            <ChroniclePanel />
            <OrbitPanel />
            <TraveloguePanel />
          </motion.div>
        </div>
      </div>

      <div className="bg-background border-default/15 relative w-full border-t px-5 py-20 sm:px-8 md:px-12 xl:px-16 2xl:px-24">
        <div className="mx-auto flex w-full max-w-350 flex-col gap-8">
          <div className="mb-4 flex flex-col items-start">
            <Chip
              size="sm"
              variant="soft"
              color="accent"
              className="font-semibold tracking-wider uppercase"
            >
              Acoustic Jukebox
            </Chip>
            <MotionTypography
              type="h2"
              weight="semibold"
              align="start"
              className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
              initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: enterEase }}
            >
              Clear the mind. Press play.
            </MotionTypography>
          </div>

          <div className="w-full">
            <MusicDashboard />
          </div>
        </div>
      </div>
    </Surface>
  );
}
