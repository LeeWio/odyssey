"use client";

import React from "react";
import { motion } from "motion/react";
import { Button, Chip } from "@heroui/react";
import { Playfair_Display } from "next/font/google";
import { Icon } from "@iconify/react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Home() {
  return (
    <motion.main
      className="selection:bg-primary/20 relative z-10 mx-auto flex min-h-screen w-full flex-col items-center justify-center px-6 text-center font-sans md:px-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1
        variants={itemVariants}
        className="text-foreground text-[4rem] leading-[1.05] font-extrabold tracking-tight md:text-[7rem] lg:text-[9rem]"
      >
        Don’t just do it — <br />
        <span className={`text-primary font-normal italic ${playfair.className}`}>do it well.</span>
      </motion.h1>

      <motion.div variants={itemVariants} className="mt-12 flex flex-wrap justify-center gap-4">
        <Chip variant="soft" color="accent" size="md">
          <span className="flex items-center gap-2 font-medium">
            <Icon icon="lucide:layers" className="size-4" />
            <span>Next-Gen Architecture</span>
          </span>
        </Chip>
        <Chip variant="soft" color="success" size="md">
          <span className="flex items-center gap-2 font-medium">
            <Icon icon="lucide:monitor-smartphone" className="size-4" />
            <span>Pixel Perfect</span>
          </span>
        </Chip>
        <Chip variant="soft" color="warning" size="md">
          <span className="flex items-center gap-2 font-medium">
            <Icon icon="lucide:rocket" className="size-4" />
            <span>Performance First</span>
          </span>
        </Chip>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-16 flex w-full flex-col items-center justify-center gap-6 sm:w-auto sm:flex-row"
      >
        <Button variant="primary" size="lg" className="w-full sm:w-auto">
          Explore Work
          <Icon icon="lucide:arrow-right" className="size-5" />
        </Button>
        <Button variant="secondary" size="lg" className="w-full sm:w-auto">
          Read Philosophy
        </Button>
      </motion.div>
    </motion.main>
  );
}
