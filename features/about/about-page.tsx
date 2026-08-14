"use client";

import { motion } from "motion/react";
import { Card, Chip, Typography, buttonVariants, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function AboutPage() {
  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header Hero */}
        <motion.header
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.05, ease: easeOut }}
          className="flex flex-col items-center text-center"
        >
          <Chip color="accent" size="sm" variant="soft">
            About Odyssey
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-6 text-4xl leading-[1.02] text-balance sm:text-5xl lg:text-6xl"
          >
            A journey, not a destination.
          </Typography>
          <Typography color="muted" type="body" className="mt-6 max-w-xl text-lg leading-relaxed">
            Odyssey is a personal knowledge product, designed as a living universe that connects
            thoughts, interests, and low-level code into a coherent physical and digital footprint.
          </Typography>
          <span className="bg-default-200 my-8 h-12 w-px" aria-hidden="true" />
        </motion.header>

        {/* Core Story Section */}
        <div className="mt-10 flex flex-col gap-16">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
          >
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7">
                <Typography type="h2" weight="bold" className="tracking-tight">
                  The Genesis
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-4 leading-7">
                  Traditional blogging platforms describe storage (categories, tags, lists). They
                  are databases made visible. Odyssey represents a different approach: mapping
                  knowledge as a connected, living landscape. It is built for the intersection of
                  front-end engineering, low-level system design, and the human elements of music,
                  photography, and daily focus.
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-4 leading-7">
                  Every article published, every piece of modular equipment used, and every location
                  framed in our photography becomes a point of gravity, influencing other nodes in
                  our 3D Constellations space.
                </Typography>
              </div>
              <div className="border-default-200 bg-default-100 relative aspect-video overflow-hidden rounded-3xl border md:col-span-5 md:h-full">
                <div className="text-default-300/30 absolute inset-0 flex items-center justify-center text-4xl font-black italic select-none">
                  ODYSSEY
                </div>
              </div>
            </div>
          </motion.section>

          {/* Core Pillars */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
          >
            <div className="mb-8">
              <Typography type="h2" weight="bold" className="tracking-tight">
                Architectural Pillars
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-2">
                Four guiding principles that shape the layout, engineering, and visual direction of
                this notebook.
              </Typography>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card variant="secondary" className="p-6">
                <div className="bg-default-100 mb-4 flex size-10 items-center justify-center rounded-xl">
                  <Icon icon="lucide:sparkles" className="text-accent size-5" />
                </div>
                <Typography type="h4" weight="semibold">
                  Cinematic Aesthetics
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-2 leading-relaxed">
                  Websites should feel alive. By utilizing subtle post-processing blooms, 3D orbits,
                  and balanced type scales, we elevate software into an interactive product
                  experience.
                </Typography>
              </Card>

              <Card variant="secondary" className="p-6">
                <div className="bg-default-100 mb-4 flex size-10 items-center justify-center rounded-xl">
                  <Icon icon="lucide:accessibility" className="text-accent size-5" />
                </div>
                <Typography type="h4" weight="semibold">
                  Accessibility by Default
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-2 leading-relaxed">
                  Visual beauty is empty if it cannot be accessed. Following strict WCAG parameters,
                  everything here works natively under screen readers, keyboard loops, and
                  responsive viewports.
                </Typography>
              </Card>

              <Card variant="secondary" className="p-6">
                <div className="bg-default-100 mb-4 flex size-10 items-center justify-center rounded-xl">
                  <Icon icon="lucide:cpu" className="text-accent size-5" />
                </div>
                <Typography type="h4" weight="semibold">
                  Low-Level Systems & Code
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-2 leading-relaxed">
                  Deeply passionate about embedded kernels (QNX, RTOS), compilations, and shaders.
                  Writing performant Rust, C, and GPU-driven logic forms the bedrock of our
                  software.
                </Typography>
              </Card>

              <Card variant="secondary" className="p-6">
                <div className="bg-default-100 mb-4 flex size-10 items-center justify-center rounded-xl">
                  <Icon icon="lucide:camera" className="text-accent size-5" />
                </div>
                <Typography type="h4" weight="semibold">
                  Analog Observances
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-2 leading-relaxed">
                  Capturing geometry and silent weather patterns on medium format film. Slow
                  photography encourages deliberate composition and focus—lessons that carry over
                  into our code structure.
                </Typography>
              </Card>
            </div>
          </motion.section>

          {/* Call To Action */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
            className="border-default-200 bg-surface-secondary rounded-3xl border p-8 text-center sm:p-12"
          >
            <Typography type="h3" weight="bold">
              Explore the Space
            </Typography>
            <Typography
              color="muted"
              type="body-sm"
              className="mx-auto mt-4 max-w-lg leading-relaxed"
            >
              Step into the 3D interactive Constellations space to browse articles and topics
              physically, or read through our Chronicles of essays.
            </Typography>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/constellations"
                className={cn(buttonVariants({ variant: "primary", size: "md" }), "no-underline")}
              >
                Launch Constellations
              </Link>
              <Link
                href="/explore"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }), "no-underline")}
              >
                Browse Essays
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
