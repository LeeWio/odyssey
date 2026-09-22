"use client";

import { Card, Chip } from "@heroui/react";

import { aboutDefaults } from "./about-content";

export function AboutDefaults() {
  return (
    <section aria-label="Defaults" className="flex flex-col gap-4">
      <Chip size="sm" variant="secondary" className="w-fit">
        Defaults
      </Chip>
      <div className="grid gap-4 sm:grid-cols-2">
        {aboutDefaults.map((item) => (
          <Card key={item.id} className="h-full" variant="secondary">
            <Card.Header>
              <Card.Title className="text-base">{item.title}</Card.Title>
              <Card.Description className="leading-6">{item.description}</Card.Description>
            </Card.Header>
            <Card.Footer className="mt-auto flex flex-wrap gap-2">
              {item.chips.map((chip) => (
                <Chip key={chip} size="sm" variant="tertiary">
                  {chip}
                </Chip>
              ))}
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
  );
}
