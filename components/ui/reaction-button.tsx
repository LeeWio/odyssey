"use client";

import { Button, type ButtonProps } from "@heroui/react";
import { Icon } from "@iconify/react";
import { animate } from "motion/react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

export type ReactionIcon = "heart" | "star" | "thumb";
export type ReactionColor =
  "accent" | "success" | "warning" | "danger" | "foreground" | "muted" | "inherit";
export type ReactionVariant = NonNullable<ButtonProps["variant"]>;

export interface ReactionButtonProps extends Omit<
  ButtonProps,
  "children" | "onPress" | "variant" | "isIconOnly" | "className"
> {
  selected: boolean;
  count?: number;
  /** Return true only when the owner accepts and updates the controlled state. */
  onSelectedChange: (selected: boolean) => boolean;
  label: string;
  showCount?: boolean | "positive";
  icon?: ReactionIcon | ReactNode;
  idleOutline?: boolean;
  idleVariant?: ButtonProps["variant"];
  selectedVariant?: ButtonProps["variant"];
  idleColor?: ReactionColor;
  selectedColor?: ReactionColor;
  animationEnabled?: boolean;
  duration?: number;
  dotSize?: number;
  overshoot?: number;
  beat?: number;
  rollDuration?: number;
  className?: string;
}

type Snapshot = { selected: boolean; count: number };
type Feedback = { from: Snapshot; to: Snapshot };
type View = {
  value: Snapshot;
  shown: Snapshot;
  intent: { selected: boolean; animated: boolean } | null;
  animation: Feedback | null;
  rollFrom?: number;
};

const OUT = 0.4;
const ICONS: Record<ReactionIcon, { outline: string; solid: string }> = {
  heart: { outline: "gravity-ui:heart", solid: "gravity-ui:heart-fill" },
  star: { outline: "gravity-ui:star", solid: "gravity-ui:star-fill" },
  thumb: { outline: "gravity-ui:thumbs-up", solid: "gravity-ui:thumbs-up-fill" },
};
const COLORS: Record<ReactionColor, string> = {
  accent: "var(--accent-soft-foreground)",
  success: "var(--success-soft-foreground)",
  warning: "var(--warning-soft-foreground)",
  danger: "var(--danger-soft-foreground)",
  foreground: "var(--foreground)",
  muted: "var(--muted)",
  inherit: "currentColor",
};
const SIZES: Record<NonNullable<ButtonProps["size"]>, { text: string; icon: string }> = {
  sm: { text: "text-sm", icon: "size-4" },
  md: { text: "text-[0.9375rem]", icon: "size-4.5" },
  lg: { text: "text-base", icon: "size-5" },
};
const format = (value: number) => new Intl.NumberFormat().format(value);
const swell = (t: number, overshoot: number) => {
  if (t < OUT) return 1 - (1 - t / OUT) ** 3;
  const u = (t - OUT) / (1 - OUT) - 1;
  return -((overshoot + 1) * u ** 3 + overshoot * u ** 2);
};

function RollingCount({
  value,
  from,
  duration,
}: {
  value: number;
  from?: number;
  duration: number;
}) {
  const rollRef = useRef<HTMLSpanElement>(null);
  const [settled, setSettled] = useState({ from, value, done: false });
  if (settled.from !== from || settled.value !== value) {
    setSettled({ from, value, done: false });
  }
  const text = format(value);
  const previous = from === undefined ? text : format(from);
  const rolling = previous !== text && !settled.done;
  const up = value > (from ?? value);
  const changed =
    previous.length === text.length
      ? [...text].flatMap((ch, i) => (ch !== previous[i] ? [i] : []))
      : [];
  const single = changed.length === 1 ? changed[0] : -1;

  useLayoutEffect(() => {
    const element = rollRef.current;
    if (!element || !rolling) return;
    const control = animate(
      element,
      {
        transform: up
          ? ["translateY(0)", "translateY(-1em)"]
          : ["translateY(-1em)", "translateY(0)"],
      },
      {
        duration: Math.max(0, duration) / 1000,
        ease: [0.23, 1, 0.32, 1],
        onComplete: () => setSettled({ from, value, done: true }),
      }
    );
    return () => control.stop();
  }, [duration, rolling, up, previous, text, from, value]);

  const cells = !rolling
    ? [...text].map((ch) => ({ ch }))
    : single === -1
      ? [{ top: up ? previous : text, bottom: up ? text : previous }]
      : [...text].map((ch, i) =>
          i === single ? { top: up ? previous[i] : ch, bottom: up ? ch : previous[i] } : { ch }
        );

  return (
    <span
      aria-hidden="true"
      className="inline-flex leading-none tabular-nums [&>span]:block [&>span]:h-[1em]"
    >
      {cells.map((cell, index) =>
        "ch" in cell ? (
          <span key={`c${index}`}>{cell.ch}</span>
        ) : (
          <span key={`r${index}`} className="relative overflow-hidden">
            <span
              ref={rollRef}
              className="flex flex-col [&>span]:block [&>span]:h-[1em] [&>span]:leading-none"
            >
              <span>{cell.top}</span>
              <span>{cell.bottom}</span>
            </span>
          </span>
        )
      )}
    </span>
  );
}

export function ReactionButton({
  selected,
  count = 0,
  onSelectedChange,
  label,
  showCount = true,
  icon = "heart",
  idleOutline = true,
  size = "md",
  idleVariant = "ghost",
  selectedVariant = "danger-soft",
  idleColor = "muted",
  selectedColor = "danger",
  animationEnabled = true,
  duration = 560,
  dotSize = 0.3,
  overshoot = 1.7,
  beat = 3,
  rollDuration = 350,
  isDisabled = false,
  isPending = false,
  className,
  ...buttonProps
}: ReactionButtonProps) {
  const reduced = useReducedMotionPreference();
  const animated = animationEnabled && !reduced && duration > 0;
  const [view, setView] = useState<View>(() => ({
    value: { selected, count },
    shown: { selected, count },
    intent: null,
    animation: null,
  }));
  const iconRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  // Derive presentation before commit, so hydration, rejection and rollback never flash stale state.
  if (view.value.selected !== selected || view.value.count !== count) {
    const value = { selected, count };
    const accepted =
      animated &&
      view.intent?.animated &&
      view.intent.selected === selected &&
      view.value.selected !== selected;
    setView({
      value,
      shown: accepted ? view.shown : value,
      intent: null,
      animation: accepted ? { from: view.shown, to: value } : null,
    });
  } else if (!animated && (view.animation || view.rollFrom !== undefined)) {
    setView({ value: view.value, shown: view.value, intent: null, animation: null });
  }

  const { animation } = view;
  useLayoutEffect(() => {
    const iconElement = iconRef.current;
    const content = contentRef.current;
    if (!animation || !iconElement || !content) return;
    let swapped = false;
    const control = animate(0, 1, {
      duration: duration / 1000,
      ease: "linear",
      onUpdate: (progress) => {
        const scale = swell(progress, overshoot);
        iconElement.style.transform = `scale(${1 - (1 - dotSize) * scale})`;
        content.style.transform = `scale(${1 - (beat / 100) * scale})`;
        if (!swapped && progress >= OUT) {
          swapped = true;
          setView((current) =>
            current.animation === animation
              ? { ...current, shown: animation.to, rollFrom: animation.from.count }
              : current
          );
        }
      },
      onComplete: () =>
        setView((current) =>
          current.animation === animation
            ? { ...current, shown: current.value, animation: null }
            : current
        ),
    });
    return () => {
      control.stop();
      iconElement.style.transform = "";
      content.style.transform = "";
    };
  }, [animation, duration, dotSize, overshoot, beat]);

  const handlePress: NonNullable<ButtonProps["onPress"]> = (event) => {
    if (isDisabled || isPending) return;
    const next = !selected;
    if (!onSelectedChange(next)) return;
    const pointer =
      event.pointerType === "mouse" || event.pointerType === "touch" || event.pointerType === "pen";
    setView((current) => ({
      ...current,
      intent: { selected: next, animated: animated && pointer },
    }));
  };

  const variant = view.shown.selected ? selectedVariant : idleVariant;
  const pairedForeground = variant === "primary" || variant === "danger";
  const builtin = typeof icon === "string" ? ICONS[icon as ReactionIcon] : undefined;
  const visibleCount = showCount === "positive" ? view.shown.count > 0 : showCount;
  const accessibleCount = showCount === "positive" ? count > 0 : showCount;
  const contentSize = SIZES[size];

  return (
    <Button
      {...buttonProps}
      type="button"
      aria-label={accessibleCount ? `${label}, ${format(count)}` : label}
      aria-pressed={selected}
      size={size}
      variant={variant}
      isDisabled={isDisabled}
      isPending={isPending}
      isIconOnly={!visibleCount}
      data-selected={String(view.shown.selected)}
      data-running={animation ? "" : undefined}
      data-solid={idleOutline ? undefined : ""}
      data-no-count={visibleCount ? undefined : ""}
      className={["group", className].filter(Boolean).join(" ")}
      style={
        {
          ...buttonProps.style,
          "--reaction-idle": pairedForeground ? "currentColor" : COLORS[idleColor],
          "--reaction-selected": pairedForeground ? "currentColor" : COLORS[selectedColor],
        } as CSSProperties
      }
      onPress={handlePress}
    >
      <span
        ref={contentRef}
        className={`inline-flex origin-center items-center gap-2 ${contentSize.text}`}
      >
        <span
          ref={iconRef}
          aria-hidden="true"
          className={`inline-flex shrink-0 origin-center [color:var(--reaction-idle)] group-data-[selected=true]:[color:var(--reaction-selected)] ${contentSize.icon} [&_svg]:m-0 [&_svg]:size-full [&_svg]:overflow-visible`}
        >
          {builtin ? (
            <Icon
              icon={view.shown.selected || !idleOutline ? builtin.solid : builtin.outline}
              aria-hidden="true"
            />
          ) : (
            icon
          )}
        </span>
        {visibleCount ? (
          <RollingCount
            value={view.shown.count}
            from={animated ? view.rollFrom : undefined}
            duration={rollDuration}
          />
        ) : null}
      </span>
    </Button>
  );
}
