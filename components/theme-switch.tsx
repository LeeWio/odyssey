"use client";

import { Skeleton } from "@heroui/react";
import { Segment, type SegmentRootProps } from "@heroui-pro/react";
import { useMounted } from "@mantine/hooks";
import { Icon } from "@iconify/react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { flushSync } from "react-dom";
import { selectThemeVariant, setThemeVariant } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { EASE_OUT_CSS } from "@/lib/motion/ease";
import {
  applyThemeToElement,
  coerceThemeMode,
  coerceThemeVariant,
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_VARIANT,
  resolveThemeMode,
  THEME_VARIANTS,
  type ResolvedThemeMode,
  type ThemeMode,
  type ThemeVariant,
} from "@/lib/theme";

const THEME_VARIANT_KEYS: Record<ThemeVariant, "brutal" | "glass" | "mouve"> = {
  brutalism: "brutal",
  glass: "glass",
  mouve: "mouve",
};

type ThemeReveal = "rectangle" | "circle" | "circle-blur" | "blinds";

type RevealStart =
  "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "bottom-up";

const VT_STYLE_ID = "odyssey-theme-reveal";

// View transitions animate in CSS, not motion springs, so easing here is
// either EASE_OUT_CSS or a keyword. The circle variants keep the Material
// standard curve because their reveal expands symmetrically rather than
// decelerating. Durations differ per variant to match native OS mode switches.
const VT_CSS = `
/* HeroUI sets :root { view-transition-name: none } so other transitions leave
   the page interactive. That also drops the root snapshot, and the reveal
   pseudos never exist. Opt back in only while this toggle is running. */
html[data-beui-vt] {
  view-transition-name: root;
}
html[data-beui-vt="rect"]::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}
html[data-beui-vt="rect"]::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: beui-rect-reveal 400ms ease-out;
}
html[data-beui-vt="circle"]::view-transition-old(root),
html[data-beui-vt="circle-blur"]::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}
html[data-beui-vt="circle"]::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: beui-circle-reveal 700ms cubic-bezier(0.4, 0, 0.2, 1);
}
html[data-beui-vt="circle-blur"]::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: beui-circle-blur-reveal 700ms cubic-bezier(0.4, 0, 0.2, 1);
}
html[data-beui-vt="blinds"]::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}
/* Slats: a masked band widens inside every 72px tile, so the new theme opens
   across the page like a shutter. The band edge has to be a registered custom
   property — mask-image itself is not animatable, but it re-resolves every
   frame the property ticks. mask-size fixes the tile at 72px rather than
   letting a repeating gradient's last stop define it, which is what keeps the
   20px soft edge from dragging the tile wider than the slat and leaving a
   feathered gap that never closes; it also means both ends land clean, fully
   transparent at -20px and fully opaque at 72px. Falling back to no mask
   (unregistered property, so the var is invalid) reveals the page in one
   step. */
@property --beui-vt-slat {
  syntax: "<length>";
  inherits: false;
  initial-value: 72px;
}
html[data-beui-vt="blinds"]::view-transition-new(root) {
  mix-blend-mode: normal;
  mask-image: linear-gradient(
    90deg,
    #000 0 var(--beui-vt-slat),
    transparent calc(var(--beui-vt-slat) + 20px)
  );
  mask-size: 72px 100%;
  mask-repeat: repeat;
  animation: beui-blinds-reveal 700ms ${EASE_OUT_CSS};
}
@keyframes beui-rect-reveal {
  from { clip-path: var(--beui-vt-from, inset(100% 0 0 0)); }
  to   { clip-path: inset(0 0 0 0); }
}
@keyframes beui-circle-reveal {
  from { clip-path: circle(0% at var(--beui-vt-origin, 50% 100%)); }
  to   { clip-path: circle(150% at var(--beui-vt-origin, 50% 100%)); }
}
@keyframes beui-circle-blur-reveal {
  from { clip-path: circle(0% at var(--beui-vt-origin, 50% 100%)); filter: blur(8px); }
  to   { clip-path: circle(150% at var(--beui-vt-origin, 50% 100%)); filter: blur(0px); }
}
@keyframes beui-blinds-reveal {
  from { --beui-vt-slat: -20px; }
  to   { --beui-vt-slat: 72px; }
}
`;

const RECT_FROM: Record<RevealStart, string> = {
  "top-left": "inset(0 100% 100% 0)",
  "top-right": "inset(0 0 100% 100%)",
  "bottom-left": "inset(100% 100% 0 0)",
  "bottom-right": "inset(100% 0 0 100%)",
  center: "inset(50% 50% 50% 50%)",
  "bottom-up": "inset(100% 0 0 0)",
};

const CIRCLE_ORIGIN: Record<RevealStart, string> = {
  "top-left": "0% 0%",
  "top-right": "100% 0%",
  "bottom-left": "0% 100%",
  "bottom-right": "100% 100%",
  center: "50% 50%",
  "bottom-up": "50% 100%",
};

function ensureViewTransitionStyle() {
  if (document.getElementById(VT_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = VT_STYLE_ID;
  el.textContent = VT_CSS;
  document.head.appendChild(el);
}

function readSystemMode(): ResolvedThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useThemeReveal(reveal: ThemeReveal = "circle-blur", start: RevealStart = "bottom-up") {
  const { setTheme, theme } = useTheme();
  const dispatch = useAppDispatch();
  const themeVariant = useAppSelector(selectThemeVariant);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    ensureViewTransitionStyle();
  }, []);

  const transition = (apply: () => void) => {
    if (reduce || !("startViewTransition" in document)) {
      apply();
      return;
    }

    ensureViewTransitionStyle();
    const root = document.documentElement;

    if (reveal === "rectangle") {
      root.style.setProperty("--beui-vt-from", RECT_FROM[start]);
      root.dataset.beuiVt = "rect";
    } else if (reveal === "blinds") {
      root.dataset.beuiVt = "blinds";
    } else {
      root.style.setProperty("--beui-vt-origin", CIRCLE_ORIGIN[start]);
      root.dataset.beuiVt = reveal;
    }

    const vt = (
      document as Document & {
        startViewTransition(callback: () => void): { finished: Promise<void> };
      }
    ).startViewTransition(() => {
      flushSync(apply);
    });

    vt.finished.finally(() => {
      delete root.dataset.beuiVt;
    });
  };

  const setMode = (mode: ThemeMode) => {
    transition(() => {
      const root = document.documentElement;
      const variant = coerceThemeVariant(themeVariant ?? root.dataset.themeVariant);
      // next-themes and ThemeRootSync write the root in useEffect, after the
      // view-transition snapshot. The new frame has to be painted first.
      applyThemeToElement(root, variant, mode, resolveThemeMode(mode, readSystemMode()));
      setTheme(mode);
    });
  };

  const setVariant = (variant: ThemeVariant) => {
    transition(() => {
      const root = document.documentElement;
      const mode = coerceThemeMode(theme ?? root.dataset.themeMode);
      applyThemeToElement(root, variant, mode, resolveThemeMode(mode, readSystemMode()));
      dispatch(setThemeVariant(variant));
    });
  };

  return { setMode, setVariant };
}

interface ModeSwitchProps {
  size?: SegmentRootProps["size"];
  variant?: SegmentRootProps["variant"];
  reveal?: ThemeReveal;
  start?: RevealStart;
}

export const ModeSwitch = ({
  size = "sm",
  variant = "ghost",
  reveal = "circle-blur",
  start = "bottom-up",
}: ModeSwitchProps) => {
  const t = useTranslations("Theme");
  const { theme } = useTheme();
  const { setMode } = useThemeReveal(reveal, start);
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="rounded-medium h-10 w-31" />;
  }

  return (
    <Segment
      aria-label={t("colorMode")}
      selectedKey={coerceThemeMode(theme) || DEFAULT_THEME_MODE}
      onSelectionChange={(key) => {
        const next = coerceThemeMode(String(key));
        if (next === coerceThemeMode(theme)) return;
        setMode(next);
      }}
      size={size}
      variant={variant}
    >
      <Segment.Item aria-label={t("light")} id="light">
        <Segment.Separator />
        <Icon icon="gravity-ui:sun" aria-hidden="true" />
      </Segment.Item>
      <Segment.Item aria-label={t("dark")} id="dark">
        <Segment.Separator />
        <Icon icon="gravity-ui:moon" aria-hidden="true" />
      </Segment.Item>
      <Segment.Item aria-label={t("system")} id="system">
        <Segment.Separator />
        <Icon icon="gravity-ui:display" aria-hidden="true" />
      </Segment.Item>
    </Segment>
  );
};

export const VariantSwitch = ({
  reveal = "circle-blur",
  start = "bottom-up",
}: {
  reveal?: ThemeReveal;
  start?: RevealStart;
}) => {
  const t = useTranslations("Theme");
  const selectedVariant = useAppSelector(selectThemeVariant) ?? DEFAULT_THEME_VARIANT;
  const { setVariant } = useThemeReveal(reveal, start);
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="rounded-medium h-10 w-52" />;
  }

  return (
    <Segment
      aria-label={t("variant")}
      selectedKey={selectedVariant}
      onSelectionChange={(key) => {
        const next = coerceThemeVariant(String(key));
        if (next === selectedVariant) return;
        setVariant(next);
      }}
      size="sm"
      variant="ghost"
    >
      {THEME_VARIANTS.map((variant) => (
        <Segment.Item key={variant} id={variant}>
          {t(THEME_VARIANT_KEYS[variant])}
        </Segment.Item>
      ))}
    </Segment>
  );
};

export const useThemeSwitch = () => {
  return { ModeSwitch, VariantSwitch };
};
