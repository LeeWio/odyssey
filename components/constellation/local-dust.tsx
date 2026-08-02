"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface LocalDustProps {
  color: string;
  count?: number;
  radius?: number;
}

// Simple deterministic pseudo-random generator to maintain purity during render
function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function LocalDust({ color, count = 200, radius = 10 }: LocalDustProps) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Use index as part of the seed to get different values for each point
      const r = seedRandom(i + count + radius) * radius;
      const theta = seedRandom(i * 1.5 + count) * Math.PI * 2;
      const phi = Math.acos(2 * seedRandom(i * 2.1 + radius) - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, radius]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
