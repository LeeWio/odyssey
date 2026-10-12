"use client";

import { ShaderBackground } from "@/components/background/shader-background";

const PALETTES = [
  ["#172554", "#2563eb", "#93c5fd", "#dbeafe"],
  ["#042f2e", "#0f766e", "#5eead4", "#ccfbf1"],
  ["#3b0764", "#7e22ce", "#d8b4fe", "#f3e8ff"],
  ["#431407", "#c2410c", "#fdba74", "#ffedd5"],
] as const;

function hashSeed(value: string) {
  return Array.from(value).reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619),
    2166136261
  );
}

export function ProjectShader({ seed }: { seed: string }) {
  const hash = hashSeed(seed);
  const palette = PALETTES[Math.abs(hash) % PALETTES.length];
  const rotation = Math.abs(hash >>> 0) % 360;

  return (
    <ShaderBackground
      aria-hidden="true"
      colors={[...palette]}
      grainOverlay={0.1}
      mixing={0.62}
      positions={3}
      rotation={rotation}
      speed={0.06}
      variant="static-mesh-gradient"
      waveX={0.72}
      waveXShift={0.28}
      waveY={0.8}
      waveYShift={0.58}
    />
  );
}
