"use client";

import { Icon } from "@iconify/react";
import { Card, Chip, Typography } from "@heroui/react";

import { tasteTrail } from "./about-content";

export function AboutTimeline() {
  return (
    <section aria-labelledby="about-taste-title" className="flex flex-col gap-6">
      <div>
        <Chip size="sm" variant="secondary" className="w-fit">
          Taste
        </Chip>
        <Typography
          id="about-taste-title"
          type="h2"
          weight="bold"
          className="mt-3 tracking-[-0.03em]"
        >
          Taste
        </Typography>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tasteTrail.map((event) => (
          <Card key={event.id} className="h-full" variant="secondary">
            <Card.Header className="gap-3">
              <Icon aria-hidden="true" className="text-accent size-4" icon={event.icon} />
              <Card.Title className="text-base">{event.label}</Card.Title>
              <Card.Description className="leading-6">{event.description}</Card.Description>
            </Card.Header>
          </Card>
        ))}
      </div>
    </section>
  );
}
