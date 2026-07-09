"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

type Mood = "smile" | "flat" | "sad";

type SmileBallMarkProps = {
  className?: string;
  size?: number;
  mood?: Mood;
  isPlaying?: boolean;
  reduceMotion?: boolean;
  showFloorShadow?: boolean;
};

const viewBoxSize = 150;

const ballPath = {
  rest: "M75 10 C111 10 134 36 134 72 C134 109 109 134 72 134 C36 134 12 109 12 72 C12 36 38 10 75 10Z",
  active:
    "M75 9 C112 8 135 36 133 73 C131 113 106 138 72 135 C36 132 13 108 15 70 C17 32 39 10 75 9Z",
};

const mouthPath: Record<Mood, string> = {
  smile: "M38 76 C52 106 92 108 114 76",
  flat: "M40 84 C58 84 92 84 110 84",
  sad: "M40 92 C56 68 94 68 112 92",
};

const mouthCorePath: Record<Mood, string> = {
  smile: "M44 75 C58 94 92 98 108 76",
  flat: "M46 83 C62 83 90 83 104 83",
  sad: "M46 91 C60 76 92 75 106 91",
};

const restAnimation = {
  y: [0, -7, 0],
  rotate: [0, 1.6, -1.4, 0],
};

const bounceAnimation = {
  y: [0, 6, -12, -4, 0],
  rotate: [0, -7, 6, -3, 0],
  scaleX: [1, 1.05, 0.96, 1.03, 1],
  scaleY: [1, 0.95, 1.05, 0.98, 1],
};

const restTransition = {
  duration: 3.2,
  repeat: Infinity,
  ease: "easeInOut",
} satisfies Transition;

const bounceTransition = {
  duration: 0.62,
  times: [0, 0.18, 0.42, 0.68, 1],
  ease: "easeOut",
} satisfies Transition;

export function SmileBallLogo({
  className,
  size = 28,
}: Pick<SmileBallMarkProps, "className" | "size">) {
  const { isPlaying, mood, play, shouldReduceMotion } = useSmileBallPlayback({
    autoPlay: true,
  });

  return (
    <motion.span
      aria-hidden="true"
      onFocus={play}
      onPointerEnter={play}
      className={`inline-flex origin-center ${className ?? ""}`}
      animate={shouldReduceMotion ? undefined : isPlaying ? bounceAnimation : restAnimation}
      transition={isPlaying ? bounceTransition : restTransition}
    >
      <SmileBallMark
        size={size}
        mood={mood}
        isPlaying={isPlaying}
        reduceMotion={shouldReduceMotion}
      />
    </motion.span>
  );
}

export function SmileBall() {
  const { isPlaying, mood, play, shouldReduceMotion } = useSmileBallPlayback();

  return (
    <div className="border-default-100/10 relative h-[220px] w-[260px] overflow-hidden rounded-3xl border bg-[#050505] shadow-2xl">
      <Grid />

      <motion.button
        type="button"
        aria-label="Play smile ball animation"
        onClick={play}
        className="absolute top-5 left-5 size-[130px] cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-lime-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        animate={shouldReduceMotion ? undefined : isPlaying ? bounceAnimation : restAnimation}
        transition={isPlaying ? bounceTransition : restTransition}
      >
        <SmileBallMark
          size={130}
          mood={mood}
          isPlaying={isPlaying}
          reduceMotion={shouldReduceMotion}
          showFloorShadow
        />
      </motion.button>

      <AnimatePresence initial={false}>
        {isPlaying && !shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-[34px] left-[144px] rounded-[3px] bg-white px-4 py-1 text-[22px] leading-none font-black text-black shadow-lg"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.35, x: -20, y: 12, rotate: -10 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.35, 1.18, 1, 0.9],
                x: [-20, 0, 6, 14],
                y: [12, -6, -12, -22],
                rotate: [-10, 4, -2, -5],
              }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
              transition={{
                duration: 0.72,
                times: [0, 0.22, 0.72, 1],
                ease: "easeOut",
              }}
            >
              click!!
            </motion.div>

            <motion.svg
              className="absolute top-[2px] left-[210px]"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              aria-hidden="true"
              focusable="false"
              initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.15, 1, 0.9],
                rotate: [20, -8, 0, 6],
              }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
              transition={{ duration: 0.68, ease: "easeOut" }}
            >
              <g stroke="#6fff6a" strokeWidth="4" strokeLinecap="round">
                <motion.path
                  d="M20 23 L5 32"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                <motion.path
                  d="M22 18 L8 8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                <motion.path
                  d="M28 17 L31 2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                <motion.path
                  d="M31 23 L45 14"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              </g>
            </motion.svg>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function useSmileBallPlayback({ autoPlay = false } = {}) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<Mood>("smile");
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const frameRef = useRef<number | null>(null);

  const clearScheduledWork = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
  }, []);

  const play = useCallback(() => {
    clearScheduledWork();
    setIsPlaying(false);
    setMood("flat");

    frameRef.current = requestAnimationFrame(() => {
      setIsPlaying(true);

      if (shouldReduceMotion) {
        schedule(() => setMood("smile"), 220);
        schedule(() => setIsPlaying(false), 260);
        return;
      }

      schedule(() => setMood("sad"), 120);
      schedule(() => setMood("flat"), 300);
      schedule(() => setMood("smile"), 520);
      schedule(() => setIsPlaying(false), 780);
    });
  }, [clearScheduledWork, schedule, shouldReduceMotion]);

  useEffect(() => clearScheduledWork, [clearScheduledWork]);

  useEffect(() => {
    if (!autoPlay || shouldReduceMotion) {
      return;
    }

    const initialTimeout = setTimeout(play, 450);
    const interval = setInterval(play, 3600);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [autoPlay, play, shouldReduceMotion]);

  return { isPlaying, mood, play, shouldReduceMotion };
}

function SmileBallMark({
  className,
  size = 130,
  mood = "smile",
  isPlaying = false,
  reduceMotion = true,
  showFloorShadow = false,
}: SmileBallMarkProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const gradientId = `${id}-smileBall-gradient`;
  const shineId = `${id}-smileBall-shine`;
  const shadowId = `${id}-smileBall-floorShadow`;
  const clipId = `${id}-smileBall-clip`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className={className}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={ballPath.rest} />
        </clipPath>

        <radialGradient id={gradientId} cx="35%" cy="26%" r="76%">
          <stop offset="0%" stopColor="#f7ff79" />
          <stop offset="30%" stopColor="#a8ff5a" />
          <stop offset="52%" stopColor="#16efaa" />
          <stop offset="79%" stopColor="#0f3f36" />
          <stop offset="100%" stopColor="#06201d" />
        </radialGradient>

        <radialGradient id={shineId} cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {showFloorShadow && <ellipse cx="78" cy="136" rx="42" ry="8" fill={`url(#${shadowId})`} />}

      <motion.path
        d={isPlaying ? ballPath.active : ballPath.rest}
        fill={`url(#${gradientId})`}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />

      <g clipPath={`url(#${clipId})`}>
        <motion.ellipse
          cx="52"
          cy="40"
          rx="36"
          ry="42"
          fill={`url(#${shineId})`}
          animate={
            reduceMotion
              ? { opacity: 0.8 }
              : isPlaying
                ? { x: [0, 3, -2, 0], y: [0, 4, -2, 0], opacity: [0.8, 0.55, 0.72, 0.8] }
                : { opacity: [0.7, 0.9, 0.7] }
          }
          transition={{
            duration: isPlaying ? 0.55 : 3,
            repeat: isPlaying || reduceMotion ? 0 : Infinity,
          }}
        />
      </g>

      <motion.circle
        cx="64"
        cy="47"
        r="14"
        fill="#e5ffe9"
        animate={reduceMotion || !isPlaying ? {} : { scale: [1, 0.92, 1.05, 1] }}
        transition={{ duration: 0.3 }}
      />

      <motion.circle
        cx="96"
        cy="43"
        r="15"
        fill="#caffd8"
        animate={reduceMotion || !isPlaying ? {} : { scale: [1, 1.05, 0.94, 1] }}
        transition={{ duration: 0.3 }}
      />

      <motion.path
        d={mouthPath[mood]}
        fill="none"
        stroke="#fff"
        strokeWidth="10"
        strokeLinecap="round"
        animate={{ d: mouthPath[mood] }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      />

      <motion.path
        d={mouthCorePath[mood]}
        fill="none"
        stroke="#003e25"
        strokeWidth="5"
        strokeLinecap="round"
        animate={{ d: mouthCorePath[mood] }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      />
    </svg>
  );
}

function Grid() {
  return (
    <svg aria-hidden="true" focusable="false" className="absolute inset-0 h-full w-full">
      <g opacity="0.12" stroke="#fff" strokeWidth="1">
        <path d="M0 70H260M0 145H260" />
        <path d="M86 0V220M174 0V220" />
      </g>
    </svg>
  );
}
