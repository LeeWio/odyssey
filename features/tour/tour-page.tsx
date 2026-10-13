"use client";

import { pageEaseOut } from "@/lib/motion";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Card, Chip, Typography, buttonVariants, cn } from "@heroui/react";
import { Stepper } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

const TOUR_STEPS = [
  {
    title: "先读一篇",
    description: "东鳞西爪",
    icon: "gravity-ui:file-text",
    heading: "从一篇文章开始",
    body: "长的、短的、还没写完的，都在东鳞西爪。点开一篇，读完再决定要不要继续。",
    badge: "读",
    href: "/single",
    action: "去东鳞西爪",
  },
  {
    title: "看路上的光",
    description: "图库和足迹",
    icon: "gravity-ui:picture",
    heading: "照片和落过脚的地方",
    body: "图库是相机不肯删的几张。足迹从湖北老家出去，点一个点，看那一程。",
    badge: "看",
    href: "/gallery",
    action: "去看看",
  },
  {
    title: "看桌上",
    description: "还在用的东西",
    icon: "gravity-ui:layers",
    heading: "桌上这些",
    body: "硬件和软件还在用的那一份。少一点，就够了。已经交出去的项目在旁边。",
    badge: "用",
    href: "/uses",
    action: "看桌上",
  },
  {
    title: "留一句",
    description: "墙上",
    icon: "gravity-ui:comment",
    heading: "留一句也行",
    body: "问题、一句观察、一个有用的链接。写完会先看过，再出现在墙上。",
    badge: "写",
    href: "/guestbook",
    action: "去墙上",
  },
];

export function TourPage() {
  const [activeStep, setActiveStep] = useState(0);
  const totalSteps = TOUR_STEPS.length;

  const handleNext = () => {
    setActiveStep((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const activeContent = TOUR_STEPS[activeStep] || TOUR_STEPS[0];

  return (
    <div className="bg-background min-h-[100dvh] w-full px-4 pt-28 pb-24 md:px-6 lg:pt-32 xl:px-8">
      <div className="flex w-full flex-col gap-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: pageEaseOut }}
          className="max-w-xl"
        >
          <Chip color="accent" size="sm" variant="soft">
            四步
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
          >
            从哪开始
          </Typography>
          <Typography color="muted" type="body" className="mt-4 leading-7">
            读一篇，看几张照片，看桌上，或者留一句。
          </Typography>
        </motion.header>

        {/* Multi-step controlled workspace grid */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
          {/* Left Column: Vertical Stepper Navigation */}
          <Card variant="secondary" className="min-h-[24rem] p-6">
            <Stepper
              currentStep={activeStep}
              orientation="vertical"
              size="lg"
              onStepChange={setActiveStep}
            >
              {TOUR_STEPS.map((s) => {
                return (
                  <Stepper.Step key={s.title}>
                    <Stepper.Indicator>
                      <Stepper.Icon>
                        <Icon icon={s.icon} className="size-4" />
                      </Stepper.Icon>
                    </Stepper.Indicator>
                    <Stepper.Content className="flex-1">
                      <Stepper.Title className="text-sm font-semibold">{s.title}</Stepper.Title>
                      <Stepper.Description className="text-xs">{s.description}</Stepper.Description>
                    </Stepper.Content>
                    <Stepper.Separator />
                  </Stepper.Step>
                );
              })}
            </Stepper>
          </Card>

          {/* Right Column: Dynamic Screen Content */}
          <Card
            variant="secondary"
            className="flex min-h-[24rem] flex-col justify-between p-6 md:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: pageEaseOut }}
                className="flex flex-col gap-6"
              >
                {/* Badge & Step indicator */}
                <div className="flex items-center justify-between">
                  <Chip size="sm" variant="soft" color="accent">
                    {activeContent.badge}
                  </Chip>
                  <span className="text-muted text-xs tabular-nums">
                    {activeStep + 1} / {totalSteps}
                  </span>
                </div>

                {/* Heading details */}
                <div className="flex flex-col gap-3">
                  <Typography
                    type="h3"
                    weight="bold"
                    className="flex items-center gap-3 tracking-tight"
                  >
                    <Icon icon={activeContent.icon} className="text-accent size-6 shrink-0" />
                    {activeContent.heading}
                  </Typography>
                  <Typography
                    color="muted"
                    type="body"
                    className="text-foreground/85 text-sm leading-relaxed"
                  >
                    {activeContent.body}
                  </Typography>
                </div>

                {/* Sub-navigation buttons / Actions inside card content */}
                <div className="flex gap-3">
                  <Link
                    href={activeContent.href}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "sm" }),
                      "no-underline"
                    )}
                  >
                    {activeContent.action}
                    <Icon icon="gravity-ui:arrow-right" className="size-3.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Stepper Programmatic control row */}
            <div className="border-default-100/60 mt-8 flex items-center justify-between border-t pt-5">
              <Button
                variant="outline"
                size="sm"
                isDisabled={activeStep === 0}
                onPress={handleBack}
              >
                <Icon icon="gravity-ui:chevron-left" aria-hidden="true" />
                上一步
              </Button>

              <Button
                variant="primary"
                size="sm"
                isDisabled={activeStep === totalSteps - 1}
                onPress={handleNext}
              >
                下一步
                <Icon icon="gravity-ui:chevron-right" aria-hidden="true" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
