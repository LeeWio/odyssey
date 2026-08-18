import { useEffect, useRef } from "react";
import { gsap } from "gsap";

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

const GALLERY_MASK =
  "linear-gradient(to right, rgba(0,0,0,0.58) 0%, black 8%, black 92%, rgba(0,0,0,0.58) 100%)";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /**
   * Entrance
   *
   * Keep this restrained.
   * The photos should feel like content appearing,
   * rather than a UI component demonstrating itself.
   */
  useEffect(() => {
    const cards = cardRefs.current.filter((card): card is HTMLDivElement => card !== null);

    if (!cards.length) return;

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
  }, [images.length, animationDelay, animationStagger, easeType]);

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
    if (!enableHover) return;

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
    if (!enableHover) return;

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

        /*
         * Edge integration
         *
         * The gallery never fully disappears.
         * The outer photos are only softened,
         * which helps the group blend into
         * bg-surface without creating a
         * visible carousel-style fade.
         */
        maskImage: GALLERY_MASK,
        WebkitMaskImage: GALLERY_MASK,
      }}
    >
      {images.map((src, index) => {
        const transform = transformStyles[index] ?? "none";

        return (
          <div
            key={`${src}-${index}`}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            className={`bg-surface-secondary ring-separator-tertiary absolute aspect-square overflow-hidden rounded-[15px] ring-1 will-change-transform ring-inset ${onCardClick ? "cursor-pointer" : ""}`}
            style={{
              width: cardSize,
              transform,
              zIndex: index,

              /*
               * Just enough separation
               * for overlapping photographs.
               *
               * The Moment Card itself owns
               * the primary elevation.
               */
              boxShadow: "0 4px 14px color-mix(in oklch, var(--foreground) 5%, transparent)",
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onCardClick?.(index)}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 block size-full object-cover brightness-[0.97] contrast-[0.96] select-none"
            />
          </div>
        );
      })}
    </div>
  );
}
