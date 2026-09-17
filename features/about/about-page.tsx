"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  Chip,
  Description,
  Disclosure,
  Kbd,
  Label,
  Link,
  Meter,
  ScrollShadow,
  Separator,
  Surface,
  Tag,
  TagGroup,
  Tooltip,
  Typography,
  cn,
} from "@heroui/react";
import {
  HoverCard,
  ItemCard,
  NumberValue,
  PressableFeedback,
  Stepper,
  TextShimmer,
  Timeline,
  TrendChip,
  Widget,
} from "@heroui-pro/react";
import { KPI } from "@heroui-pro/react/kpi";
import {
  BookOpen,
  Camera,
  ChevronDown,
  CircleCheck,
  Compass,
  Cpu,
  Display,
  Persons,
  Sparkles,
} from "@gravity-ui/icons";
import { Icon } from "@iconify/react";
import {
  aboutHero,
  aboutPaths,
  aboutPerson,
  aboutPrinciples,
  aboutReadingGuide,
  aboutSignals,
  aboutTimeline,
  aboutValueMeters,
  aboutWhy,
} from "./about-content";
import { AboutHoloPass } from "./about-holo-pass";
import { bandReveal, heroContainer, heroItem, itemReveal, panelSwap } from "./about-motion";
import { AboutPersonalityBand } from "./about-personality-band";

type IdentityTab = "story" | "craft" | "values";

interface AboutPageProps {
  compact?: boolean;
}

const interestIcons = [Cpu, Display, Camera, Compass] as const;
const orbitIcons = [BookOpen, Sparkles, Display, Persons] as const;

export function AboutPage({ compact = false }: AboutPageProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [identityTab, setIdentityTab] = useState<IdentityTab>("story");
  const [orbitStep, setOrbitStep] = useState(0);
  const [focusKeys, setFocusKeys] = useState(() => new Set<string>(["capricorn", "intp", "apple"]));

  const padX = "px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-24";
  const activeOrbit = aboutPaths.steps[orbitStep] ?? aboutPaths.steps[0];

  return (
    <Surface variant="transparent" className={cn("w-full", compact ? "" : "pb-24 sm:pb-32")}>
      {!compact ? (
        <motion.div className="relative min-h-[min(92dvh,920px)] w-full overflow-hidden">
          <Surface
            variant="secondary"
            aria-hidden="true"
            className={cn(
              "border-separator/60 pointer-events-none absolute inset-0 z-0 rounded-none border-0 border-b",
              "bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_55%)]"
            )}
          >
            {null}
          </Surface>

          <Surface
            variant="transparent"
            className={cn(
              "relative z-10 grid min-h-[min(92dvh,920px)] w-full items-center gap-10 py-28 lg:grid-cols-12 lg:gap-12 lg:py-32",
              padX
            )}
          >
            <motion.div
              className="flex flex-col gap-6 lg:col-span-7"
              variants={heroContainer(shouldReduceMotion)}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={heroItem(shouldReduceMotion)}>
                <Breadcrumbs>
                  <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                  <Breadcrumbs.Item>About</Breadcrumbs.Item>
                </Breadcrumbs>
              </motion.div>

              <motion.div
                variants={heroItem(shouldReduceMotion)}
                className="flex flex-wrap items-center gap-3"
              >
                <Chip color="accent" size="sm" variant="soft">
                  {aboutHero.eyebrow}
                </Chip>
                <TextShimmer className="text-muted text-xs font-medium tracking-wide">
                  Living notebook · in progress
                </TextShimmer>
              </motion.div>

              <motion.div variants={heroItem(shouldReduceMotion)}>
                <Typography
                  type="h1"
                  weight="bold"
                  className="max-w-[18ch] text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.06em] text-balance"
                >
                  {aboutHero.titleLead} <span className="text-accent">{aboutHero.titleAccent}</span>
                </Typography>
              </motion.div>

              <motion.div variants={heroItem(shouldReduceMotion)}>
                <Description className="text-muted max-w-2xl text-base leading-7 sm:text-lg">
                  {aboutHero.subtitle}
                </Description>
              </motion.div>

              <motion.div variants={heroItem(shouldReduceMotion)}>
                <Typography color="muted" type="body-xs" className="font-mono tracking-wide">
                  {aboutHero.focusLine}
                </Typography>
              </motion.div>

              <motion.div variants={heroItem(shouldReduceMotion)}>
                <TagGroup
                  aria-label="Current focus areas"
                  selectedKeys={focusKeys}
                  selectionMode="multiple"
                  size="sm"
                  variant="surface"
                  onSelectionChange={(keys) => {
                    if (keys === "all") return;
                    setFocusKeys(new Set([...keys].map(String)));
                  }}
                >
                  <TagGroup.List className="flex-wrap">
                    {aboutHero.focusTags.map((tag) => (
                      <Tag key={tag.id} id={tag.id} textValue={tag.label}>
                        {tag.label}
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              </motion.div>

              <motion.div variants={heroItem(shouldReduceMotion)}>
                <ButtonGroup>
                  <Button
                    variant="primary"
                    onPress={() => {
                      document.getElementById("about-identity")?.scrollIntoView({
                        behavior: shouldReduceMotion ? "auto" : "smooth",
                        block: "start",
                      });
                    }}
                  >
                    <PressableFeedback.Ripple />
                    Meet the person
                  </Button>
                  <Button variant="secondary" onPress={() => router.push("/explore")}>
                    <PressableFeedback.Ripple />
                    Browse essays
                  </Button>
                </ButtonGroup>
              </motion.div>

              <motion.div
                variants={heroItem(shouldReduceMotion)}
                className="text-muted flex items-center gap-2 text-xs"
              >
                <span>Or open the command palette</span>
                <Kbd variant="light" aria-label="Control or Command K">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-col gap-5 lg:col-span-5"
              variants={heroItem(shouldReduceMotion)}
              initial="hidden"
              animate="show"
            >
              <Surface variant="transparent" className="flex justify-center lg:justify-end">
                <AboutHoloPass />
              </Surface>

              <Surface variant="transparent" className="flex flex-col gap-3">
                <Surface variant="transparent" className="flex items-center justify-between gap-3">
                  <Typography type="h3" weight="semibold" className="tracking-tight">
                    Field signals
                  </Typography>
                  <TrendChip trend="up" size="sm" variant="soft">
                    Active
                    <TrendChip.Suffix>practice</TrendChip.Suffix>
                  </TrendChip>
                </Surface>
                <Widget className="w-full">
                  <Widget.Content className="grid gap-3 sm:grid-cols-2">
                    {aboutSignals.map((signal) => (
                      <KPI key={signal.title} className="bg-surface-secondary rounded-2xl p-3">
                        <KPI.Header>
                          <KPI.Title className="text-muted text-xs tracking-wide uppercase">
                            {signal.title}
                          </KPI.Title>
                        </KPI.Header>
                        <KPI.Content>
                          <Surface variant="transparent" className="flex items-baseline gap-2">
                            <NumberValue
                              className="text-foreground text-2xl font-semibold tracking-tight tabular-nums"
                              maximumFractionDigits={0}
                              value={signal.value}
                            />
                            <Typography color="muted" type="body-xs" className="font-mono">
                              {signal.suffix}
                            </Typography>
                          </Surface>
                          <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                            {signal.detail}
                          </Typography>
                        </KPI.Content>
                      </KPI>
                    ))}
                  </Widget.Content>
                </Widget>
              </Surface>

              <Alert status="accent">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>One identity. Multiple expressions.</Alert.Title>
                  <Alert.Description>
                    Capricorn keeps the pace. INTP keeps the model. Apple keeps the desk. The rest
                    is noise I do not host.
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            </motion.div>
          </Surface>
        </motion.div>
      ) : null}

      {/* Identity */}
      <motion.section
        id="about-identity"
        className="w-full scroll-mt-28"
        variants={bandReveal(shouldReduceMotion)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
      >
        <Surface variant="transparent" className={cn("w-full py-16 sm:py-20 lg:py-24", padX)}>
          <motion.div
            variants={itemReveal(shouldReduceMotion)}
            className="mb-8 flex flex-col gap-8 lg:mb-10 lg:flex-row lg:items-center lg:justify-between"
          >
            <Surface variant="transparent" className="flex items-start gap-4">
              <Badge.Anchor>
                <Avatar size="lg" color="accent" variant="soft">
                  <Avatar.Fallback>{aboutPerson.name.charAt(0)}</Avatar.Fallback>
                </Avatar>
                <Badge color="accent" placement="bottom-right" size="sm">
                  {aboutPerson.badge}
                </Badge>
              </Badge.Anchor>
              <Surface variant="transparent" className="flex flex-col gap-1 pt-1">
                <Typography type="h2" weight="bold" className="tracking-[-0.04em]">
                  {aboutPerson.name}
                </Typography>
                <Typography color="muted" type="body-sm">
                  {aboutPerson.role}
                </Typography>
                <Surface variant="transparent" className="mt-2 flex flex-wrap gap-2">
                  <Chip size="sm" variant="secondary">
                    @{aboutPerson.handle}
                  </Chip>
                  {aboutPerson.markers.map((marker) => (
                    <Chip key={marker} size="sm" variant="soft" color="accent">
                      {marker}
                    </Chip>
                  ))}
                </Surface>
              </Surface>
            </Surface>

            {compact ? (
              <Surface variant="transparent" className="flex justify-start lg:justify-end">
                <AboutHoloPass size="compact" />
              </Surface>
            ) : null}
          </motion.div>

          <Surface
            variant="transparent"
            className="mb-8 flex flex-wrap gap-2 lg:mb-10"
            role="tablist"
            aria-label="Identity sections"
          >
            <Button
              variant={identityTab === "story" ? "primary" : "secondary"}
              onPress={() => setIdentityTab("story")}
            >
              Story
            </Button>
            <Button
              variant={identityTab === "craft" ? "primary" : "secondary"}
              onPress={() => setIdentityTab("craft")}
            >
              Craft
            </Button>
            <Button
              variant={identityTab === "values" ? "primary" : "secondary"}
              onPress={() => setIdentityTab("values")}
            >
              Values
            </Button>
          </Surface>

          <AnimatePresence mode="wait">
            {identityTab === "story" ? (
              <motion.div
                key="story"
                initial={panelSwap.initial(shouldReduceMotion)}
                animate={panelSwap.animate}
                exit={panelSwap.exit(shouldReduceMotion)}
                transition={panelSwap.transition(shouldReduceMotion)}
                className="grid gap-8 lg:grid-cols-12 lg:gap-10"
              >
                <Surface variant="transparent" className="flex flex-col gap-5 lg:col-span-7">
                  {aboutPerson.bio.map((paragraph) => (
                    <Typography
                      key={paragraph}
                      color="muted"
                      type="body"
                      className="max-w-3xl text-base leading-8"
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Surface>
                <Card variant="secondary" className="lg:col-span-5">
                  <Card.Header>
                    <Chip size="sm" variant="soft" color="accent">
                      Now
                    </Chip>
                    <Card.Title className="mt-3">What has my attention</Card.Title>
                    <Card.Description>
                      Live threads I am actively shaping across Odyssey.
                    </Card.Description>
                  </Card.Header>
                  <Card.Content className="flex flex-col gap-3">
                    {aboutPerson.now.map((item) => (
                      <ItemCard key={item.label} className="bg-surface">
                        <ItemCard.Content>
                          <ItemCard.Title>{item.label}</ItemCard.Title>
                        </ItemCard.Content>
                        <ItemCard.Action>
                          <Button size="sm" variant="ghost" onPress={() => router.push(item.href)}>
                            Open
                          </Button>
                        </ItemCard.Action>
                      </ItemCard>
                    ))}
                    <Separator className="my-1" />
                    <Surface variant="transparent" className="flex flex-wrap gap-x-4 gap-y-2">
                      {aboutPerson.elsewhere.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="no-underline"
                          {...(item.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {item.label}
                          <Link.Icon />
                        </Link>
                      ))}
                    </Surface>
                  </Card.Content>
                </Card>
              </motion.div>
            ) : null}

            {identityTab === "craft" ? (
              <motion.div
                key="craft"
                initial={panelSwap.initial(shouldReduceMotion)}
                animate={panelSwap.animate}
                exit={panelSwap.exit(shouldReduceMotion)}
                transition={panelSwap.transition(shouldReduceMotion)}
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              >
                {aboutPerson.interests.map((interest, index) => {
                  const IconCmp = interestIcons[index] ?? Compass;
                  return (
                    <ItemCard key={interest.label} className="bg-surface-secondary h-full">
                      <ItemCard.Icon>
                        <IconCmp className="size-4" />
                      </ItemCard.Icon>
                      <ItemCard.Content>
                        <ItemCard.Title>{interest.label}</ItemCard.Title>
                        <ItemCard.Description>{interest.detail}</ItemCard.Description>
                      </ItemCard.Content>
                      <ItemCard.Action>
                        <Tooltip delay={0}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={`Open ${interest.label}`}
                            onPress={() => router.push(interest.href)}
                          >
                            <Icon icon="gravity-ui:arrow-up-right-from-square" className="size-4" />
                          </Button>
                          <Tooltip.Content>Open related surface</Tooltip.Content>
                        </Tooltip>
                      </ItemCard.Action>
                    </ItemCard>
                  );
                })}
              </motion.div>
            ) : null}

            {identityTab === "values" ? (
              <motion.div
                key="values"
                initial={panelSwap.initial(shouldReduceMotion)}
                animate={panelSwap.animate}
                exit={panelSwap.exit(shouldReduceMotion)}
                transition={panelSwap.transition(shouldReduceMotion)}
                className="grid gap-4 lg:grid-cols-2"
              >
                <Surface variant="transparent" className="grid gap-3 sm:grid-cols-2">
                  {aboutPerson.values.map((value) => (
                    <HoverCard key={value.label} openDelay={80} closeDelay={100}>
                      <HoverCard.Trigger>
                        <Card variant="secondary" className="h-full cursor-default">
                          <Card.Header>
                            <Card.Title>{value.label}</Card.Title>
                            <Card.Description className="line-clamp-2">
                              {value.detail}
                            </Card.Description>
                          </Card.Header>
                        </Card>
                      </HoverCard.Trigger>
                      <HoverCard.Content className="bg-background border-separator w-72 rounded-2xl border p-4 shadow-lg">
                        <HoverCard.Arrow />
                        <Typography type="body-sm" weight="semibold">
                          {value.label}
                        </Typography>
                        <Typography color="muted" type="body-xs" className="mt-2 leading-5">
                          {value.detail} This is enforced in layout, motion, and copy decisions
                          across Odyssey.
                        </Typography>
                      </HoverCard.Content>
                    </HoverCard>
                  ))}
                </Surface>

                <Card variant="secondary">
                  <Card.Header>
                    <Chip size="sm" variant="soft" color="accent">
                      Weighting
                    </Chip>
                    <Card.Title className="mt-3">How hard these rules bind</Card.Title>
                    <Card.Description>
                      Not scores for show. Relative insistence when tradeoffs appear.
                    </Card.Description>
                  </Card.Header>
                  <Card.Content className="flex flex-col gap-5">
                    {aboutValueMeters.map((meter) => (
                      <Meter
                        key={meter.label}
                        aria-label={meter.label}
                        color={meter.color}
                        size="sm"
                        value={meter.value}
                        className="w-full"
                      >
                        <Label>{meter.label}</Label>
                        <Meter.Output />
                        <Meter.Track>
                          <Meter.Fill />
                        </Meter.Track>
                      </Meter>
                    ))}
                  </Card.Content>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Surface>
      </motion.section>

      <AboutPersonalityBand padX={padX} />

      {/* Why */}
      <motion.section
        className="w-full"
        variants={bandReveal(shouldReduceMotion, 0.04)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <Surface
          variant="secondary"
          className={cn(
            "border-separator/50 w-full rounded-none border-y py-16 sm:py-20 lg:py-24",
            padX
          )}
        >
          <Surface variant="transparent" className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <motion.div
              variants={itemReveal(shouldReduceMotion)}
              className="flex flex-col gap-5 lg:col-span-6"
            >
              <Typography type="h2" weight="bold" className="tracking-[-0.04em]">
                {aboutWhy.title}
              </Typography>
              <Typography
                type="h3"
                weight="semibold"
                className="text-accent max-w-xl tracking-tight"
              >
                {aboutWhy.lead}
              </Typography>
              {aboutWhy.paragraphs.map((paragraph) => (
                <Typography
                  key={paragraph}
                  color="muted"
                  type="body"
                  className="max-w-2xl leading-8"
                >
                  {paragraph}
                </Typography>
              ))}

              <Alert className="mt-2">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{aboutWhy.antiGoals.title}</Alert.Title>
                  <Alert.Description>{aboutWhy.antiGoals.description}</Alert.Description>
                </Alert.Content>
              </Alert>

              <Surface variant="transparent" className="mt-2 grid gap-3">
                {aboutWhy.belongings.map((item) => (
                  <ItemCard key={item.label} className="bg-surface">
                    <ItemCard.Content>
                      <ItemCard.Title>{item.label}</ItemCard.Title>
                      <ItemCard.Description>{item.description}</ItemCard.Description>
                    </ItemCard.Content>
                    <ItemCard.Action>
                      <Button size="sm" variant="secondary" onPress={() => router.push(item.href)}>
                        Visit
                      </Button>
                    </ItemCard.Action>
                  </ItemCard>
                ))}
              </Surface>
            </motion.div>

            <motion.div variants={itemReveal(shouldReduceMotion)} className="lg:col-span-6">
              <Card variant="default" className="h-full overflow-hidden">
                <Card.Header>
                  <Chip size="sm" variant="soft" color="accent">
                    Genesis arc
                  </Chip>
                  <Card.Title className="mt-3">From storage to landscape</Card.Title>
                  <Card.Description>
                    A short chronology of how Odyssey shifted from a blog metaphor into a personal
                    product.
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <ScrollShadow className="max-h-[28rem]">
                    <Timeline density="comfortable" size="md">
                      {aboutTimeline.map((event) => (
                        <Timeline.Item key={event.title} status={event.status}>
                          <Timeline.Marker aria-hidden="true" className="p-1">
                            <CircleCheck className="size-3.5" />
                          </Timeline.Marker>
                          <Timeline.Content className="gap-3 pb-8">
                            <Surface
                              variant="transparent"
                              className="flex flex-wrap items-center gap-2"
                            >
                              <time className="text-sm font-semibold">{event.time}</time>
                              <Chip color={event.tagColor} size="sm" variant="soft">
                                {event.tag}
                              </Chip>
                            </Surface>
                            <Typography type="body-sm" weight="semibold">
                              {event.title}
                            </Typography>
                            <Typography color="muted" type="body-xs" className="leading-5">
                              {event.description}
                            </Typography>
                          </Timeline.Content>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </ScrollShadow>
                </Card.Content>
              </Card>
            </motion.div>
          </Surface>
        </Surface>
      </motion.section>

      {/* Principles */}
      <motion.section
        className="w-full"
        variants={bandReveal(shouldReduceMotion, 0.06)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <Surface variant="transparent" className={cn("w-full py-16 sm:py-20 lg:py-24", padX)}>
          <motion.div variants={itemReveal(shouldReduceMotion)} className="mb-8 max-w-3xl lg:mb-10">
            <Typography type="h2" weight="bold" className="tracking-[-0.04em]">
              Principles that survive contact with the page
            </Typography>
            <Description className="text-muted mt-3 text-base leading-7">
              These are not slogans. They are filters used when choosing layout, motion, copy, and
              engineering tradeoffs.
            </Description>
          </motion.div>

          <motion.div variants={itemReveal(shouldReduceMotion)}>
            <Accordion className="w-full" defaultExpandedKeys={["0"]}>
              {aboutPrinciples.map((principle, index) => (
                <Accordion.Item key={principle.title} id={String(index)}>
                  <Accordion.Heading>
                    <Accordion.Trigger>
                      <span className="text-muted me-3 font-mono text-xs tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {principle.title}
                      <Accordion.Indicator>
                        <ChevronDown />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <Surface
                        variant="transparent"
                        className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between"
                      >
                        <Typography color="muted" type="body-sm" className="max-w-3xl leading-7">
                          {principle.description}
                        </Typography>
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => router.push(principle.href)}
                        >
                          <PressableFeedback.Ripple />
                          {principle.linkLabel}
                        </Button>
                      </Surface>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            variants={itemReveal(shouldReduceMotion)}
            className="mt-12 grid gap-4 lg:grid-cols-3"
          >
            {aboutReadingGuide.map((tip) => (
              <Disclosure key={tip.id} defaultExpanded={tip.id === "first-visit"}>
                <Disclosure.Heading>
                  <Button slot="trigger" variant="secondary" className="w-full justify-between">
                    {tip.title}
                    <Disclosure.Indicator />
                  </Button>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body className="bg-surface-secondary rounded-2xl p-4">
                    <Typography color="muted" type="body-sm" className="leading-6">
                      {tip.body}
                    </Typography>
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            ))}
          </motion.div>
        </Surface>
      </motion.section>

      {/* Paths */}
      {!compact ? (
        <motion.section
          className="w-full"
          variants={bandReveal(shouldReduceMotion, 0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
        >
          <Surface
            variant="secondary"
            className={cn(
              "border-separator/50 w-full rounded-none border-t py-16 sm:py-20 lg:py-24",
              padX
            )}
          >
            <motion.div
              variants={itemReveal(shouldReduceMotion)}
              className="mb-10 flex flex-col gap-3 lg:mb-12"
            >
              <Typography type="h2" weight="bold" className="tracking-[-0.04em]">
                {aboutPaths.title}
              </Typography>
              <Description className="text-muted max-w-2xl text-base leading-7">
                {aboutPaths.description}
              </Description>
            </motion.div>

            <motion.div
              variants={itemReveal(shouldReduceMotion)}
              className="grid items-start gap-8 lg:grid-cols-12"
            >
              <Card variant="default" className="lg:col-span-5">
                <Card.Header>
                  <Chip size="sm" variant="soft" color="accent">
                    Orbit guide
                  </Chip>
                  <Card.Title className="mt-3">Pick a first move</Card.Title>
                  <Card.Description>
                    Step through intents. Each one opens a different Odyssey surface.
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <Stepper
                    currentStep={orbitStep}
                    orientation="vertical"
                    size="md"
                    onStepChange={setOrbitStep}
                  >
                    {aboutPaths.steps.map((step, index) => {
                      const OrbitIcon = orbitIcons[index] ?? Compass;
                      return (
                        <Stepper.Step key={step.title}>
                          <Stepper.Indicator>
                            <Stepper.Icon>
                              <OrbitIcon />
                            </Stepper.Icon>
                          </Stepper.Indicator>
                          <Stepper.Content className="flex-1">
                            <Stepper.Title>{step.title}</Stepper.Title>
                            <Stepper.Description>{step.description}</Stepper.Description>
                          </Stepper.Content>
                          <Stepper.Separator />
                        </Stepper.Step>
                      );
                    })}
                  </Stepper>
                </Card.Content>
              </Card>

              <Card variant="default" className="lg:col-span-7">
                <Card.Header>
                  <Typography color="muted" type="body-xs" className="font-mono">
                    {String(orbitStep + 1).padStart(2, "0")} /{" "}
                    {String(aboutPaths.steps.length).padStart(2, "0")}
                  </Typography>
                  <Card.Title className="mt-3 text-3xl tracking-tight">
                    {activeOrbit.title}
                  </Card.Title>
                  <Card.Description className="text-base leading-7">
                    {activeOrbit.description}
                  </Card.Description>
                </Card.Header>
                <Card.Footer className="flex flex-wrap gap-3">
                  <Button variant="primary" onPress={() => router.push(activeOrbit.href)}>
                    <PressableFeedback.Ripple />
                    {activeOrbit.cta}
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={orbitStep >= aboutPaths.steps.length - 1}
                    onPress={() =>
                      setOrbitStep((current) => Math.min(aboutPaths.steps.length - 1, current + 1))
                    }
                  >
                    <PressableFeedback.Ripple />
                    Next orbit
                  </Button>
                </Card.Footer>
              </Card>
            </motion.div>

            <motion.div
              variants={itemReveal(shouldReduceMotion)}
              className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {aboutPaths.steps.map((step, index) => (
                <Card
                  key={step.title}
                  variant={orbitStep === index ? "secondary" : "default"}
                  className="h-full"
                >
                  <Card.Header>
                    <Typography color="muted" type="body-xs" className="font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </Typography>
                    <Card.Title className="mt-2 tracking-tight">{step.title}</Card.Title>
                    <Card.Description>{step.description}</Card.Description>
                  </Card.Header>
                  <Card.Footer>
                    <Button
                      fullWidth
                      size="sm"
                      variant={orbitStep === index ? "primary" : "tertiary"}
                      onPress={() => setOrbitStep(index)}
                    >
                      <PressableFeedback.Ripple />
                      {orbitStep === index ? "Selected" : "Select orbit"}
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </motion.div>

            <motion.div
              variants={itemReveal(shouldReduceMotion)}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {aboutPaths.secondary.map((item) => (
                <Link key={item.href} href={item.href} className="no-underline">
                  {item.label}
                  <Link.Icon />
                </Link>
              ))}
            </motion.div>
          </Surface>
        </motion.section>
      ) : null}
    </Surface>
  );
}
