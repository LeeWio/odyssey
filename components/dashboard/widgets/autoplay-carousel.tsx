"use client";

import { Card } from "@heroui/react";
import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";

import { Carousel } from "@heroui-pro/react";

export function AutoplayCarousel() {
  const plugin = useMemo(() => Autoplay({ delay: 2000, stopOnInteraction: true }), []);

  return (
    <div className="w-full max-w-xs col-span-1 sm:col-span-2 row-span-1">
      <Carousel opts={{ loop: true }} plugins={[plugin]}>
        <Carousel.Content>
          {Array.from({ length: 5 }, (_, i) => (
            <Carousel.Item key={i}>
              <div className="p-1">
                <Card className="select-none">
                  <Card.Content className="flex aspect-square items-center justify-center">
                    <span className="text-4xl font-semibold tabular-nums">{i + 1}</span>
                  </Card.Content>
                </Card>
              </div>
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Dots />
      </Carousel>
    </div>
  );
}
