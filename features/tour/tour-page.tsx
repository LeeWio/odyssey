"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, Chip, Typography, buttonVariants, cn } from "@heroui/react";
import { Stepper } from "@heroui-pro/react";
import {
  Compass,
  Sparkles,
  Monitor,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const easeOut = [0.22, 1, 0.36, 1] as const;

const TOUR_STEPS = [
  {
    title: "Welcome to Odyssey",
    description: "The core vision and philosophy",
    icon: Compass,
    heading: "A Connected Digital Notebook",
    body: "Odyssey is a personal knowledge product designed as a living universe. Unlike flat chronological blogs, Odyssey maps knowledge dynamically as a spatial ecosystem of interconnected stars, topics, and essays.",
    badge: "VISION",
  },
  {
    title: "Planetary Constellations",
    description: "Our 3D interactive knowledge space",
    icon: Sparkles,
    heading: "The 3D Interactive Map",
    body: "Step into our immersive three-dimensional constellations space to explore articles physically! Stars are mapped to categories like Creative, Design, and Systems, surrounded by glowing space dust and orbiting article satellites.",
    badge: "INTERACTIVE R3F",
  },
  {
    title: "The Creator Rig",
    description: "Physical hardware & workspace staples",
    icon: Monitor,
    heading: "Workspace利器 & Tools",
    body: 'Browse our comprehensive Uses page to inspect the mechanical keys, 16" MacBook Pro M3 Max, 5K Studio Display, Ghostty terminal, and development utilities powering our low-level RTOS and graphics compilation workflows.',
    badge: "TOOLKIT",
  },
  {
    title: "Complete the Orbit",
    description: "Unleash the full experience",
    icon: CheckCircle2,
    heading: "You're Ready to Explore",
    body: "Now that you understand the coordinate system, launch the AI Copilot to ask questions, explore the milestone Roadmap, schedule deep focus blocks in the Planner, or leave a note in the moderated Guestbook!",
    badge: "MISSION COMPLETE",
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
  const IconComponent = activeContent.icon;

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="border-default-200/50 mb-16 flex flex-col items-center border-b pb-8 text-center"
        >
          <Chip color="accent" size="sm" variant="soft" className="gap-1.5 pl-2">
            <Compass className="text-accent size-3" />
            Interactive Onboarding
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Odyssey Workspace Tour
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            A step-by-step guided journey detailing how Odyssey connects systems, design, and
            physical tools.
          </Typography>
        </motion.header>

        {/* Multi-step controlled workspace grid */}
        <div className="mt-10 grid items-start gap-8 md:grid-cols-12">
          {/* Left Column: Vertical Stepper Navigation */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/20 min-h-[380px] rounded-2xl border p-6 shadow-sm md:col-span-5"
          >
            <div className="mb-6">
              <span className="text-muted/60 font-mono text-xs font-bold tracking-wider uppercase">
                JOURNEY PROGRESS
              </span>
            </div>

            <Stepper
              currentStep={activeStep}
              orientation="vertical"
              size="lg"
              onStepChange={setActiveStep}
            >
              {TOUR_STEPS.map((s) => {
                const StepIcon = s.icon;
                return (
                  <Stepper.Step key={s.title}>
                    <Stepper.Indicator>
                      <Stepper.Icon>
                        <StepIcon className="size-4" />
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
            className="border-default-200/50 bg-surface-secondary/10 flex min-h-[380px] flex-col justify-between rounded-2xl border p-6 shadow-sm md:col-span-7 md:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="flex flex-col gap-6"
              >
                {/* Badge & Step indicator */}
                <div className="flex items-center justify-between">
                  <Chip size="sm" variant="soft" color="accent">
                    {activeContent.badge}
                  </Chip>
                  <span className="text-muted/50 font-mono text-xs font-semibold uppercase">
                    STEP {activeStep + 1} OF {totalSteps}
                  </span>
                </div>

                {/* Heading details */}
                <div className="flex flex-col gap-3">
                  <Typography
                    type="h3"
                    weight="bold"
                    className="flex items-center gap-3 tracking-tight"
                  >
                    <IconComponent className="text-accent size-6 shrink-0" />
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
                {activeStep === 0 && (
                  <div className="flex gap-3">
                    <Link
                      href="/about"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "gap-1.5 no-underline"
                      )}
                    >
                      Read Core Story
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="flex gap-3">
                    <Link
                      href="/constellations"
                      className={cn(
                        buttonVariants({ variant: "primary", size: "sm" }),
                        "bg-accent gap-1.5 border-none text-white no-underline"
                      )}
                    >
                      Launch 3D Universe
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="flex gap-3">
                    <Link
                      href="/uses"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "gap-1.5 no-underline"
                      )}
                    >
                      Browse Uses Desk
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                )}
                {activeStep === 3 && (
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/copilot"
                      className={cn(
                        buttonVariants({ variant: "primary", size: "sm" }),
                        "bg-accent gap-1.5 border-none text-white no-underline"
                      )}
                    >
                      Chat with Copilot
                    </Link>
                    <Link
                      href="/guestbook"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "gap-1.5 no-underline"
                      )}
                    >
                      Leave visitor log
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stepper Programmatic control row */}
            <div className="border-default-100/60 mt-8 flex items-center justify-between border-t pt-5">
              <button
                disabled={activeStep === 0}
                onClick={handleBack}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "flex items-center justify-center gap-1.5 disabled:opacity-50"
                )}
              >
                <ChevronLeft className="size-4" />
                Back
              </button>

              <button
                disabled={activeStep === totalSteps - 1}
                onClick={handleNext}
                className={cn(
                  buttonVariants({ variant: "primary", size: "sm" }),
                  "flex items-center justify-center gap-1.5 disabled:opacity-50"
                )}
              >
                Continue
                <ChevronRight className="size-4" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
