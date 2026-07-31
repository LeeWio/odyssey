"use client";

import { motion, useReducedMotion } from "motion/react";

export const HELLO_PATH = `
M-145.66,43.747C-145.66,43.747,-86.107,10.264,-81.851,-26.162
C-79.424,-46.943,-98.573,-44.137,-101.426,-23.013
C-103.757,-5.755,-109.596,40.561,-109.596,40.561
C-109.596,40.561,-103.979,-0.034,-85.851,1.753
C-65.936,4.083,-91.979,40.05,-69,40.305
C-48.573,40.532,-27.639,22.688,-26.873,10.943
C-25.99,-2.599,-44.362,-4.886,-50.022,11.966
C-55.226,27.461,-43.584,44.902,-23.54,40.581
C7.341,33.922,22.483,-10.827,23.936,-26.077
C25.467,-42.162,13.723,-43.694,6.574,-29.397
C-0.104,-16.04,-11.245,37.085,12.958,41.583
C41.809,46.944,64.277,-5.906,67.086,-23.779
C69.802,-41.066,58.656,-45.952,50.234,-30.673
C41.166,-14.223,27.843,44.077,59.937,41.326
C86.746,39.028,76.916,2.264,102.898,-0.05
C114.562,-1.088,119.386,9.92,118.532,21.029
C117.638,32.646,106.66,42.475,95.809,40.943
C85.898,39.544,80.838,25.973,83.425,17.072
C86.617,6.094,96.662,0.12,102.898,-0.05
C111.766,-0.29,116.234,5.327,124.149,5.199
C131.179,5.086,138.27,-2.922,138.27,-2.922
`;

export function HelloApple() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative flex w-full items-center justify-center">
      <motion.svg
        viewBox="-170 -70 340 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full max-w-xl overflow-visible"
      >
        <defs>
          <linearGradient id="hello-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--foreground)" />
            <stop offset="45%" stopColor="var(--accent)" />
            <stop offset="75%" stopColor="color-mix(in oklch,var(--accent) 65%,white)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient id="hello-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="hello-glow">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <motion.g
          animate={
            reducedMotion
              ? undefined
              : {
                  scale: [1, 1.006, 1],
                }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "center",
          }}
        >
          <motion.path
            d={HELLO_PATH}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#hello-glow)"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={
              reducedMotion
                ? {
                    pathLength: 1,
                    opacity: 0.04,
                  }
                : {
                    pathLength: 1,
                    opacity: [0.03, 0.06, 0.03],
                  }
            }
            transition={{
              pathLength: {
                duration: 4.5,
                ease: [0.16, 1, 0.3, 1],
              },
              opacity: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />

          <motion.path
            d={HELLO_PATH}
            fill="none"
            stroke="url(#hello-gradient)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={
              reducedMotion
                ? {
                    pathLength: 1,
                    opacity: 1,
                  }
                : {
                    pathLength: 1,
                    opacity: [0.88, 1, 0.88],
                    strokeWidth: [6.5, 7, 6.5],
                  }
            }

            transition={
              reducedMotion
                ? {
                    duration: 0,
                  }
                : {
                    pathLength: {
                      duration: 4.5,
                      ease: [0.16, 1, 0.3, 1],
                    },
                    opacity: {
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    strokeWidth: {
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
          />
          <motion.path
            d={HELLO_PATH}
            fill="none"
            stroke="url(#hello-highlight)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeDasharray="18 82"
            initial={{
              opacity: 0,
            }}
            animate={
              reducedMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: [0, 0.45, 0.15],

                    strokeDashoffset: [100, 0],
                  }
            }
            transition={{
              opacity: {
                duration: 3,
                delay: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
              strokeDashoffset: {
                duration: 12,
                delay: 4.5,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          />
        </motion.g>

        {!reducedMotion && (
          <motion.circle
            cx="118"
            cy="5"
            r="1.1"
            fill="var(--accent)"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: [0, 0.7, 0],

              scale: [0.7, 1.5, 0.7],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 6,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.svg>
    </div>
  );
}
