import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "motion/react";
import { RemoteMedia } from "@/components/ui/remote-media";

interface BounceCardsProps {
  className?: string;
  images?: string[];

  containerWidth?: number;
  containerHeight?: number;
  cardSize?: number;

  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;

  transformStyles?: string[];

  enableHover?: boolean;
  onCardClick?: (index: number) => void;
}

const DEFAULT_TRANSFORMS = [
  "rotate(3deg) translate(-120px)",
  "rotate(-2deg) translate(-60px)",
  "rotate(-2deg)",
  "rotate(2deg) translate(60px)",
  "rotate(-3deg) translate(120px)",
];

export default function BounceCards({
  className = "",
  images = [],

  containerWidth = 400,
  containerHeight = 126,
  cardSize = 86,

  animationDelay = 0.2,
  animationStagger = 0.045,
  easeType = "power3.out",

  transformStyles = DEFAULT_TRANSFORMS,

  enableHover = false,
  onCardClick,
}: BounceCardsProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);

  /**
   * Entrance
   *
   * Keep this restrained.
   * The photos should feel like content appearing,
   * rather than a UI component demonstrating itself.
   */
  useEffect(() => {
    const cards = cardRefs.current.filter(
      (card): card is HTMLButtonElement | HTMLDivElement => card !== null
    );

    if (!cards.length) return;
    if (shouldReduceMotion) {
      gsap.set(cards, { opacity: 1, scale: 1, y: 0, clearProps: "opacity" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          scale: 0.94,
          y: 5,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.55,
          delay: animationDelay,
          stagger: animationStagger,
          ease: easeType,
          clearProps: "opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [images.length, animationDelay, animationStagger, easeType, shouldReduceMotion]);

  /**
   * Remove rotation while preserving
   * the original positional transform.
   */
  const removeRotation = (transform: string) => {
    if (transform === "none") {
      return "rotate(0deg)";
    }

    if (/rotate\([^)]*\)/.test(transform)) {
      return transform.replace(/rotate\([^)]*\)/, "rotate(0deg)");
    }

    return `${transform} rotate(0deg)`;
  };

  const getPushedTransform = (baseTransform: string, offsetX: number): string => {
    const translateRegex = /translate\(([-0-9.]+)px\)/;

    const match = baseTransform.match(translateRegex);

    if (match) {
      const currentX = parseFloat(match[1]);

      const newX = currentX + offsetX;

      return baseTransform.replace(translateRegex, `translate(${newX}px)`);
    }

    return baseTransform === "none"
      ? `translate(${offsetX}px)`
      : `${baseTransform} translate(${offsetX}px)`;
  };

  /**
   * Hover interaction
   *
   * Intentionally subtle:
   * - focused image settles
   * - siblings only move slightly
   * - no dramatic "gallery explosion"
   */
  const handleMouseEnter = (hoveredIndex: number) => {
    if (!enableHover || shouldReduceMotion) return;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      gsap.killTweensOf(card);

      const baseTransform = transformStyles[index] ?? "none";

      if (index === hoveredIndex) {
        gsap.to(card, {
          transform: removeRotation(baseTransform),
          scale: 1.035,
          zIndex: 20,
          duration: 0.38,
          ease: "power3.out",
          overwrite: "auto",
        });

        return;
      }

      const direction = index < hoveredIndex ? -1 : 1;

      const distance = Math.abs(index - hoveredIndex);

      /*
       * Push from the ORIGINAL position.
       *
       * Important:
       * Do not use GSAP `x` here because the base
       * layout already uses translate(...) inside
       * transformStyles.
       */
      const pushDistance = 18;

      const pushedTransform = getPushedTransform(baseTransform, direction * pushDistance);

      gsap.to(card, {
        transform: pushedTransform,
        scale: 0.985,
        zIndex: index,
        duration: 0.38,
        delay: distance * 0.015,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    if (!enableHover || shouldReduceMotion) return;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      gsap.killTweensOf(card);

      gsap.to(card, {
        transform: transformStyles[index] ?? "none",
        scale: 1,
        zIndex: index,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex shrink-0 items-center justify-center ${className} `}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {images.map((src, index) => {
        const transform = transformStyles[index] ?? "none";
        const sharedClassName = `bg-surface-secondary ring-separator-tertiary absolute aspect-square overflow-hidden rounded-[15px] ring-1 will-change-transform ring-inset ${onCardClick ? "cursor-pointer" : ""}`;
        const sharedStyle = {
          width: cardSize,
          transform,
          zIndex: index,
          boxShadow: "0 4px 14px color-mix(in oklch, var(--foreground) 5%, transparent)",
        } as const;
        const media = (
          <RemoteMedia
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 block size-full overflow-hidden object-cover break-all brightness-[0.97] contrast-[0.96] select-none"
          />
        );

        if (onCardClick) {
          return (
            <button
              key={`${src}-${index}`}
              type="button"
              aria-label={`Open image ${index + 1} of ${images.length}`}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              className={sharedClassName}
              style={sharedStyle}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onCardClick(index)}
            >
              {media}
            </button>
          );
        }

        return (
          <div
            key={`${src}-${index}`}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            className={sharedClassName}
            style={sharedStyle}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {media}
          </div>
        );
      })}
    </div>
  );
}
