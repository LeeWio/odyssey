"use client";

import { motion } from "motion/react";
import { Card, Chip, Typography, buttonVariants, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

const easeOut = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  {
    icon: "lucide:sparkles",
    title: "Cinematic Aesthetics",
    description:
      "Software can feel alive through restrained motion, deliberate contrast, and type that leaves room to breathe.",
  },
  {
    icon: "lucide:accessibility",
    title: "Accessibility by Default",
    description:
      "Visual beauty only matters when it remains usable with a keyboard, a screen reader, and every viewport in between.",
  },
  {
    icon: "lucide:cpu",
    title: "Low-Level Systems & Code",
    description:
      "Embedded systems, compilers, and GPU work inform the care given to every interaction and rendering detail.",
  },
  {
    icon: "lucide:camera",
    title: "Analog Observances",
    description:
      "Film photography trains the same patience: notice the frame, make fewer decisions, and let composition carry the weight.",
  },
] as const;

interface AboutPageProps {
  compact?: boolean;
}

export function AboutPage({ compact = false }: AboutPageProps) {
  return (
    <section
      className={compact ? "w-full" : "mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32"}
    >
      {!compact ? (
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.05, ease: easeOut }}
          className="flex flex-col items-center text-center"
        >
          <Chip color="accent" size="sm" variant="soft">
            About Odyssey
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.05em] text-balance"
          >
            A journey, not a destination.
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
            Odyssey is a personal knowledge product, designed as a living universe that connects
            thoughts, interests, and low-level code into a coherent physical and digital footprint.
          </Typography>
        </motion.header>
      ) : null}

      <div className={cn("flex flex-col gap-16", compact ? "" : "mt-12")}>
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
                Traditional blogging platforms describe storage (categories, tags, lists). They are
                databases made visible. Odyssey represents a different approach: mapping knowledge
                as a connected, living landscape. It is built for the intersection of front-end
                engineering, low-level system design, and the human elements of music, photography,
                and daily focus.
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-4 leading-7">
                Every article published, every piece of modular equipment used, and every location
                framed in our photography becomes a point of gravity, influencing other nodes in our
                3D Constellations space.
              </Typography>
            </div>
            <Card className="h-full md:col-span-5" variant="secondary">
              <Card.Header>
                <Chip size="sm" variant="soft" color="accent">
                  A living index
                </Chip>
                <Card.Title className="mt-3">What belongs here</Card.Title>
                <Card.Description className="leading-6">
                  A notebook for the work itself and the references, tools, images, and questions
                  that keep shaping it.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <dl className="flex flex-col gap-4">
                  {[
                    ["Writing", "Essays, notes, and ongoing columns."],
                    ["Practice", "Tools, systems, and daily rituals."],
                    ["Observation", "Photographs, music, and places worth returning to."],
                  ].map(([label, description]) => (
                    <div key={label} className="flex flex-col gap-1">
                      <dt>
                        <Typography
                          color="muted"
                          type="body-xs"
                          className="font-mono tracking-wide"
                        >
                          {label}
                        </Typography>
                      </dt>
                      <dd>
                        <Typography type="body-sm">{description}</Typography>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card.Content>
            </Card>
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

          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <Card key={pillar.title} className="h-full" variant="secondary">
                <Card.Header>
                  <Icon aria-hidden="true" icon={pillar.icon} className="text-accent size-5" />
                  <Card.Title>{pillar.title}</Card.Title>
                  <Card.Description className="leading-6">{pillar.description}</Card.Description>
                </Card.Header>
              </Card>
            ))}
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
    </section>
  );
}
