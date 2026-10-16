"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ArticleSatelliteProps {
  starPosition: THREE.Vector3;
  orbitRadius: number;
  speed?: number;
}

function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Lightweight orbiting marker — no Trail/Sparkles GPU cost. */
export function ArticleSatellite({ starPosition, orbitRadius, speed = 1 }: ArticleSatelliteProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { inclination, offset, rotationSpeed } = useMemo(() => {
    const seed = starPosition.x + starPosition.y + starPosition.z + orbitRadius;
    return {
      inclination: (seedRandom(seed) - 0.5) * Math.PI * 0.3,
      offset: seedRandom(seed + 1) * Math.PI * 2,
      rotationSpeed: (0.2 + seedRandom(seed + 2) * 0.3) * speed,
    };
  }, [orbitRadius, speed, starPosition]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() * rotationSpeed + offset;
    groupRef.current.position.set(
      Math.cos(time) * orbitRadius,
      Math.sin(time) * Math.sin(inclination) * orbitRadius,
      Math.sin(time) * Math.cos(inclination) * orbitRadius
    );
  });

  return (
    <group position={starPosition}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}
