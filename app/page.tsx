"use client";

import { Chip, Typography, Button } from "@heroui/react";
import { Bebas_Neue } from "next/font/google";
import Galaxy from "@/components/hero/galaxy";
import { m, LazyMotion, domAnimation } from "motion/react";

const fontDisplay = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
});

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { 
      duration: 1.2, 
      ease: "circOut" 
    } 
  }, 
};

const MotionChip = m.create(Chip);
const MotionTypography = m.create(Typography);

export default function Home() {
  return (
    <main className="relative -mt-16 flex w-full flex-col overflow-x-hidden">
      <section className="relative z-10 flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 pt-[calc(4rem+6rem)] pb-32 text-center md:pb-48">
        <div className="absolute inset-0 z-0">
          <Galaxy
            mouseRepulsion
            mouseInteraction
            density={1}
            glowIntensity={0.3}
            saturation={0}
            hueShift={140}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            repulsionStrength={2}
            autoCenterRepulsion={0}
            starSpeed={0.5}
            speed={1}
          />
        </div>

        <LazyMotion features={domAnimation}>
          <m.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.15, delayChildren: 0.1 }}
            className="relative z-10 flex w-full flex-col items-center"
          >
            <div className="mb-6 flex justify-center">
              <MotionChip
                variants={itemVariants}
                color="default"
                variant="soft"
                size="md"
                className="border-border/40 bg-surface/30 gap-2 border px-2 backdrop-blur-md"
              >
                <div className="bg-foreground size-1.5 animate-pulse rounded-full" />
                <Chip.Label className="text-xs font-medium tracking-widest uppercase">
                  Welcome to my digital garden
                </Chip.Label>
              </MotionChip>
            </div>

            <m.div
              variants={itemVariants}
              className={`flex flex-col items-center justify-center tracking-normal ${fontDisplay.className}`}
            >
              {/* Optical alignment: nudge the top line slightly down to balance the heavy bottom line */}
              <span className="text-muted-foreground translate-y-2 text-4xl leading-none sm:translate-y-4 sm:text-6xl md:text-7xl lg:text-[7rem]">
                THIS IS WHERE
              </span>
              {/* Minimalist approach: remove excessive shadows, keep gradient subtle */}
              <span className="from-foreground to-foreground/40 bg-gradient-to-b bg-clip-text text-7xl leading-[0.8] text-transparent sm:text-[9rem] md:text-[11rem] lg:text-[14rem] xl:text-[16rem]">
                I SHARE IT ALL
              </span>
            </m.div>

            <div className="mt-8 max-w-2xl px-4 sm:mt-12">
              <MotionTypography
                variants={itemVariants}
                type="body"
                className="text-muted-foreground text-base leading-relaxed font-medium text-balance sm:text-lg lg:text-xl"
              >
                A curated collection of my thoughts, code, and journey. Unfiltered, unpolished, and
                completely authentic.
              </MotionTypography>
            </div>

            <m.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-12"
            >
              <Button
                size="lg"
                variant="primary"
                className="shadow-foreground/10 h-12 rounded-full px-8 text-sm font-semibold shadow-lg sm:h-14 sm:px-10 sm:text-base"
              >
                Read the latest
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-border/40 bg-surface/30 hover:bg-surface/50 h-12 rounded-full border px-8 text-sm font-semibold backdrop-blur-md transition-colors sm:h-14 sm:px-10 sm:text-base"
              >
                Explore topics
              </Button>
            </m.div>
          </m.div>
        </LazyMotion>
      </section>
    </main>
  );
}
