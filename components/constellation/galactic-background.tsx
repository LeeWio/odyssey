"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 1. Rich Galaxy Elements: Distant Stars
const starsCount = 3000;
const starsPositions = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount; i++) {
  starsPositions[i * 3] = (Math.random() - 0.5) * 200;
  starsPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
  starsPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
}

// 1. Dust / Magnesium Clouds
const dustCount = 1000;
const dustPositionsData = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  const r = 20 + Math.random() * 40;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  dustPositionsData[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  dustPositionsData[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
  dustPositionsData[i * 3 + 2] = r * Math.cos(phi);
}

export function GalacticBackground() {
  const pointsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = -state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <group>
      {/* Background Stars - Subtle and small to avoid square look */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starsPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.4} sizeAttenuation />
      </points>

      {/* Magnesium Clouds / Dust - More ethereal */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositionsData, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          color="#44aaff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
