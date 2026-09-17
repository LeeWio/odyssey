"use client";

import { motion, useReducedMotion } from "motion/react";
import { Alert, Card, Chip, Description, Surface, Typography, cn } from "@heroui/react";
import { ItemCard } from "@heroui-pro/react";
import { Display, LogoApple, Shield, Xmark } from "@gravity-ui/icons";
import { aboutAxes, aboutPlatformCreed } from "./about-content";
import { bandReveal, itemReveal } from "./about-motion";

interface AboutPersonalityBandProps {
  padX: string;
}

export function AboutPersonalityBand({ padX }: AboutPersonalityBandProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.section
      className="w-full"
      variants={bandReveal(shouldReduceMotion, 0.03)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
    >
      <Surface
        variant="secondary"
        className={cn(
          "border-separator/50 w-full rounded-none border-y py-16 sm:py-20 lg:py-24",
          padX
        )}
      >
        <motion.div variants={itemReveal(shouldReduceMotion)} className="mb-12 max-w-3xl">
          <Typography type="h2" weight="bold" className="tracking-[-0.045em]">
            {aboutAxes.title}
          </Typography>
          <Description className="text-muted mt-4 text-base leading-7">
            {aboutAxes.lead}
          </Description>
        </motion.div>

        <Surface variant="transparent" className="grid gap-0 lg:grid-cols-2">
          {aboutAxes.poles.map((pole, index) => (
            <motion.div
              key={pole.id}
              variants={itemReveal(shouldReduceMotion)}
              className={cn(
                "flex flex-col gap-5 py-8 lg:py-4",
                index === 0 ? "lg:pr-12" : "lg:border-separator/60 lg:border-l lg:pl-12"
              )}
            >
              <Surface variant="transparent" className="flex flex-wrap items-baseline gap-3">
                <Typography
                  type="h3"
                  weight="bold"
                  className="text-[clamp(2rem,4vw,3.25rem)] tracking-[-0.05em]"
                >
                  {pole.label}
                </Typography>
                <Chip size="sm" variant="soft" color={pole.chipColor}>
                  {pole.tag}
                </Chip>
              </Surface>
              <Typography color="muted" type="body" className="max-w-md text-base leading-8">
                {pole.body}
              </Typography>
              <Surface variant="transparent" className="flex flex-col gap-2">
                {pole.lines.map((line) => (
                  <Typography
                    key={line}
                    type="body-sm"
                    className="text-foreground/90 font-medium tracking-tight"
                  >
                    {line}
                  </Typography>
                ))}
              </Surface>
            </motion.div>
          ))}
        </Surface>

        <motion.div variants={itemReveal(shouldReduceMotion)} className="mt-10">
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{aboutAxes.collision.title}</Alert.Title>
              <Alert.Description>{aboutAxes.collision.body}</Alert.Description>
            </Alert.Content>
          </Alert>
        </motion.div>
      </Surface>

      <Surface variant="transparent" className={cn("w-full py-16 sm:py-20 lg:py-24", padX)}>
        <motion.div
          variants={itemReveal(shouldReduceMotion)}
          className="grid gap-10 lg:grid-cols-12 lg:gap-14"
        >
          <Surface variant="transparent" className="flex flex-col gap-5 lg:col-span-5">
            <Typography type="h2" weight="bold" className="tracking-[-0.045em]">
              {aboutPlatformCreed.title}
            </Typography>
            <Typography
              type="h3"
              weight="semibold"
              className="max-w-sm text-2xl tracking-tight text-balance"
            >
              {aboutPlatformCreed.punch}
            </Typography>
            <Typography color="muted" type="body" className="max-w-md leading-8">
              {aboutPlatformCreed.body}
            </Typography>
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{aboutPlatformCreed.refuseTitle}</Alert.Title>
                <Alert.Description>{aboutPlatformCreed.refuseBody}</Alert.Description>
              </Alert.Content>
            </Alert>
          </Surface>

          <Surface variant="transparent" className="flex flex-col gap-6 lg:col-span-7">
            <Card variant="secondary">
              <Card.Header>
                <Chip size="sm" variant="soft" color="success">
                  Keep
                </Chip>
                <Card.Title className="mt-3">The stack I will not renegotiate</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-2">
                {aboutPlatformCreed.keep.map((item) => (
                  <ItemCard key={item.label} variant="transparent">
                    <ItemCard.Icon>
                      {item.kind === "apple" ? (
                        <LogoApple className="size-4" />
                      ) : (
                        <Display className="size-4" />
                      )}
                    </ItemCard.Icon>
                    <ItemCard.Content>
                      <ItemCard.Title>{item.label}</ItemCard.Title>
                      <ItemCard.Description>{item.detail}</ItemCard.Description>
                    </ItemCard.Content>
                  </ItemCard>
                ))}
              </Card.Content>
            </Card>

            <Card variant="secondary">
              <Card.Header>
                <Chip size="sm" variant="soft" color="danger">
                  Refuse
                </Chip>
                <Card.Title className="mt-3">Things I will not pretend to like</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-2">
                {aboutPlatformCreed.refuse.map((item) => (
                  <ItemCard key={item.label} variant="transparent">
                    <ItemCard.Icon>
                      <Xmark className="text-danger size-4" />
                    </ItemCard.Icon>
                    <ItemCard.Content>
                      <ItemCard.Title>{item.label}</ItemCard.Title>
                      <ItemCard.Description>{item.detail}</ItemCard.Description>
                    </ItemCard.Content>
                  </ItemCard>
                ))}
              </Card.Content>
            </Card>

            <Surface
              variant="transparent"
              className="border-separator/60 flex items-start gap-3 border-t pt-5"
            >
              <Shield className="text-muted mt-0.5 size-4 shrink-0" />
              <Typography color="muted" type="body-sm" className="leading-6">
                {aboutPlatformCreed.footnote}
              </Typography>
            </Surface>
          </Surface>
        </motion.div>
      </Surface>
    </motion.section>
  );
}
