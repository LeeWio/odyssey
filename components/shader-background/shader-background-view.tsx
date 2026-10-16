"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ShaderBackground } from "@/components/background/shader-background";
import { cn } from "@/lib/utils";

import type { ArticleShaderPreset } from "./article-shader-presets";

const MAX_LIVE_SHADERS = 8;
const VIEWPORT_MARGIN = 80;
const SWAP_THRESHOLD = 180;

type CoverEntry = {
  element: HTMLElement;
  id: symbol;
  onChange: () => void;
};

const covers = new Map<symbol, CoverEntry>();
const live = new Set<symbol>();
let reconcileFrame = 0;

export function selectLiveCoverIds(
  items: { distance: number; eligible: boolean; id: string; live: boolean }[],
  limit: number,
  swapThreshold: number
) {
  const eligible = items.filter((item) => item.eligible).sort((a, b) => a.distance - b.distance);
  const next = new Set<string>();

  for (const item of eligible) {
    if (next.size >= limit) break;
    if (item.live) next.add(item.id);
  }
  for (const item of eligible) {
    if (next.size >= limit) break;
    next.add(item.id);
  }
  if (next.size < limit) return [...next];

  const farthest = eligible
    .filter((item) => next.has(item.id))
    .sort((a, b) => b.distance - a.distance)[0];
  const closestWaiting = eligible.find((item) => !next.has(item.id));
  if (farthest && closestWaiting && farthest.distance - closestWaiting.distance > swapThreshold) {
    next.delete(farthest.id);
    next.add(closestWaiting.id);
  }

  return [...next];
}

const RETAINED_FRAME_WIDTH = 960;

function captureFrame(element: HTMLElement) {
  const shader = element.querySelector<
    HTMLElement & { paperShaderMount?: { render: (time: number) => void } }
  >("[data-paper-shader]");
  const source = shader?.querySelector("canvas");
  const target = element.querySelector<HTMLCanvasElement>("[data-shader-frame]");
  if (!shader?.paperShaderMount || !source || !target) return;

  shader.paperShaderMount.render(performance.now());
  if (source.width === 0 || source.height === 0) return;
  const scale = Math.min(1, RETAINED_FRAME_WIDTH / source.width);
  target.width = Math.max(1, Math.round(source.width * scale));
  target.height = Math.max(1, Math.round(source.height * scale));
  target.getContext("2d")?.drawImage(source, 0, 0, target.width, target.height);
}

function reconcile() {
  const viewportHeight = window.innerHeight;
  const center = viewportHeight / 2;
  const ranked = [...covers.values()].map((entry) => {
    const rect = entry.element.getBoundingClientRect();
    return {
      distance: Math.abs(rect.top + rect.height / 2 - center),
      eligible:
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > -VIEWPORT_MARGIN &&
        rect.top < viewportHeight + VIEWPORT_MARGIN,
      entry,
      id: String(entry.id),
      live: live.has(entry.id),
    };
  });
  const selected = new Set(
    selectLiveCoverIds(ranked, MAX_LIVE_SHADERS, SWAP_THRESHOLD).map((id) => id)
  );
  const selectedEntries = ranked.filter((item) => selected.has(item.id));

  for (const item of ranked) {
    const shouldLive = selectedEntries.some(
      (selectedItem) => selectedItem.entry.id === item.entry.id
    );
    if (item.live === shouldLive) continue;
    if (!shouldLive) captureFrame(item.entry.element);
    if (shouldLive) live.add(item.entry.id);
    else live.delete(item.entry.id);
    item.entry.onChange();
  }
}

function scheduleReconcile() {
  if (reconcileFrame) return;
  reconcileFrame = window.requestAnimationFrame(() => {
    reconcileFrame = 0;
    reconcile();
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("scroll", scheduleReconcile, { capture: true, passive: true });
  window.addEventListener("resize", scheduleReconcile);
}

function registerCover(entry: CoverEntry) {
  covers.set(entry.id, entry);
  scheduleReconcile();
  return () => {
    captureFrame(entry.element);
    covers.delete(entry.id);
    live.delete(entry.id);
    scheduleReconcile();
  };
}

function backdrop(preset: ArticleShaderPreset) {
  const config = preset.config as {
    colorBack?: string;
    colorFill?: string;
    colorFront?: string;
    colors?: readonly string[];
  };
  const colors = [
    config.colorBack,
    ...(config.colors ?? []),
    config.colorFront,
    config.colorFill,
    preset.swatch,
  ].filter((color): color is string => Boolean(color));
  const unique = [...new Set(colors)].slice(0, 4);
  if (unique.length < 2) return unique[0] ?? preset.swatch;
  return `linear-gradient(145deg, ${unique.join(", ")})`;
}

export function ShaderBackgroundView({
  className,
  mode,
  preset,
  scheduled = true,
}: {
  className?: string;
  mode: "static" | "motion";
  preset: ArticleShaderPreset;
  scheduled?: boolean;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const play = mode === "motion" && !reducedMotion;
  const speed = "speed" in preset.config ? preset.config.speed : undefined;
  const hostRef = useRef<HTMLDivElement>(null);
  const slotId = useRef(Symbol(preset.id));
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [sized, setSized] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hasSlot, setHasSlot] = useState(false);

  useEffect(() => {
    if (!host) return;
    const updateSize = () => setSized(host.clientWidth > 0 && host.clientHeight > 0);
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry?.isIntersecting ?? false);
        scheduleReconcile();
      },
      { rootMargin: `${VIEWPORT_MARGIN}px` }
    );
    intersectionObserver.observe(host);
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [host]);

  useEffect(() => {
    if (play || !visible || !sized || !hostRef.current) {
      setHasSlot(false);
      return;
    }
    return registerCover({
      element: hostRef.current,
      id: slotId.current,
      onChange: () => setHasSlot(live.has(slotId.current)),
    });
  }, [play, sized, visible]);

  const mounted = play ? sized : scheduled ? hasSlot : false;

  return (
    <div
      ref={(node) => {
        hostRef.current = node;
        setHost(node);
      }}
      aria-hidden="true"

      className={cn("h-full w-full overflow-hidden", className)}
    >
      <div className="absolute inset-0" style={{ background: backdrop(preset) }} />
      <canvas data-shader-frame="" className="absolute inset-0 h-full w-full" />
      {mounted ? (
        <ShaderBackground
          key={preset.id}
          className="absolute inset-0 h-full w-full"
          maxPixelCount={1280 * 720}
          minPixelRatio={1}
          webGlContextAttributes={{ alpha: false }}
          {...preset.config}
          {...(speed === undefined ? {} : { speed: play ? speed : 0 })}
        />
      ) : null}
    </div>
  );
}
