"use client";

import { Icon } from "@iconify/react";
import { Timeline } from "@heroui-pro/react";
import { Chip, Typography } from "@heroui/react";

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
      <Timeline density="compact" size="sm">
        {tasteTrail.map((event) => (
          <Timeline.Item key={event.id} align="start" status={event.status}>
            <Timeline.Marker aria-hidden="true" className="p-1">
              <Icon icon={event.icon} className="size-3.5" />
            </Timeline.Marker>
            <Timeline.Content className="gap-1 pb-8">
              <Typography type="body-sm" weight="semibold">
                {event.label}
              </Typography>
              <Typography color="muted" type="body-sm" className="leading-6">
                {event.description}
              </Typography>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </section>
  );
}
