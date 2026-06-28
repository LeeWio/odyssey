"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import {
  Card,
  Chip,
  Button,
  Typography,
  Tooltip,
  Link,
  buttonVariants,
  Tag,
  Avatar,
  TagGroup,
} from "@heroui/react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@gravity-ui/icons";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TrueFocus from "../text/true-focus";
import { Icon } from "@iconify/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function OrbitalCarousel() {
  const [activeIndex, setActiveIndex] = useState(1); // Start on the middle card (PS5)
  const dragStartRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < 4 ? prev + 1 : prev));
  };

  // Dragging interaction (Mouse & Touch)
  const handleDragStart = (clientX: number) => {
    dragStartRef.current = clientX;
    isDraggingRef.current = false;
  };

  const handleDragMove = (clientX: number) => {
    if (dragStartRef.current === null) return;
    const offset = clientX - dragStartRef.current;
    setDragOffset(offset);
    if (Math.abs(offset) > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleDragEnd = () => {
    if (dragStartRef.current === null) return;
    const threshold = 100; // Swipe threshold in pixels

    if (dragOffset > threshold && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    } else if (dragOffset < -threshold && activeIndex < 4) {
      setActiveIndex((prev) => prev + 1);
    }

    dragStartRef.current = null;
    setDragOffset(0);

    // Keep dragging ref true briefly to block instant click events after dragging
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // Event binders
  const onMouseDown = (e: MouseEvent) => handleDragStart(e.clientX);
  const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
  const onMouseUpOrLeave = () => handleDragEnd();

  const onTouchStart = (e: TouchEvent) => handleDragStart(e.touches[0].clientX);
  const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  // Helper to compute and render 3D container wrapper styles for each card
  const renderCardContainer = (idx: number, cardNode: React.ReactNode) => {
    const offset = idx - activeIndex;
    const isCenter = offset === 0;

    const angle = -offset * 32 + dragOffset * 0.08;
    const zTranslate =
      -Math.abs(offset) * 200 - (dragStartRef.current ? Math.abs(dragOffset) * 0.25 : 0);
    const xTranslate = offset * 390 + dragOffset * 0.95;
    const scale = 1 - Math.abs(offset) * 0.1;
    const opacity = 1 - Math.abs(offset) * 0.5;
    const blurValue = Math.abs(offset) * 2.5;
    const brightness = 1 - Math.abs(offset) * 0.3;

    return (
      <div
        key={idx}
        className={`absolute top-1/2 left-1/2 h-120 w-[320px] sm:h-132.5 sm:w-125 ${
          !isCenter ? "cursor-pointer" : ""
        }`}
        style={{
          transform: `translate(-50%, -50%) translateX(${xTranslate}px) translateZ(${zTranslate}px) rotateY(${angle}deg) scale(${scale})`,
          opacity: Math.max(0.15, opacity),
          filter: `blur(${blurValue}px) brightness(${brightness})`,
          zIndex: 10 - Math.abs(offset),
          transition: dragStartRef.current
            ? "none"
            : "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s, filter 0.6s",
          pointerEvents: "auto",
        }}
        onClick={() => {
          if (!isCenter && !isDraggingRef.current) {
            setActiveIndex(idx);
          }
        }}
      >
        {cardNode}
      </div>
    );
  };

  // Scroll Triggered Text Appear/Disappear Animation
  useGSAP(
    () => {
      if (!headerRef.current) return;
      const items = headerRef.current.querySelectorAll(".orbital-header-item");
      if (items.length === 0) return;

      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: 40,
          filter: "blur(12px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.15,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden py-16 sm:py-24"
    >
      <div
        ref={headerRef}
        className="mb-8 flex w-full flex-col items-center gap-4 px-4 text-center sm:mb-12"
      >
        <Chip color="accent" size="lg" variant="secondary" className="orbital-header-item">
          Everyday Essentials
        </Chip>
        <Typography
          type="h1"
          weight="semibold"
          className="orbital-header-item text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
        >
          Tried it. Kept it.
        </Typography>

        <Typography
          type="h5"
          className="orbital-header-item text-muted max-w-2xl text-base leading-relaxed font-normal opacity-80 sm:text-lg md:text-xl"
        >
          Tried it once. Still using it every day.
        </Typography>
      </div>

      <div
        className="relative flex w-full cursor-grab items-center justify-center select-none active:cursor-grabbing"
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
          {/* Card 0: MacBook Pro */}
          {renderCardContainer(
            0,
            <Card
              variant={activeIndex === 0 ? "default" : "transparent"}
              className={`flex h-full flex-col overflow-hidden p-0 transition-all duration-500 ${
                activeIndex === 0
                  ? "hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl"
                  : "opacity-40"
              }`}
            >
              <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                <img
                  alt="MacBook Pro"
                  loading="lazy"
                  src="/IMG_4956.JPG"
                  className="pointer-events-none h-full w-full object-cover select-none"
                  draggable={false}
                />
              </div>
              <Card.Header className="gap-2">
                <Chip size="sm" variant="secondary">
                  Workstation
                </Chip>
                <Card.Title className="text-foreground text-lg leading-snug font-bold tracking-tight sm:text-xl">
                  MacBook Pro (M1 Max)
                </Card.Title>
                <Card.Description className="text-muted line-clamp-3 text-sm leading-relaxed font-normal opacity-90">
                  My core development machine. With 32GB of RAM and 1TB of storage, it handles heavy
                  workloads effortlessly. Bought it a while ago and it still feels as fast as day
                  one.
                </Card.Description>
              </Card.Header>

              <Card.Content className="mt-auto flex flex-row flex-wrap gap-1.5 px-6 py-2">
                {["M1 Max Chip", "32GB RAM", "1TB SSD", "Liquid Retina"].map((tech) => (
                  <span
                    key={tech}
                    className="bg-muted/30 text-muted-foreground border-border/5 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </Card.Content>

              <Card.Footer className="border-border/5 flex items-center justify-between border-t px-6 py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-muted/30 h-8 px-3 text-xs font-semibold"
                >
                  View Details
                  <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Button>
                <span className="text-muted/25 font-mono text-sm font-bold select-none">01</span>
              </Card.Footer>
            </Card>
          )}

          {renderCardContainer(
            1,
            <Card
              variant={activeIndex === 1 ? "default" : "transparent"}
              className={`from-accent-200 via-success-400 relative flex h-full w-full overflow-hidden bg-radial-[at_50%_75%] to-red-900 to-90% transition-all duration-500 ${
                activeIndex === 1
                  ? "hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl"
                  : "opacity-40"
              }`}
            >
              <img
                alt="iPhone 16 Pro"
                loading="lazy"
                src="/iPhone16Pro.png"
                draggable={false}
                className="pointer-events-none absolute object-contain select-none"
              />

              {/* <div className="from-background via-surface-secondary/80 to-transparent absolute inset-x-0 bottom-0 z-20 h-80 bg-linear-to-t " /> */}

              <Chip size="lg" color="default" variant="soft" className="w-fit">
                Mobile
              </Chip>

              <Card.Header className="absolute inset-x-0 bottom-48 z-30 flex flex-col items-start gap-3 px-6">
                <Card.Title>
                  <TrueFocus
                    sentence="iPhone 16 Pro"
                    blurAmount={5}
                    borderColor="var(--color-accent, #5227FF)"
                    glowColor="var(--color-success, #5227FF)"
                    animationDuration={0.5}
                    pauseBetweenAnimations={1}
                    initialIndex={2}
                  />
                </Card.Title>
                <TagGroup selectionMode="single" size="lg">
                  <TagGroup.List>
                    <Tag>
                      <Icon icon="mdi:apple" className="size-4" />
                      iOS 27.0
                    </Tag>
                    <Tag>
                      <Icon icon="hugeicons:system-update-02" className="size-4" />
                      macOS
                    </Tag>
                    <Tag>
                      <Avatar className="size-4">
                        <Avatar.Image src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg" />
                        <Avatar.Fallback>J</Avatar.Fallback>
                      </Avatar>
                      Jane
                    </Tag>
                  </TagGroup.List>
                </TagGroup>
              </Card.Header>

              <Card.Footer className="absolute inset-x-5 bottom-5 z-40 flex items-center justify-between">
                <Chip variant="tertiary" size="lg" color="warning">
                  A18 Pro silicon
                </Chip>

                <Tooltip delay={0}>
                  <Link
                    target="_blank"
                    href="https://www.apple.com.cn/iphone/"
                    className={buttonVariants({
                      isIconOnly: true,
                      variant: "danger-soft",
                      size: "sm",
                    })}
                  >
                    <ArrowUpRight />
                  </Link>
                  <Tooltip.Content>
                    <p>Get it.</p>
                  </Tooltip.Content>
                </Tooltip>
              </Card.Footer>
            </Card>
          )}

          {/* Card 2: PlayStation 5 */}
          {renderCardContainer(
            2,
            <Card
              variant={activeIndex === 2 ? "default" : "transparent"}
              className={`flex flex-col overflow-hidden p-0 transition-all duration-500 ${
                activeIndex === 2
                  ? "hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl"
                  : "opacity-40"
              }`}
            >
              <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                <img
                  alt="PlayStation 5"
                  loading="lazy"
                  src="/er-hero.png"
                  className="pointer-events-none w-full object-cover select-none"
                  draggable={false}
                />
              </div>
              <Card.Header className="gap-2">
                <Chip size="sm" variant="secondary">
                  Gaming Console
                </Chip>
                <Card.Title className="text-foreground text-lg leading-snug font-bold tracking-tight sm:text-xl">
                  PlayStation 5
                </Card.Title>
                <Card.Description className="text-muted line-clamp-3 text-sm leading-relaxed font-normal opacity-90">
                  Where I go to disconnect. Immersive single-player games run beautifully on it.
                  It's the perfect way to unwind and shift my brain away from code after a long day.
                </Card.Description>
              </Card.Header>

              <Card.Content className="mt-auto flex flex-row flex-wrap gap-1.5 px-6 py-2">
                {["4K 120Hz Rendering", "Ultra-fast SSD", "DualSense Haptics", "3D Audio"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="bg-muted/30 text-muted-foreground border-border/5 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                    >
                      {tech}
                    </span>
                  )
                )}
              </Card.Content>

              <Card.Footer className="border-border/5 flex items-center justify-between border-t px-6 py-4">
                <Button variant="ghost" size="sm">
                  View Details
                  <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Button>
                <span className="text-muted/25 font-mono text-sm font-bold select-none">03</span>
              </Card.Footer>
            </Card>
          )}

          {/* Card 3: Nintendo Switch */}
          {renderCardContainer(
            3,
            <Card
              variant={activeIndex === 3 ? "default" : "transparent"}
              className={`flex flex-col overflow-hidden p-0 transition-all duration-500 ${
                activeIndex === 3
                  ? "hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl"
                  : "opacity-40"
              }`}
            >
              <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                <img
                  alt="Nintendo Switch"
                  loading="lazy"
                  src="/zelda-hero.png"
                  className="pointer-events-none w-full object-cover select-none"
                  draggable={false}
                />
              </div>
              <Card.Header className="gap-2">
                <Chip size="sm" variant="secondary">
                  Handheld Gaming
                </Chip>
                <Card.Title className="text-foreground text-lg leading-snug font-bold tracking-tight sm:text-xl">
                  Nintendo Switch
                </Card.Title>
                <Card.Description className="text-muted line-clamp-3 text-sm leading-relaxed font-normal opacity-90">
                  The best companion for travel and casual gaming. Whether I'm diving into Zelda on
                  the couch or playing a quick round on a flight, it's always in my bag.
                </Card.Description>
              </Card.Header>

              <Card.Content className="mt-auto flex flex-row flex-wrap gap-1.5 px-6 py-2">
                {[
                  "Hybrid Mode",
                  "Joy-Con Controllers",
                  "First-Party Titles",
                  "Lightweight Design",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="bg-muted/30 text-muted-foreground border-border/5 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </Card.Content>

              <Card.Footer className="border-border/5 flex items-center justify-between border-t px-6 py-4">
                <Button variant="ghost" size="sm">
                  View Details
                  <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Button>
                <span className="text-muted/25 font-mono text-sm font-bold select-none">04</span>
              </Card.Footer>
            </Card>
          )}

          {/* Card 4: AirPods Pro */}
          {renderCardContainer(
            4,
            <Card
              variant={activeIndex === 4 ? "default" : "transparent"}
              className={`flex flex-col overflow-hidden p-0 transition-all duration-500 ${
                activeIndex === 4
                  ? "hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl"
                  : "opacity-40"
              }`}
            >
              <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                <img
                  alt="AirPods Pro"
                  loading="lazy"
                  src="/IMG_4958.WEBP"
                  className="pointer-events-none w-full object-cover select-none"
                  draggable={false}
                />
              </div>
              <Card.Header className="gap-2">
                <Chip size="sm" variant="secondary">
                  Audio
                </Chip>
                <Card.Title className="text-foreground text-lg leading-snug font-bold tracking-tight sm:text-xl">
                  AirPods Pro
                </Card.Title>
                <Card.Description className="text-muted line-clamp-3 text-sm leading-relaxed font-normal opacity-90">
                  Essential for deep work and daily commutes. The active noise cancellation creates
                  instant focus wherever I am, and the seamless switching between my Apple devices
                  feels like magic.
                </Card.Description>
              </Card.Header>

              <Card.Content className="mt-auto flex flex-row flex-wrap gap-1.5 px-6 py-2">
                {[
                  "Active Noise Cancelling",
                  "Adaptive Audio",
                  "Spatial Audio",
                  "MagSafe Charging",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="bg-muted/30 text-muted-foreground border-border/5 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </Card.Content>

              <Card.Footer className="border-border/5 flex items-center justify-between border-t px-6 py-4">
                <Button variant="ghost" size="sm">
                  View Details
                  <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Button>
                <span className="text-muted/25 font-mono text-sm font-bold select-none">05</span>
              </Card.Footer>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-4 flex w-full items-center justify-center gap-4">
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
          {[0, 1, 2, 3, 4].map((idx) => (
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
          isDisabled={activeIndex === 4}
        >
          <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
