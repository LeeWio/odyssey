"use client";

import * as React from "react";
import { motion, Variants } from "motion/react";
import { IconSvgProps } from "@/types";

/**
 * A bold, premium, and highly legible animated logo for "Odyssey".
 * Optimized for small-scale visibility with heavy line weights and organic motion.
 */
export const Logo = ({ size = 24, className, ...props }: IconSvgProps) => {
  const {
    width,
    height,
    onAnimationStart,
    onDragStart,
    onDragEnd,
    onDrag,
    ...rest
  } = props as any;

  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: [0.19, 1, 0.22, 1], // Sophisticated Expo Out
      },
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 60"
      width={width || (size ? size * 4 : 240)}
      height={height || size || 60}
      fill="none"
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      {...rest}
    >
      <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {/* O */}
        <motion.path
          variants={pathVariants}
          d="M45,30 A15,15 0 1,1 15,30 A15,15 0 1,1 45,30"
        />
        {/* d */}
        <motion.path
          variants={pathVariants}
          d="M80,30 A15,15 0 1,1 50,30 A15,15 0 1,1 80,30 M80,5 V55"
        />
        {/* y */}
        <motion.path
          variants={pathVariants}
          d="M90,20 L105,45 M120,20 L105,45 C105,55 95,60 85,55"
        />
        {/* s */}
        <motion.path
          variants={pathVariants}
          d="M150,22 C150,15 130,15 130,25 C130,35 150,35 150,45 C150,55 130,55 130,48"
        />
        {/* s */}
        <motion.path
          variants={pathVariants}
          d="M180,22 C180,15 160,15 160,25 C160,35 180,35 180,45 C180,55 160,55 160,48"
        />
        {/* e */}
        <motion.path
          variants={pathVariants}
          d="M210,35 H190 C190,20 210,20 210,30 C210,45 190,45 190,35"
        />
        {/* y */}
        <motion.path
          variants={pathVariants}
          d="M220,20 L235,45 M250,20 L235,45 C235,55 225,60 215,55"
        />
      </g>
    </motion.svg>
  );
};
