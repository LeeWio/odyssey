"use client";

import type { EmblaCarouselType } from "embla-carousel";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Flame, PlayFill, Sparkles } from "@gravity-ui/icons";
import { Button, Card, Chip, Surface, Tooltip, Typography } from "@heroui/react";
import { Carousel } from "@heroui-pro/react";

const heroSlides = [
  {
    id: "moments",
    eyebrow: "Objects",
    title: "Everyday Essentials",
    description: "Tried once. Kept because the object kept earning its place.",
    cta: "Explore",
    href: "scene-moments",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "ledger",
    eyebrow: "Signals",
    title: "Compounding Ledger",
    description: "A slower surface for conviction, position notes, and post-trade memory.",
    cta: "Open Ledger",
    href: "scene-ledger",
    image:
      "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "jukebox",
    eyebrow: "Songs",
    title: "Music Sanctuary",
    description: "A compact listening room for songs that still change the weather.",
    cta: "Listen",
    href: "scene-jukebox",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80",
    preview:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=320&q=80",
  },
];

export function OdysseyHero() {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const previousSlide = heroSlides[(selectedIndex + heroSlides.length - 1) % heroSlides.length];
  const nextSlide = heroSlides[(selectedIndex + 1) % heroSlides.length];

  const slideMeta = useMemo(
    () => `${selectedIndex + 1}`.padStart(2, "0") + " / " + `${heroSlides.length}`.padStart(2, "0"),
    [selectedIndex]
  );

  const syncSelectedIndex = useCallback((carouselApi: EmblaCarouselType) => {
    setSelectedIndex(carouselApi.selectedScrollSnap());
  }, []);

  const handleSetApi = useCallback(
    (carouselApi: EmblaCarouselType) => {
      setApi(carouselApi);
      syncSelectedIndex(carouselApi);
    },
    [syncSelectedIndex]
  );

  useEffect(() => {
    if (!api) return;

    api.on("select", syncSelectedIndex);
    api.on("reInit", syncSelectedIndex);

    return () => {
      api.off("select", syncSelectedIndex);
      api.off("reInit", syncSelectedIndex);
    };
  }, [api, syncSelectedIndex]);

  const scrollToScene = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Surface
      id="scene-welcome"
      aria-label="Odyssey cinematic hero"
      variant="transparent"
      className="w-full px-3 pt-24 pb-10 sm:px-6 sm:pt-28 lg:px-10"
    >
      <Surface
        variant="transparent"
        className="relative mx-auto min-h-[calc(100dvh-7rem)] w-full max-w-[1720px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#080a05] px-4 py-5 text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-[2.75rem] sm:px-8 sm:py-7 lg:min-h-[calc(100dvh-8rem)] lg:px-10"
      >
        <Surface
          aria-hidden="true"
          variant="transparent"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(142,185,28,0.86),transparent_34%),radial-gradient(circle_at_85%_16%,rgba(198,153,32,0.82),transparent_35%),linear-gradient(145deg,#284b0b_0%,#8d8616_44%,#020403_70%)]"
        >
          {null}
        </Surface>
        <Surface
          aria-hidden="true"
          variant="transparent"
          className="absolute inset-0 [background-image:repeating-radial-gradient(ellipse_at_35%_45%,transparent_0_58px,rgba(255,255,255,0.42)_61px,transparent_66px)] opacity-40"
        >
          {null}
        </Surface>
        <Surface
          aria-hidden="true"
          variant="transparent"
          className="absolute inset-x-0 top-24 h-px bg-white/20"
        >
          {null}
        </Surface>

        <Surface
          variant="transparent"
          className="relative z-10 flex items-center justify-between gap-6"
        >
          <Card
            variant="transparent"
            className="inline-flex w-fit rounded-none border-2 border-white px-4 py-2"
          >
            <Typography
              type="h5"
              weight="bold"
              className="font-mono tracking-[0.18em] text-white uppercase"
            >
              Odyssey
            </Typography>
          </Card>

          <Card
            variant="transparent"
            className="hidden flex-row items-center gap-10 p-0 text-white/70 md:flex"
          >
            {["Explore", "Objects", "Signals", "Songs"].map((item) => (
              <Button
                key={item}
                variant="ghost"
                className="px-0 font-mono text-sm tracking-[0.12em] text-white/70 uppercase"
                onPress={() => {
                  if (item === "Objects") scrollToScene("scene-moments");
                  if (item === "Signals") scrollToScene("scene-ledger");
                  if (item === "Songs") scrollToScene("scene-jukebox");
                }}
              >
                {item}
              </Button>
            ))}
          </Card>
        </Surface>

        <Surface
          variant="transparent"
          className="relative z-10 mt-12 min-h-[590px] overflow-visible sm:mt-16 lg:mt-12 lg:min-h-[680px]"
        >
          <Card
            aria-hidden="true"
            variant="transparent"
            className="absolute top-36 -left-20 hidden h-[520px] w-[300px] rotate-[-8deg] overflow-hidden rounded-none bg-black/60 p-0 opacity-80 shadow-2xl lg:block"
          >
            <Image
              alt=""
              className="object-cover"
              draggable={false}
              fill
              sizes="300px"
              src={previousSlide.image}
            />
            <Surface
              aria-hidden="true"
              variant="transparent"
              className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"
            >
              {null}
            </Surface>
          </Card>

          <Card
            aria-hidden="true"
            variant="transparent"
            className="absolute top-12 -right-24 hidden h-[580px] w-[360px] rotate-[5deg] overflow-hidden rounded-none bg-black/70 p-0 shadow-2xl xl:block"
          >
            <Image
              alt=""
              className="object-cover"
              draggable={false}
              fill
              sizes="360px"
              src={nextSlide.image}
            />
            <Surface
              aria-hidden="true"
              variant="transparent"
              className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10"
            >
              {null}
            </Surface>
          </Card>

          <Carousel setApi={handleSetApi} opts={{ loop: true }}>
            <Carousel.Content className="overflow-visible">
              {heroSlides.map((slide) => (
                <Carousel.Item key={slide.id}>
                  <Card
                    variant="transparent"
                    className="relative mx-auto h-[560px] max-w-[1180px] rotate-[-4deg] overflow-hidden rounded-none bg-black p-0 shadow-[0_42px_90px_rgba(0,0,0,0.62)] lg:h-[640px]"
                  >
                    <Image
                      alt=""
                      className="object-cover select-none"
                      draggable={false}
                      fill
                      priority={slide.id === "moments"}
                      sizes="(max-width: 768px) 92vw, 1180px"
                      src={slide.image}
                    />
                    <Surface
                      aria-hidden="true"
                      variant="transparent"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_55%_55%,transparent_0%,rgba(0,0,0,0.12)_30%,rgba(0,0,0,0.9)_100%)]"
                    >
                      {null}
                    </Surface>
                    <Card.Content className="absolute inset-x-5 bottom-6 max-w-[680px] gap-4 p-0 sm:inset-x-8 sm:bottom-8">
                      <Card.Header className="flex-row items-center gap-3 p-0">
                        <Chip
                          color="warning"
                          variant="soft"
                          className="bg-black/30 font-mono text-white backdrop-blur"
                        >
                          <Flame className="size-4" />
                          Featured
                        </Chip>
                        <Chip variant="soft" className="bg-white/15 font-mono text-white">
                          {slide.eyebrow}
                        </Chip>
                      </Card.Header>

                      <Typography
                        type="h1"
                        weight="bold"
                        className="max-w-4xl text-[clamp(3.7rem,9vw,8.4rem)] leading-[0.82] tracking-[-0.08em] text-white uppercase"
                      >
                        {slide.title}
                      </Typography>

                      <Card.Description className="max-w-lg font-mono text-sm leading-5 tracking-wide text-white/80 uppercase">
                        {slide.description}
                      </Card.Description>

                      <Card.Footer className="p-0">
                        <Button
                          variant="primary"
                          className="min-w-44 bg-white text-black hover:bg-white"
                          onPress={() => scrollToScene(slide.href)}
                        >
                          {slide.cta}
                        </Button>
                      </Card.Footer>
                    </Card.Content>
                  </Card>
                </Carousel.Item>
              ))}
            </Carousel.Content>
          </Carousel>

          <Card
            variant="transparent"
            className="absolute right-2 bottom-0 left-2 flex-row items-end justify-between gap-4 p-0 sm:right-8 sm:left-auto sm:w-fit sm:items-center"
          >
            <Card.Content className="hidden p-0 text-right sm:flex">
              <Typography
                type="body-sm"
                className="font-mono tracking-[0.2em] text-white uppercase"
              >
                See All Rooms
              </Typography>
              <Typography type="body-xs" className="font-mono text-white/50">
                {slideMeta}
              </Typography>
            </Card.Content>

            <Card.Content className="flex-row gap-2 p-0">
              {heroSlides.map((slide, index) => (
                <Button
                  key={slide.id}
                  aria-label={`Show ${slide.title}`}
                  isIconOnly
                  variant={selectedIndex === index ? "primary" : "outline"}
                  className="relative size-14 overflow-hidden rounded-xl border-white/20 p-1"
                  onPress={() => api?.scrollTo(index)}
                >
                  <Image
                    alt=""
                    className="rounded-lg object-cover"
                    draggable={false}
                    fill
                    sizes="56px"
                    src={slide.preview}
                  />
                </Button>
              ))}
            </Card.Content>
          </Card>

          <Card
            variant="transparent"
            className="absolute top-1/2 right-4 hidden -translate-y-1/2 gap-4 p-0 sm:flex"
          >
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  aria-label="Previous room"
                  isIconOnly
                  variant="outline"
                  className="size-14 rounded-full border-white/35 bg-black/20 text-white backdrop-blur"
                  onPress={() => api?.scrollPrev()}
                >
                  <ArrowLeft className="size-5" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Previous</Tooltip.Content>
            </Tooltip>

            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  aria-label="Next room"
                  isIconOnly
                  variant="outline"
                  className="size-14 rounded-full border-white/35 bg-black/20 text-white backdrop-blur"
                  onPress={() => api?.scrollNext()}
                >
                  <ArrowRight className="size-5" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Next</Tooltip.Content>
            </Tooltip>
          </Card>
        </Surface>

        <Card
          variant="transparent"
          className="relative z-10 mt-4 hidden flex-row items-center justify-between p-0 text-white/70 lg:flex"
        >
          <Card.Content className="flex-row items-center gap-2 p-0">
            <Sparkles className="size-4 text-lime-200" />
            <Typography type="body-sm" className="font-mono tracking-wide text-white/70 uppercase">
              Cinematic Archive
            </Typography>
          </Card.Content>
          <Card.Content className="flex-row items-center gap-2 p-0">
            <PlayFill className="size-4" />
            <Typography type="body-sm" className="font-mono tracking-wide text-white/70 uppercase">
              Built For Return Visits
            </Typography>
          </Card.Content>
        </Card>
      </Surface>
    </Surface>
  );
}
