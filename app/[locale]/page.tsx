"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useSpring } from "motion/react";
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
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, filter: "blur(12px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth spring for the spotlight
  const springX = useSpring(0, { stiffness: 50, damping: 20 });
  const springY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
        springX.set(x);
        springY.set(y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [springX, springY]);

  return (
    <motion.main
      ref={containerRef}
      className="selection:bg-accent-soft-hover relative z-10 mx-auto flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-center font-sans md:px-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Interactive Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 hidden opacity-50 mix-blend-screen md:block dark:opacity-30 dark:mix-blend-lighten"
        style={{
          background: `radial-gradient(circle 600px at ${springX.get()}px ${springY.get()}px, rgba(255,255,255,0.08), transparent 80%)`,
        }}
      />

      {/* Cinematic Ambient Glow - Dormant Breathing */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="bg-accent absolute top-[-10%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.02, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="bg-default absolute top-[20%] right-[-5%] h-[600px] w-[600px] rounded-full blur-[120px]"
        />
      </div>

      {/* Hero Title */}
      <motion.h1
        variants={itemVariants}
        className="relative z-10 text-[4rem] leading-[1.05] font-extrabold tracking-tight md:text-[7rem] lg:text-[9rem]"
      >
        <span className="text-default-400 dark:text-default-600 block transition-colors duration-1000">
          Don’t just do it
        </span>
        <span
          className={`text-accent font-normal italic ${playfair.className} relative inline-block`}
        >
          do it well.
        </span>
      </motion.h1>

      {/* Decorative Chips */}
      <motion.div
        variants={itemVariants}
        className="relative z-10 mt-12 flex flex-wrap justify-center gap-4"
      >
        <Chip variant="secondary" color="default" size="md">
          <span className="text-default-500 flex items-center gap-2 font-medium">
            <Icon icon="lucide:target" className="size-4" />
            <span>Intention</span>
          </span>
        </Chip>
        <Chip variant="secondary" color="default" size="md">
          <span className="text-default-500 flex items-center gap-2 font-medium">
            <Icon icon="lucide:settings-2" className="size-4" />
            <span>Execution</span>
          </span>
        </Chip>
        <Chip variant="secondary" color="default" size="md">
          <span className="text-default-500 flex items-center gap-2 font-medium">
            <Icon icon="lucide:sparkles" className="size-4" />
            <span>Excellence</span>
          </span>
        </Chip>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="relative z-10 mt-16 flex w-full flex-col items-center justify-center gap-6 sm:w-auto sm:flex-row"
      >
        <Button variant="primary" size="lg">
          Explore Work
          <Icon icon="lucide:arrow-right" />
        </Button>
        <Button variant="secondary" size="lg">
          Read Philosophy
        </Button>
      </motion.div>

      {/* The Proof Scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="group absolute bottom-8 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3"
      >
        <span className="text-default-400 group-hover:text-foreground text-[9px] font-bold tracking-[0.3em] uppercase transition-colors duration-500">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Icon
            icon="lucide:arrow-down"
            className="text-default-400 group-hover:text-foreground size-4 transition-colors duration-500"
          />
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
