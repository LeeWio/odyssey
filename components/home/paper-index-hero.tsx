"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { Button, Card, Chip, ProgressBar, Separator, Surface, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { OffMapGlobe } from "@/components/home/off-map-globe";

const easeOut = [0.23, 1, 0.32, 1] as const;

type PaperIndexHeroProps = {
  onNavigate: (panelIndex: number) => void;
  reducedMotion: boolean;
};

const entrance = (reducedMotion: boolean, delay: number) => ({
  initial: reducedMotion ? false : { y: 20 },
  animate: { y: 0 },
  transition: { duration: 0.58, delay, ease: easeOut },
});

const routes = [
  {
    index: "01",
    title: "Follow a thread",
    copy: "Trace a line of thought across time.",
    icon: "ph:arrow-up-right",
    panelIndex: 1,
    color: "accent",
  },
  {
    index: "02",
    title: "Open the notebook",
    copy: "Raw notes, half-formed ideas, sketches.",
    icon: "ph:notebook",
    panelIndex: 2,
    color: "default",
  },
  {
    index: "03",
    title: "Go off-map",
    copy: "Places, people, and things that shaped me.",
    icon: "ph:globe-hemisphere-west",
    panelIndex: 3,
    color: "warning",
  },
] as const;

const signals = [
  ["07.18", "Today"],
  ["48", "Notes"],
  ["03", "Trails"],
] as const;

const notebookItems = [
  ["Listening", "Ólafur Arnalds / re:member"],
  ["Market", "AAPL 193.42 +0.67%"],
  ["Build log", "Interface systems and routes"],
] as const;

export function PaperIndexHero({ onNavigate, reducedMotion }: PaperIndexHeroProps) {
  return (
    <Surface
      id="odyssey"
      aria-labelledby="odyssey-title"
      className="relative flex h-full w-screen shrink-0 flex-col overflow-y-auto pt-16"
      variant="default"
    >
      <div className="relative grid min-h-[calc(100dvh-4rem)] grid-rows-[1fr_auto]">
        <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 lg:py-8 xl:px-16">
          <motion.div {...entrance(reducedMotion, 0.04)}>
            <Card
              className="flex min-h-[34rem] justify-between sm:p-7 lg:min-h-full"
              variant="default"
            >
              <Card.Header className="items-start">
                <Chip color="accent" size="sm" variant="soft">
                  <Icon aria-hidden="true" icon="ph:circle-fill" width={6} />
                  <Chip.Label>Living index / private atlas</Chip.Label>
                </Chip>
              </Card.Header>

              <Card.Content className="gap-7">
                <Typography
                  id="odyssey-title"
                  className="max-w-[10ch] text-6xl italic sm:text-7xl lg:text-8xl xl:text-[6.4rem]"
                  render={({ children, ...props }) => <h1 {...props}>{children}</h1>}
                  type="h1"
                >
                  The world scrolls.
                  <span className="block">I stay.</span>
                </Typography>
                <Typography className="max-w-md" color="muted" type="body">
                  A calm command center for things noticed, made, questioned, and kept.
                </Typography>
              </Card.Content>

              <Card.Footer className="flex flex-col items-stretch gap-5">
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onPress={() => onNavigate(1)}>
                    Start reading
                    <Icon aria-hidden="true" icon="ph:arrow-right" />
                  </Button>
                  <Button size="lg" variant="secondary" onPress={() => onNavigate(2)}>
                    <Icon aria-hidden="true" icon="ph:notebook" />
                    Open notebook
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {signals.map(([value, label]) => (
                    <Card key={label} className="gap-1 p-3" variant="secondary">
                      <Typography type="code" weight="semibold">
                        {value}
                      </Typography>
                      <Typography color="muted" type="body-xs">
                        {label}
                      </Typography>
                    </Card>
                  ))}
                </div>
              </Card.Footer>
            </Card>
          </motion.div>

          <motion.div {...entrance(reducedMotion, 0.1)}>
            <Card className="min-h-full gap-0 p-0" variant="secondary">
              <Card.Header className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip color="accent" size="sm" variant="primary">
                    <Chip.Label>01</Chip.Label>
                  </Chip>
                  <Chip color="warning" size="sm" variant="primary">
                    <Chip.Label>02</Chip.Label>
                  </Chip>
                  <Chip color="default" size="sm" variant="primary">
                    <Chip.Label>03</Chip.Label>
                  </Chip>
                </div>
                <Typography color="muted" type="code">
                  index.preview
                </Typography>
              </Card.Header>

              <Separator />

              <Card.Content className="grid gap-3 p-3 md:grid-cols-5 md:grid-rows-[minmax(13rem,1.05fr)_minmax(12rem,.95fr)]">
                <Card
                  className="relative min-h-80 overflow-hidden p-0 md:col-span-3 md:row-span-2"
                  variant="tertiary"
                >
                  <Image
                    fill
                    priority
                    alt="Clouds drifting through a dark mountain range beside still water"
                    className="object-cover"
                    sizes="(max-width: 767px) 90vw, 43vw"
                    src="/ChatGPT Image Jul 15, 2026, 11_55_41 PM.png"
                  />
                  <Card.Content className="absolute inset-x-0 bottom-0 z-10 gap-4 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <Chip color="default" size="sm" variant="soft">
                      CHRONICLE / FOUND 07.14
                    </Chip>
                    <Typography
                      className="max-w-lg"
                      render={({ children, ...props }) => <h2 {...props}>{children}</h2>}
                      type="h2"
                    >
                      An archive that stays still long enough to notice patterns.
                    </Typography>
                    <div className="flex items-center justify-between gap-4">
                      <Typography className="max-w-sm text-white/75" type="body-sm">
                        Essays, objects, fragments, and routes arranged as a living index.
                      </Typography>
                      <Button
                        isIconOnly
                        aria-label="Open the chronicle"
                        size="lg"
                        variant="secondary"
                        onPress={() => onNavigate(1)}
                      >
                        <Icon aria-hidden="true" icon="ph:arrow-right" />
                      </Button>
                    </div>
                  </Card.Content>
                </Card>

                <Card variant="default" className="md:col-span-2">
                  <Card.Header className="flex-row items-start justify-between gap-4">
                    <div>
                      <Chip color="accent" size="sm" variant="soft">
                        A THOUGHT
                      </Chip>
                      <Typography
                        className="mt-4 italic"
                        render={({ children, ...props }) => (
                          <blockquote {...props}>{children}</blockquote>
                        )}
                        type="h3"
                      >
                        We don&apos;t see things as they are, we see things as we are.
                      </Typography>
                    </div>
                    <Button
                      isIconOnly
                      aria-label="Open thought"
                      size="md"
                      variant="secondary"
                      onPress={() => onNavigate(1)}
                    >
                      <Icon aria-hidden="true" icon="ph:arrow-right" />
                    </Button>
                  </Card.Header>
                  <Card.Content>
                    <ProgressBar aria-label="Thought progress" color="accent" size="sm" value={64}>
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </Card.Content>
                </Card>

                <Card variant="default" className="md:col-span-2">
                  <Card.Header className="flex-row items-center justify-between">
                    <Chip color="default" size="sm" variant="soft">
                      NOTEBOOK
                    </Chip>
                    <Chip color="success" size="sm" variant="soft">
                      synced
                    </Chip>
                  </Card.Header>
                  <Card.Content className="gap-0">
                    {notebookItems.map(([label, value], index) => (
                      <div key={label}>
                        {index > 0 && <Separator />}
                        <div className="grid grid-cols-[5rem_1fr] gap-3 py-3">
                          <Typography color="muted" type="code">
                            {label}
                          </Typography>
                          <Typography type="body-sm">{value}</Typography>
                        </div>
                      </div>
                    ))}
                  </Card.Content>
                </Card>
              </Card.Content>
            </Card>
          </motion.div>
        </div>

        <Separator />

        <div className="relative grid md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <Surface
            className="flex min-h-40 items-center px-5 py-5 sm:px-8 lg:px-12 xl:px-16"
            variant="transparent"
          >
            <Typography
              className="max-w-[10ch] text-5xl sm:text-6xl"
              render={({ children, ...props }) => <h2 {...props}>{children}</h2>}
              type="h2"
            >
              Where do you want to wander?
            </Typography>
          </Surface>

          {routes.map((route, index) => {
            const isOffMap = route.title === "Go off-map";

            return (
              <motion.div
                key={route.title}
                initial={reducedMotion ? false : { y: 14 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.46, delay: 0.22 + index * 0.06, ease: easeOut }}
                whileHover={reducedMotion ? undefined : { y: -3 }}
                whileTap={reducedMotion ? undefined : { scale: 0.985 }}
              >
                <Button
                  fullWidth
                  className="relative min-h-40 justify-between overflow-hidden text-left"
                  size="lg"
                  variant="ghost"
                  onPress={() => onNavigate(route.panelIndex)}
                >
                  {isOffMap && (
                    <>
                      <OffMapGlobe />
                      <span
                        aria-hidden="true"
                        className="bg-surface/75 pointer-events-none absolute inset-0 z-10"
                      />
                    </>
                  )}
                  <span className="relative z-20 flex flex-col items-start gap-2">
                    <Chip color={route.color} size="sm" variant="soft">
                      {route.index}
                    </Chip>
                    <Typography
                      render={({ children, ...props }) => <span {...props}>{children}</span>}
                      type="h5"
                    >
                      {route.title}
                    </Typography>
                    <Typography color="muted" type="body-sm">
                      {route.copy}
                    </Typography>
                  </span>
                  <Icon aria-hidden="true" className="relative z-20" icon={route.icon} />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
