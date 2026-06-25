"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { Card, Chip, Button, Typography } from "@heroui/react";
import { Tag, Gear, ArrowLeft, ArrowRight } from "@gravity-ui/icons";

const CREATOR_ARSENAL = [
  {
    id: 1,
    title: "Keychron Q1 Pro: The Symphony of Tactile Coding Resonance",
    category: "Input Device",
    summary:
      "My primary weapon for writing and code generation. A fully custom-built 75% mechanical keyboard retrofitted with hand-lubed switches, custom brass plates, and thick PBT keycaps. Every keystroke is a tactile, deeply satisfying physical dialogue with the compiler.",
    cover: "/IMG_4958.WEBP",
    tier: "S-Class Gear",
    usage: "Tactile Input Unit",
    detailsLabel: "Inspect Mechanism",
    techStack: ["Tactile Switches", "QMK/VIA Core", "Gasket Mounted", "Machined Aluminum"],
  },
  {
    id: 2,
    title: "Sony A7 IV: Freezing the Fleeing Shadows of Adventure",
    category: "Optics Core",
    summary:
      "The photographic lens through which I capture the analog world. Armed with a 35mm f/1.4 prime lens, this mirrorless camera preserves travel expeditions, misty peaks, and studio light patterns, bringing rich, organic, film-like textures to my creative archives.",
    cover: "/IMG_2232.JPG",
    tier: "Legendary Optics",
    usage: "Creative Capture",
    detailsLabel: "Inspect Optics",
    techStack: ["33MP Exmor R", "35mm f/1.4 Prime", "4K 10-Bit Cinematic", "Active IS"],
  },
  {
    id: 3,
    title: 'MacBook Pro 16": Taming Concurrent Architectural Storms',
    category: "Compute Engine",
    summary:
      "My central computing neural network. Packed with an Apple M3 Max chip, 64GB of unified memory, and 2TB of high-speed solid-state storage. It effortlessly compiles heavy WebGL pipelines, coordinates local LLMs, and handles concurrent compilation storms.",
    cover: "/zelda-landscape.jpg",
    tier: "S-Class Compute",
    usage: "Workspace Processing",
    detailsLabel: "Inspect Processor",
    techStack: ["M3 Max Chip", "64GB Unified RAM", "2TB SSD Matrix", "Liquid Retina XDR"],
  },
  {
    id: 4,
    title: "Herman Miller Aeron: Posture Post in Zero-Gravity Comfort",
    category: "Postural Anchor",
    summary:
      "The ergonomic cockpit of my workspace. Engineered with breathable Pellicle mesh and PostureFit SL posture correctors, it distributes body weight flawlessly across long design sprints, keeping my focus undisturbed during intense 14-hour debugging runs.",
    cover: "/IMG_4954.JPG",
    tier: "S-Class Support",
    usage: "Physical Care Matrix",
    detailsLabel: "Inspect Ergonomics",
    techStack: ["Pellicle Z-Mesh", "PostureFit SL Support", "Tilt Limiter Lock", "Cast Aluminum"],
  },
  {
    id: 5,
    title: "Peak Design Travel Pack: Packing my Entire Odyssey on the Move",
    category: "Expedition Bag",
    summary:
      "My weather-resistant fortress on the move. An expandable 45L travel backpack designed to secure my MacBook, mirrorless cameras, lenses, solar generators, and off-grid equipment. Tailored to withstand the harshest rains of the Scottish Highlands.",
    cover: "/IMG_2260.JPG",
    tier: "Epic Expedition",
    usage: "Armor & Protection",
    detailsLabel: "Inspect Storage",
    techStack: ["45L Expandable Shell", "Weatherproof 400D", "Modular Camera Cubes", "Ergo Straps"],
  },
];

export function OrbitalCarousel() {
  const [activeIndex, setActiveIndex] = useState(2); // Start on the middle card (MacBook)
  const dragStartRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < CREATOR_ARSENAL.length - 1 ? prev + 1 : prev));
  };

  // Dragging interaction (Mouse & Touch)
  const handleDragStart = (clientX: number) => {
    dragStartRef.current = clientX;
  };

  const handleDragMove = (clientX: number) => {
    if (dragStartRef.current === null) return;
    const offset = clientX - dragStartRef.current;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (dragStartRef.current === null) return;
    const threshold = 100; // Swipe threshold in pixels

    if (dragOffset > threshold && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    } else if (dragOffset < -threshold && activeIndex < CREATOR_ARSENAL.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }

    dragStartRef.current = null;
    setDragOffset(0);
  };

  // Event binders
  const onMouseDown = (e: MouseEvent) => handleDragStart(e.clientX);
  const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
  const onMouseUpOrLeave = () => handleDragEnd();

  const onTouchStart = (e: TouchEvent) => handleDragStart(e.touches[0].clientX);
  const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  return (
    <section className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden">
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <Chip color="accent" size="lg" variant="secondary">
          Curated Loot
        </Chip>
        <Typography type="h1" truncate={true} weight="semibold">
          The Explorer's Arsenal
        </Typography>

        <Typography type="h5">
          An interactive catalog of curated gear, hardware, and physical tools that empower my daily
          creative and engineering odyssey.
        </Typography>
      </div>

      <div
        className="relative flex h-140 w-full cursor-grab items-center justify-center select-none active:cursor-grabbing sm:h-150"
        style={{ perspective: "1500px" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative flex h-120 w-full items-center justify-center sm:h-132.5"
          style={{ transformStyle: "preserve-3d" }}
        >
          {CREATOR_ARSENAL.map((item, idx) => {
            const offset = idx - activeIndex;
            const isCenter = offset === 0;

            // Compute 3D variables based on offset relative to the absolute center
            const angle = -offset * 32 + dragOffset * 0.08; // Rotate based on drag
            const zTranslate =
              -Math.abs(offset) * 200 - (dragStartRef.current ? Math.abs(dragOffset) * 0.25 : 0);
            const xTranslate = offset * 390 + dragOffset * 0.95; // Horizontal orbital separation
            const scale = 1 - Math.abs(offset) * 0.1;
            const opacity = 1 - Math.abs(offset) * 0.5;
            const blurValue = Math.abs(offset) * 2.5;
            const brightness = 1 - Math.abs(offset) * 0.3;

            return (
              <div
                key={item.id}
                className="absolute top-1/2 left-1/2 h-120 w-[320px] sm:h-132.5 sm:w-125"
                style={{
                  transform: `translate(-50%, -50%) translateX(${xTranslate}px) translateZ(${zTranslate}px) rotateY(${angle}deg) scale(${scale})`,
                  opacity: Math.max(0.15, opacity),
                  filter: `blur(${blurValue}px) brightness(${brightness})`,
                  zIndex: 10 - Math.abs(offset),
                  transition: dragStartRef.current
                    ? "none"
                    : "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s, filter 0.6s",
                  pointerEvents: isCenter ? "auto" : "none",
                }}
              >
                <Card
                  variant={isCenter ? "default" : "transparent"}
                  className={`flex h-full flex-col justify-between overflow-hidden transition-all duration-500 ${
                    isCenter && ""
                  }`}
                >
                  <div className="relative h-45 w-full shrink-0 overflow-hidden sm:h-55">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full rounded-2xl object-cover transition-transform duration-700 select-none hover:scale-105"
                      draggable={false}
                    />
                    <div className="from-background via-background/20 absolute inset-0 rounded-2xl bg-linear-to-t to-transparent" />
                    <Chip
                      size="sm"
                      variant="secondary"
                      className="absolute top-4 left-4 z-10 tracking-wider uppercase"
                    >
                      {item.category}
                    </Chip>
                  </div>

                  <Card.Header className="gap-2.5">
                    <div className="text-muted flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="size-3.5" />
                        {item.tier}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Gear className="size-3.5" />
                        {item.usage}
                      </span>
                    </div>

                    <Card.Title>{item.title}</Card.Title>

                    <Card.Description>{item.summary}</Card.Description>
                  </Card.Header>

                  <Card.Content className="flex flex-row">
                    {item.techStack.map((tech) => (
                      <Chip key={tech}>{tech}</Chip>
                    ))}
                  </Card.Content>

                  <Card.Footer>
                    <Button variant="ghost" size="sm">
                      {item.detailsLabel}
                      <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Button>
                    <span className="text-muted/30 font-mono text-base font-extrabold select-none">
                      0{idx + 1}
                    </span>
                  </Card.Footer>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-4">
        <Button
          isIconOnly
          variant="tertiary"
          size="md"
          onPress={handlePrev}
          isDisabled={activeIndex === 0}
        >
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-1.5">
          {CREATOR_ARSENAL.map((_, idx) => (
            <div
              key={idx}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: idx === activeIndex ? "24px" : "6px",
                backgroundColor:
                  idx === activeIndex
                    ? "var(--color-accent, #0066cc)"
                    : "var(--color-border, #e5e5e5)",
              }}
            />
          ))}
        </div>
        <Button
          isIconOnly
          variant="tertiary"
          size="md"
          onPress={handleNext}
          isDisabled={activeIndex === CREATOR_ARSENAL.length - 1}
        >
          <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
