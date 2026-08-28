"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, Chip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";

import { usesData } from "./uses-data";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface UsesPageProps {
  compact?: boolean;
}

export function UsesPage({ compact = false }: UsesPageProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const reveal = (delay = 0, distance = 20) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: shouldReduceMotion ? 0 : 0.65, delay, ease: easeOut },
  });

  return (
    <section
      className={compact ? "w-full" : "mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32"}
    >
      {!compact ? (
        <header className="flex flex-col items-center text-center">
          <motion.div {...reveal(0, 10)}>
            <Chip color="default" size="sm" variant="secondary">
              Uses
            </Chip>
          </motion.div>
          <motion.div {...reveal(0.06)}>
            <Typography
              type="h1"
              weight="bold"
              className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.05em] text-balance"
            >
              The tools behind the work.
            </Typography>
          </motion.div>
          <motion.div {...reveal(0.12, 14)}>
            <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
              A small, evolving set of hardware and software that makes space for writing, building,
              and paying attention.
            </Typography>
          </motion.div>
        </header>
      ) : null}

      <div className={compact ? "flex flex-col gap-16" : "mt-16 flex flex-col gap-20"}>
        {usesData.map((category, index) => (
          <motion.section
            key={category.name}
            className="grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-12"
            {...reveal(index * 0.06, 20)}
          >
            <header className="self-start lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <span className="bg-surface-secondary text-muted flex size-10 items-center justify-center rounded-xl">
                  {getCategoryIcon(category.name)}
                </span>
                <Typography type="h2" weight="bold" className="tracking-[-0.03em]">
                  {category.name}
                </Typography>
              </div>
              {category.description ? (
                <Typography color="muted" type="body-sm" className="mt-4 max-w-sm leading-6">
                  {category.description}
                </Typography>
              ) : null}
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              {category.items.map((item) => (
                <Card key={item.name} className="h-full" variant="secondary">
                  <Card.Header>
                    <Card.Title className="text-base">{item.name}</Card.Title>
                    <Card.Description className="line-clamp-3 leading-6">
                      {item.description}
                    </Card.Description>
                  </Card.Header>
                  {item.tags?.length ? (
                    <Card.Footer className="mt-auto flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="tertiary">
                          {tag}
                        </Chip>
                      ))}
                    </Card.Footer>
                  ) : null}
                </Card>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </section>
  );
}

function getCategoryIcon(name: string) {
  switch (name) {
    case "Workspace":
      return <Icon aria-hidden="true" icon="gravity-ui:display" className="size-5" />;
    case "Coding":
      return <Icon aria-hidden="true" icon="gravity-ui:terminal" className="size-5" />;
    case "Audio & Video":
      return <Icon aria-hidden="true" icon="gravity-ui:headphones" className="size-5" />;
    default:
      return <Icon aria-hidden="true" icon="gravity-ui:layout-cells-large" className="size-5" />;
  }
}
